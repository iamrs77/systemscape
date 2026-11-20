import { useFrame } from '@react-three/fiber';
import { useCallback, type RefObject } from 'react';
import { Vector3, type Camera } from 'three';
import type { Component, System } from '@/model/schema';
import { formatUtilization } from '@/sim/format';
import { useApp } from '@/store';
import { layerLabel, sceneColor, statusColor } from '@/theme';
import { cx } from '@/ui/cx';
import { rowId, type Anchor, type SceneLayout } from './layout';

/**
 * Labels are plain HTML laid over the canvas, so they stay sharp, can be
 * tabbed to, and work with screen readers. Each frame, the tracker inside
 * the canvas moves every label to where its point in the scene appears.
 */

export type Registry = RefObject<Map<string, HTMLElement>>;
/** Inside the canvas: moves the labels along with the camera. */
export function LabelTracker({ anchors, registry }: { anchors: Anchor[]; registry: Registry }) {
	useFrame(({ camera, size }) =>
		place(anchors, registry.current, camera, size.width, size.height),
	);
	return null;
}

const point = new Vector3();

function place(
	anchors: Anchor[],
	elements: Map<string, HTMLElement>,
	camera: Camera,
	width: number,
	height: number,
) {
	// anchors come most important first; a label overlapping one already shown hides
	const shown: Box[] = [];
	for (const anchor of anchors) {
		const element = elements.get(anchor.id);
		if (!element) continue;
		point.set(...anchor.position).project(camera);
		const x = ((point.x + 1) / 2) * width;
		const y = ((1 - point.y) / 2) * height;
		const shift = anchor.alignEnd ? '-100%' : '-50%';
		element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(${shift}, -50%)`;
		// behind the camera
		element.style.visibility = point.z > 1 ? 'hidden' : 'visible';
		if (!anchor.declutter) continue;
		const halfWidth = element.offsetWidth / 2 + 1;
		const halfHeight = element.offsetHeight / 2 + 1;
		const box = {
			left: x - halfWidth,
			right: x + halfWidth,
			top: y - halfHeight,
			bottom: y + halfHeight,
		};
		const hidden = shown.some(
			(b) =>
				b.left < box.right &&
				box.left < b.right &&
				b.top < box.bottom &&
				box.top < b.bottom,
		);
		if (!hidden) shown.push(box);
		element.toggleAttribute('data-hidden', hidden);
	}
}

type Box = { left: number; right: number; top: number; bottom: number };

function track(registry: Registry, id: string, element: HTMLElement | null) {
	if (!element) return;
	registry.current.set(id, element);
	return () => {
		registry.current.delete(id);
	};
}

/** Outside the canvas: the label elements themselves. */
export function Labels({
	system,
	layout,
	registry,
	inJourney,
}: {
	system: System;
	layout: SceneLayout;
	registry: Registry;
	inJourney: Set<string> | null;
}) {
	return (
		<div className="scene-labels pointer-events-none absolute inset-0 overflow-hidden">
			{layout.rows.map((row) => (
				<RowLabel key={row.layer} id={rowId(row.layer)} registry={registry}>
					{layerLabel[row.layer]}
				</RowLabel>
			))}
			{system.components.map((component) => (
				<NodeLabel
					key={component.id}
					component={component}
					registry={registry}
					dimmed={inJourney !== null && !inJourney.has(component.id)}
				/>
			))}
		</div>
	);
}

function RowLabel({
	id,
	registry,
	children,
}: {
	id: string;
	registry: Registry;
	children: string;
}) {
	const ref = useCallback((el: HTMLElement | null) => track(registry, id, el), [registry, id]);
	return (
		<span ref={ref} className="scene-label row-label" aria-hidden="true">
			{children}
		</span>
	);
}

function NodeLabel({
	component,
	registry,
	dimmed,
}: {
	component: Component;
	registry: Registry;
	dimmed: boolean;
}) {
	const state = useApp((s) => s.result.components[component.id]!);
	const selected = useApp((s) => s.selected === component.id);
	const hovered = useApp((s) => s.hovered === component.id);
	const select = useApp((s) => s.select);
	const hover = useApp((s) => s.hover);
	const ref = useCallback(
		(el: HTMLElement | null) => track(registry, component.id, el),
		[registry, component.id],
	);

	const isClient = component.kind === 'client';
	const down = state.status === 'down';
	const color = isClient ? sceneColor.client : statusColor[state.status];
	// the ring around each shape already shows how busy it is: spell it out
	// only where it matters, to keep the labels small
	const showMetric =
		!isClient &&
		(selected || hovered || state.status === 'busy' || state.status === 'overloaded' || down);
	const metric = down ? 'down' : `${formatUtilization(state.utilization)} · ${state.instances}×`;

	return (
		<button
			ref={ref}
			type="button"
			className={cx('scene-label node-label pointer-events-auto', dimmed && 'opacity-35')}
			data-selected={selected || undefined}
			aria-pressed={selected}
			aria-label={`${component.name}: ${isClient ? 'app' : down ? 'down' : `${formatUtilization(state.utilization)} busy, ${state.instances} instances`}`}
			onClick={() => select(component.id)}
			onMouseEnter={() => hover(component.id)}
			onMouseLeave={() => hover(null)}
			onFocus={() => hover(component.id)}
			onBlur={() => hover(null)}
		>
			<span className="node-label__name">
				<span className="node-label__dot" style={{ background: color }} />
				{component.name}
			</span>
			{showMetric && <span className="node-label__metric">{metric}</span>}
		</button>
	);
}
