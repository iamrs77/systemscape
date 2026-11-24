import {
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type ReactNode,
	type RefObject,
} from 'react';
import type { Component, System } from '@/model/schema';
import type { SimResult, Status } from '@/sim/engine';
import { layerLabel } from '@/theme';
import {
	BLOCK_TOP,
	INK,
	extrude,
	GROUND,
	groundAt,
	kindPalette,
	LOT_RING,
	nearness,
	piecesFor,
	shadowOf,
	project,
	troublePalette,
	type Palette,
	type Pt,
	type Solid,
} from './geometry';
import { iconPaths } from './icons';
import { FAILED, labelText, toneColour } from './labels';
import { edgeTraffic, layoutSystem, LOT_SIZE, pathLength, type Vec2 } from './layout';

/**
 * A system drawn as an isometric diagram: a row (tier) per layer, a block per
 * copy of each part, arrows for the calls between them, and dots for the
 * requests travelling along them. Plain SVG: crisp at any size, no WebGL.
 */

const REQUEST = '#ef8a3d';
const BACKGROUND_REQUEST = '#9b80df';
const BREAKER = '#d39a1c';

/** How a connection is drawn: the step being explained, requests flowing, or still. */
export type EdgeLook = 'current' | 'flow' | 'still';

export type DiagramProps = {
	system: System;
	result: SimResult;
	/** The connections to draw, and how. */
	edges: ReadonlyMap<string, EdgeLook>;
	/** Whose requests the connections carry: one journey's, or every journey's (null). */
	journeyId: string | null;
	/** The parts at full strength; the rest fade back. Everything when null. */
	focus?: ReadonlySet<string> | null;
	/** The parts to zoom in on, moving smoothly when they change. The whole system when null. */
	zoom?: ReadonlySet<string> | null;
	selected?: string | null;
	onSelect?(id: string | null): void;
	/** Besides its name, a label says nothing more, or how busy the part is. */
	detail?: 'none' | 'load';
	/** Show how many copies of each part are running, as “×3” badges. */
	badges?: boolean;
	/** For small previews: no labels or tier names, and nothing to click. */
	bare?: boolean;
	paused?: boolean;
	/** What the picture shows, for screen readers. */
	title: string;
};

const LABEL_SIZE = 0.5;
const LINE = 0.66;
const DETAIL_SIZE = 0.44;
/** IBM Plex Sans is narrower than its mono: about half an em a character. */
const SANS = 0.53;
/** IBM Plex Mono's characters are 0.6em wide, so label widths can be worked out. */
const CHAR = 0.6;

function mix(a: string, b: string, t: number) {
	const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
	const out = [0, 1, 2].map((i) =>
		Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t),
	);
	return `#${out.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function paletteFor(component: Component, status: Status | undefined): Palette {
	if (status === 'overloaded') return troublePalette.overloaded;
	if (status === 'down') return troublePalette.down;
	return kindPalette[component.kind];
}

/** A number in [0, 1) that's always the same for the same text. */
function hash(text: string) {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
	return (h >>> 0) / 2 ** 32;
}

const path = (points: Pt[]) =>
	points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`).join(' ');

type Drawn = {
	component: Component;
	x: number;
	z: number;
	near: number;
	instances: number;
	status: Status | undefined;
	utilization: number;
	solids: {
		solid: Solid;
		at: Vec2;
		icon: keyof typeof iconPaths | null;
		iconSize: number;
		plate: number;
		/** Its shadow on the ground, soft edge first; none for a block stacked on another. */
		shadows: string[];
	}[];
	/** The highest point of its block on the page. */
	peak: number;
	/** Where the bottom of its nameplate sits: at the front of its block, inside its lot, where no arrow goes. */
	labelAt: Pt;
};

export function Diagram({
	system,
	result,
	edges,
	journeyId,
	focus = null,
	zoom = null,
	selected = null,
	onSelect,
	detail = 'none',
	badges = false,
	bare = false,
	paused = false,
	title,
}: DiagramProps) {
	const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
	const svg = useRef<SVGSVGElement>(null);
	const [hovered, setHovered] = useState<string | null>(null);
	const layout = useMemo(() => layoutSystem(system), [system]);
	const traffic = useMemo(
		() => edgeTraffic(system, result, journeyId),
		[system, result, journeyId],
	);

	useEffect(() => {
		const element = svg.current;
		if (!element || typeof element.pauseAnimations !== 'function') return;
		if (paused) element.pauseAnimations();
		else element.unpauseAnimations();
	}, [paused]);

	const parts = useMemo<Drawn[]>(
		() =>
			system.components
				.map((component) => {
					const [x, , z] = layout.nodes[component.id]!.position;
					const state = result.components[component.id];
					const instances = state?.instances ?? component.instances;
					const solids: Drawn['solids'] = piecesFor(component).map((piece) => {
						const at: Vec2 = [x + piece.offset[0], z + piece.offset[1]];
						return {
							solid: extrude(piece.contour, at, piece.base, piece.height),
							at,
							icon: piece.icon,
							iconSize: piece.iconSize,
							plate: piece.plate,
							shadows:
								piece.base > 0
									? []
									: [1.16, 1.06].map((grow) => shadowOf(piece.contour, at, grow)),
						};
					});
					const peaks = solids.map((s) => s.solid.peak);
					return {
						component,
						x,
						z,
						near: nearness(x, z),
						instances,
						status: state?.status,
						utilization: state?.utilization ?? 0,
						solids,
						peak: Math.min(...peaks),
						labelAt: [project(x, z)[0], project(x, z - LOT_SIZE / 2)[1] - 0.08] as Pt,
					};
				})
				.sort((a, b) => a.near - b.near),
		[system, layout, result],
	);

	const visibleLabel = (id: string) =>
		!bare && (focus === null || focus.has(id) || hovered === id || selected === id);
	const dimmed = (id: string) => focus !== null && !focus.has(id);

	const labels = parts
		.filter((p) => visibleLabel(p.component.id))
		.map((p) => labelFor(p, detail));

	const { minX, maxX, minZ, maxZ } = layout.bounds;
	const tiers = layout.rows.map((row) => {
		const count = system.components.filter((c) => c.layer === row.layer).length;
		const at = project(row.left - 0.95, row.z);
		return { row, count, at, text: layerLabel[row.layer].toUpperCase() };
	});

	// a box round what this company runs, and one round other companies' systems
	const tierLeft = Math.min(...tiers.map((t) => t.at[0] - t.text.length * 0.5 * CHAR - 0.5));
	const regionLeft = (bare ? minX : Math.min(minX, tierLeft)) - 0.3;
	const regionRight = maxX + 0.3;
	const regions = layout.boundary
		? [
				{
					id: 'ours',
					name: 'OUR SYSTEM',
					top: maxZ + 0.6,
					bottom: layout.boundary.z + 0.4,
					colour: '#5048e5',
					fill: '#5048e5',
				},
				{
					id: 'theirs',
					name: 'OUTSIDE OUR SYSTEM: OTHER COMPANIES',
					top: layout.boundary.z - 0.4,
					bottom: minZ - 0.2,
					colour: '#c2416a',
					fill: '#e2738f',
				},
			]
		: [];

	// the whole picture, and the part of it to show
	const whole = boxAround(
		[
			project(minX, minZ),
			project(maxX, minZ),
			project(maxX, maxZ),
			project(minX, maxZ),
			...regions.flatMap((r): Pt[] => [
				project(regionLeft, r.top),
				project(regionRight, r.bottom),
			]),
			...parts.map((p) => p.labelAt),
			...labels.flatMap((l) => [
				[l.x - l.width / 2, l.y - l.height] as Pt,
				[l.x + l.width / 2, l.y] as Pt,
			]),
			...(bare
				? []
				: tiers.map((t): Pt => [t.at[0] - t.text.length * 0.5 * CHAR - 0.4, t.at[1]])),
		],
		bare ? 0.6 : 1.1,
	);
	const zoomed = parts.filter((p) => zoom?.has(p.component.id));
	// the names of the rows being zoomed in on stay in view too
	const zoomedRows = new Set(zoomed.map((p) => p.component.layer));
	const shown =
		zoomed.length === 0
			? whole
			: within(
					boxAround(
						[
							...zoomed.flatMap((p): Pt[] => [
								project(p.x - LOT_SIZE / 2 - 0.6, p.z + LOT_SIZE / 2 + 0.6),
								project(p.x + LOT_SIZE / 2 + 0.6, p.z - LOT_SIZE / 2 - 0.6),
								[p.labelAt[0], p.peak - 0.4],
							]),
							...(bare
								? []
								: tiers
										.filter((t) => zoomedRows.has(t.row.layer))
										.map((t): Pt => [
											t.at[0] - t.text.length * 0.5 * CHAR - 0.4,
											t.at[1],
										])),
						],
						1.4,
					),
					whole,
				);
	const fitted = formatBox(shown);
	const wholeKey = formatBox(whole);

	// you can move and zoom the picture yourself; the next step fits it again
	const [moved, setMoved] = useState<{ fitted: string; box: string; glide: boolean } | null>(
		null,
	);
	const own = moved !== null && moved.fitted === fitted ? moved : null;
	const viewBox = useAnimatedViewBox(svg, own ? own.box : fitted, own !== null && !own.glide);
	const keep = (box: Box, glide = false) =>
		setMoved({ fitted, box: formatBox(clampBox(box, whole)), glide });

	const pointers = useRef(new Map<number, Pt>());
	const gesture = useRef<{
		box: Box;
		at: Pt;
		spread: number;
		anchor: Pt;
		pixels: number;
		moved: boolean;
	} | null>(null);
	const dragged = useRef(false);

	/** Starts a drag or a pinch from wherever the fingers or the mouse are now. */
	const begin = () => {
		const element = svg.current;
		if (!element) return;
		const at = middle(pointers.current);
		gesture.current = {
			box: showing(element),
			at,
			spread: spread(pointers.current),
			anchor: toPicture(element, at),
			pixels: pixelsPerUnit(element),
			moved: false,
		};
	};

	// the scroll wheel (or a trackpad pinch) zooms in on the pointer
	useEffect(() => {
		const element = svg.current;
		if (!element || bare) return;
		const limits = parseBox(wholeKey);
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const factor = Math.exp(event.deltaY * (event.ctrlKey ? 0.01 : 0.0015));
			const at = toPicture(element, [event.clientX, event.clientY]);
			const next = clampBox(zoomAround(showing(element), factor, at, limits), limits);
			element.setAttribute('viewBox', formatBox(next));
			setMoved({ fitted, box: formatBox(next), glide: false });
		};
		element.addEventListener('wheel', onWheel, { passive: false });
		return () => element.removeEventListener('wheel', onWheel);
	}, [bare, fitted, wholeKey]);

	const zoomBy = (factor: number) => {
		const element = svg.current;
		if (!element) return;
		const box = showing(element);
		keep(zoomAround(box, factor, [box.x + box.w / 2, box.y + box.h / 2], whole), true);
	};

	const drawnEdges = layout.edges.filter((e) => edges.has(e.key));
	const lookOf = (key: string) => edges.get(key)!;
	const ordered = [...drawnEdges].sort((a, b) => rank(lookOf(a.key)) - rank(lookOf(b.key)));

	const select = (id: string) => onSelect?.(id === selected ? null : id);
	const onKey = (id: string) => (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			select(id);
		}
	};

	return (
		<div className="relative h-full w-full">
			<svg
				ref={svg}
				viewBox={viewBox}
				preserveAspectRatio="xMidYMid meet"
				className={
					bare
						? 'h-full w-full select-none'
						: 'h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing lg:touch-none'
				}
				role={bare ? 'img' : 'group'}
				aria-label={title}
				onPointerDown={
					bare
						? undefined
						: (event) => {
								pointers.current.set(event.pointerId, [
									event.clientX,
									event.clientY,
								]);
								dragged.current = false;
								begin();
							}
				}
				onPointerMove={(event) => {
					const g = gesture.current;
					const element = svg.current;
					if (!g || !element || !pointers.current.has(event.pointerId)) return;
					pointers.current.set(event.pointerId, [event.clientX, event.clientY]);
					const at = middle(pointers.current);
					const [dx, dy] = [at[0] - g.at[0], at[1] - g.at[1]];
					const pinching = pointers.current.size > 1;
					if (!g.moved && !pinching && Math.hypot(dx, dy) < 4) return;
					if (!g.moved) {
						g.moved = true;
						dragged.current = true;
						element.setPointerCapture(event.pointerId);
					}
					const factor =
						pinching && g.spread > 0 ? g.spread / spread(pointers.current) : 1;
					const zoomed = zoomAround(g.box, factor, g.anchor, whole);
					const pixels = g.pixels * (g.box.w / zoomed.w);
					const next = clampBox(
						{ ...zoomed, x: zoomed.x - dx / pixels, y: zoomed.y - dy / pixels },
						whole,
					);
					element.setAttribute('viewBox', formatBox(next));
				}}
				onPointerUp={(event) => {
					const g = gesture.current;
					pointers.current.delete(event.pointerId);
					if (g?.moved && svg.current) {
						setMoved({ fitted, box: formatBox(showing(svg.current)), glide: false });
					}
					// one finger lifted from a pinch: carry on dragging with the other
					if (pointers.current.size > 0) begin();
					else gesture.current = null;
				}}
				onPointerCancel={(event) => {
					pointers.current.delete(event.pointerId);
					if (pointers.current.size === 0) gesture.current = null;
				}}
				// a drag isn't a click: don't select what it ends over
				onClickCapture={(event) => {
					if (!dragged.current) return;
					event.stopPropagation();
					dragged.current = false;
				}}
			>
				<defs>
					{/* light catching the top of a block, brightest at the back */}
					<linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
						<stop offset="0.55" stopColor="#ffffff" stopOpacity="0.2" />
						<stop offset="1" stopColor="#ffffff" stopOpacity="0" />
					</linearGradient>
					{(
						[
							['ink', INK],
							['red', FAILED],
							['amber', BREAKER],
						] as const
					).map(([name, colour]) => (
						<marker
							key={name}
							id={`${uid}-arrow-${name}`}
							viewBox="0 0 10 10"
							refX="8.5"
							refY="5"
							markerWidth="0.62"
							markerHeight="0.62"
							markerUnits="userSpaceOnUse"
							orient="auto"
						>
							<path d="M0 0.5 10 5 0 9.5z" fill={colour} />
						</marker>
					))}
				</defs>

				{/* the paper, and a tier per layer */}
				<rect
					x="-500"
					y="-500"
					width="1000"
					height="1000"
					fill="transparent"
					onClick={() => onSelect?.(null)}
				/>
				<g transform={GROUND} pointerEvents="none">
					{regions.map((region) => (
						<rect
							key={region.id}
							x={regionLeft}
							y={-region.top}
							width={regionRight - regionLeft}
							height={region.top - region.bottom}
							rx="1"
							fill={region.fill}
							fillOpacity="0.03"
							stroke={region.colour}
							strokeOpacity="0.35"
							strokeWidth="1.2"
							strokeDasharray="8 6"
							vectorEffect="non-scaling-stroke"
						/>
					))}
					{layout.rows.map((row) => {
						const near = row.z - LOT_SIZE / 2 - 0.5;
						const far = row.z + LOT_SIZE / 2 + 0.5;
						return (
							<rect
								key={row.layer}
								x={row.left - 0.5}
								y={-far}
								width={row.right - row.left + 1}
								height={far - near}
								rx="0.9"
								fill="#e9edf5"
								fillOpacity="0.6"
							/>
						);
					})}
				</g>
				{!bare &&
					tiers.map(({ row, at, text }) => (
						<text
							key={row.layer}
							x={at[0]}
							y={at[1] + 0.17}
							textAnchor="end"
							fontSize="0.46"
							fontWeight="600"
							letterSpacing="0.1"
							fill="#8a93a6"
							pointerEvents="none"
						>
							{text}
						</text>
					))}
				{!bare &&
					regions.map((region) => {
						// a name tag on the box's top edge, on a solid background so nothing crosses it
						const [x, y] = project(regionLeft + 0.5, region.top);
						// monospace characters, plus the letter spacing
						const width = region.name.length * (0.52 * CHAR + 0.04) + 0.7;
						return (
							<g key={region.id} pointerEvents="none">
								<rect
									x={x}
									y={y - 0.42}
									width={width}
									height="0.84"
									rx="0.42"
									fill="#ffffff"
									stroke={region.colour}
									strokeWidth="1.2"
									vectorEffect="non-scaling-stroke"
								/>
								<text
									x={x + 0.35}
									y={y + 0.17}
									fontSize="0.52"
									fontWeight="700"
									letterSpacing="0.04"
									fill={region.colour}
									className="font-mono"
								>
									{region.name}
								</text>
							</g>
						);
					})}

				{/* a ring on the ground round the selected part */}
				{parts
					.filter((p) => p.component.id === selected || p.component.id === hovered)
					.map((p) => (
						<polygon
							key={`ring-${p.component.id}`}
							transform={groundAt(p.x, p.z)}
							points={LOT_RING.map(
								([x, z]) => `${x.toFixed(3)},${(-z).toFixed(3)}`,
							).join(' ')}
							fill={p.component.id === selected ? '#5048e5' : INK}
							fillOpacity={p.component.id === selected ? 0.14 : 0.05}
							stroke={p.component.id === selected ? '#5048e5' : '#7b8499'}
							strokeWidth="1.6"
							strokeDasharray={p.component.id === selected ? undefined : '4 3'}
							vectorEffect="non-scaling-stroke"
							pointerEvents="none"
						/>
					))}

				{/* the calls between parts, and requests moving along them */}
				<g pointerEvents="none">
					{ordered.map((edge) => {
						const look = lookOf(edge.key);
						const t = traffic.get(edge.key);
						const points = edge.lane.map(([x, z]) => project(x, z, 0.03));
						const d = path(points);
						const failing = t !== undefined && t.active && t.failRate > 0.2;
						const colour = t?.breakerOpen ? BREAKER : failing ? FAILED : INK;
						const marker = t?.breakerOpen ? 'amber' : failing ? 'red' : 'ink';
						const width = look === 'current' ? 2.6 : look === 'flow' ? 1.7 : 1.2;
						const flowing =
							look !== 'still' && t !== undefined && t.active && t.sent > 0;
						return (
							<g key={edge.key} opacity={look === 'still' ? 0.4 : 1}>
								{look === 'current' && (
									<path
										d={d}
										fill="none"
										stroke="#f6c79c"
										strokeWidth="9"
										strokeLinecap="round"
										strokeLinejoin="round"
										vectorEffect="non-scaling-stroke"
									/>
								)}
								<path
									d={d}
									fill="none"
									stroke={colour}
									strokeWidth={width}
									strokeDasharray={edge.mode === 'async' ? '6 4' : undefined}
									strokeLinejoin="round"
									vectorEffect="non-scaling-stroke"
									markerEnd={`url(#${uid}-arrow-${marker})`}
								/>
								{flowing && (
									<Requests
										id={edge.key}
										d={d}
										length={pathLength(edge.lane)}
										sent={t.sent}
										failRate={t.failRate}
										background={edge.mode === 'async'}
										extra={look === 'current'}
									/>
								)}
							</g>
						);
					})}
				</g>

				{/* the parts, from the back to the front */}
				{parts.map((part) => {
					const id = part.component.id;
					const palette = paletteFor(part.component, part.status);
					const down = part.status === 'down';
					return (
						<g
							key={id}
							opacity={dimmed(id) && hovered !== id && selected !== id ? 0.12 : 1}
							className={bare ? undefined : 'cursor-pointer'}
							onClick={bare ? undefined : () => select(id)}
							onPointerEnter={bare ? undefined : () => setHovered(id)}
							onPointerLeave={bare ? undefined : () => setHovered(null)}
							aria-hidden="true"
						>
							{part.solids.map(({ shadows }) =>
								shadows.map((points, i) => (
									<polygon
										key={`shadow-${i}`}
										points={points}
										fill={INK}
										opacity={i === 0 ? 0.035 : 0.06}
									/>
								)),
							)}
							{part.solids.map(({ solid, icon, iconSize, plate }, i) => {
								const top = `translate(${solid.topCentre[0].toFixed(3)} ${solid.topCentre[1].toFixed(3)}) ${BLOCK_TOP}`;
								return (
									<g key={i}>
										<SolidShape
											solid={solid}
											palette={palette}
											shine={`url(#${uid}-shine)`}
											dashed={down}
										/>
										{plate > 0 && (
											<g transform={top}>
												<circle
													r={plate}
													fill="#ffffff"
													fillOpacity={down ? 0.55 : 0.92}
													stroke={edgeOf(palette)}
													strokeOpacity="0.35"
													strokeWidth="1"
													vectorEffect="non-scaling-stroke"
												/>
											</g>
										)}
										{icon && (
											<g
												transform={`${top} scale(${(iconSize / 24).toFixed(4)})`}
											>
												<path
													d={iconPaths[icon]}
													transform="translate(-12 -12)"
													fill="none"
													stroke={down ? '#7b8499' : glyphOf(palette)}
													strokeWidth="1.4"
													strokeLinecap="round"
													strokeLinejoin="round"
													vectorEffect="non-scaling-stroke"
												/>
											</g>
										)}
									</g>
								);
							})}
							{badges && part.instances > 1 && (
								<Badge
									at={part.solids.at(-1)!.solid.topCentre}
									text={`×${part.instances}`}
								/>
							)}
						</g>
					);
				})}

				{/* labels on top of everything, and they're the buttons the keyboard reaches */}
				{labels.map((label) => (
					<g
						key={label.id}
						role="button"
						tabIndex={0}
						aria-label={label.spoken}
						aria-pressed={label.id === selected}
						className="diagram-label cursor-pointer"
						onClick={() => select(label.id)}
						onKeyDown={onKey(label.id)}
						onPointerEnter={() => setHovered(label.id)}
						onPointerLeave={() => setHovered(null)}
						onFocus={() => setHovered(label.id)}
						onBlur={() => setHovered(null)}
					>
						{/* shows when it's selected, or focused from the keyboard */}
						<rect
							className="diagram-label__pill"
							x={label.x - label.width / 2}
							y={label.y - label.height}
							width={label.width}
							height={label.height}
							rx="0.3"
							fill={label.id === selected ? '#e0e3ff' : '#ffffff'}
							fillOpacity={label.id === selected ? 1 : 0.88}
						/>
						<text
							x={label.x}
							textAnchor="middle"
							fontSize={LABEL_SIZE}
							fontWeight="600"
							fill={label.id === selected ? '#3730a3' : INK}
							stroke="#ffffff"
							strokeWidth="0.2"
							strokeLinejoin="round"
							paintOrder="stroke"
						>
							{label.lines.map((line, i) => (
								<tspan
									key={line}
									x={label.x}
									y={label.y - label.height + 0.62 + i * LINE}
								>
									{line}
								</tspan>
							))}
						</text>
						{label.detail && (
							<text
								x={label.x}
								y={label.y - label.height + 0.55 + label.lines.length * LINE}
								textAnchor="middle"
								fontSize={DETAIL_SIZE}
								fontWeight="600"
								fill={label.detailColour}
								stroke="#ffffff"
								strokeWidth="0.18"
								strokeLinejoin="round"
								paintOrder="stroke"
								className="font-mono"
							>
								{label.detail}
							</text>
						)}
					</g>
				))}
			</svg>
			{!bare && (
				<div
					role="group"
					aria-label="Move the diagram"
					className="absolute right-2 bottom-2 flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur"
				>
					<span className="hidden px-2 text-[11px] text-slate-500 xl:inline">
						Drag to move · scroll to zoom
					</span>
					<ViewButton label="Zoom out" onClick={() => zoomBy(1.3)}>
						<path d="M5 12h14" />
					</ViewButton>
					<ViewButton label="Zoom in" onClick={() => zoomBy(1 / 1.3)}>
						<path d="M12 5v14M5 12h14" />
					</ViewButton>
					<button
						type="button"
						onClick={() => setMoved(null)}
						disabled={own === null}
						className="h-7 rounded-lg px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
					>
						Fit
					</button>
				</div>
			)}
		</div>
	);
}

function ViewButton({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick(): void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			className="grid size-7 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
		>
			<svg
				viewBox="0 0 24 24"
				width="15"
				height="15"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				aria-hidden="true"
			>
				{children}
			</svg>
		</button>
	);
}

/** What the picture is showing right now, mid-glide or not. */
function showing(element: SVGSVGElement): Box {
	const v = element.viewBox.baseVal;
	return { x: v.x, y: v.y, w: v.width, h: v.height };
}

/** How many screen pixels one unit of the picture takes up. */
function pixelsPerUnit(element: SVGSVGElement) {
	const matrix = element.getScreenCTM?.();
	return matrix ? matrix.a : 1;
}

/** A point on the screen, in the picture's units. */
function toPicture(element: SVGSVGElement, [x, y]: Pt): Pt {
	const matrix = element.getScreenCTM?.();
	if (!matrix) return [0, 0];
	const p = new DOMPoint(x, y).matrixTransform(matrix.inverse());
	return [p.x, p.y];
}

function middle(points: Map<number, Pt>): Pt {
	const list = [...points.values()];
	return [
		list.reduce((sum, p) => sum + p[0], 0) / Math.max(1, list.length),
		list.reduce((sum, p) => sum + p[1], 0) / Math.max(1, list.length),
	];
}

function spread(points: Map<number, Pt>) {
	const [a, b] = [...points.values()];
	return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 0;
}

/** Zooms a box in or out (a factor below 1 zooms in) around a point, within sensible limits. */
function zoomAround(box: Box, factor: number, [ax, ay]: Pt, whole: Box): Box {
	const w = Math.min(whole.w * 1.6, Math.max(whole.w * 0.12, box.w * factor));
	const f = w / box.w;
	return { x: ax - (ax - box.x) * f, y: ay - (ay - box.y) * f, w, h: box.h * f };
}

/** Keeps at least a third of the picture in view, however far it's dragged. */
function clampBox(box: Box, whole: Box): Box {
	return {
		...box,
		x: Math.min(whole.x + whole.w - box.w / 3, Math.max(whole.x - (box.w * 2) / 3, box.x)),
		y: Math.min(whole.y + whole.h - box.h / 3, Math.max(whole.y - (box.h * 2) / 3, box.y)),
	};
}

const parseBox = (text: string): Box => {
	const [x = 0, y = 0, w = 1, h = 1] = text.split(' ').map(Number);
	return { x, y, w, h };
};

function rank(look: EdgeLook) {
	return look === 'still' ? 0 : look === 'flow' ? 1 : 2;
}

function labelFor(part: Drawn, detail: 'none' | 'load') {
	const text = labelText(part.component, part, detail);
	const longest = Math.max(
		...text.lines.map((l) => l.length * LABEL_SIZE * SANS),
		(text.detail?.length ?? 0) * DETAIL_SIZE * CHAR,
	);
	return {
		id: part.component.id,
		lines: text.lines,
		detail: text.detail,
		detailColour: toneColour[text.tone],
		spoken: text.spoken,
		dot: text.dot,
		x: part.labelAt[0],
		y: part.labelAt[1],
		width: longest + 0.6,
		height: 0.2 + text.lines.length * LINE + (text.detail ? 0.5 : 0),
	};
}

type Box = { x: number; y: number; w: number; h: number };

function boxAround(points: Pt[], pad: number): Box {
	const xs = points.map((p) => p[0]);
	const ys = points.map((p) => p[1]);
	const [x, y] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
	return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
}

/** A zoomed-in box: no smaller than half the whole picture, and never past its edges. */
function within(box: Box, whole: Box): Box {
	const w = Math.min(whole.w, Math.max(box.w, whole.w * 0.5));
	const h = Math.min(whole.h, Math.max(box.h, whole.h * 0.5));
	const cx = box.x + box.w / 2;
	const cy = box.y + box.h / 2;
	const x = Math.min(whole.x + whole.w - w, Math.max(whole.x, cx - w / 2));
	const y = Math.min(whole.y + whole.h - h, Math.max(whole.y, cy - h / 2));
	return { x, y, w, h };
}

const formatBox = (b: Box) => [b.x, b.y, b.w, b.h].map((n) => n.toFixed(2)).join(' ');

function prefersReducedMotion() {
	try {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	} catch {
		return true;
	}
}

/**
 * The viewBox, moving smoothly from what's shown to a new one. React writes
 * the new one; before the page paints, this puts back what was showing and
 * glides from there.
 */
function useAnimatedViewBox(
	svg: RefObject<SVGSVGElement | null>,
	target: string,
	/** Moved by hand: show it straight away. */
	instant: boolean,
) {
	const showing = useRef<string | null>(null);
	useLayoutEffect(() => {
		const element = svg.current;
		const from = showing.current;
		showing.current = target;
		if (
			instant ||
			!element ||
			!from ||
			from === target ||
			typeof requestAnimationFrame !== 'function' ||
			prefersReducedMotion()
		) {
			return;
		}
		const [a, b] = [from, target].map((v) => v.split(' ').map(Number));
		element.setAttribute('viewBox', from);
		let frame = 0;
		let start: number | undefined;
		const tick = (now: number) => {
			start ??= now;
			const t = Math.min(1, (now - start) / 600);
			const eased = 1 - (1 - t) ** 3;
			const value = a!.map((n, i) => (n + (b![i]! - n) * eased).toFixed(2)).join(' ');
			showing.current = value;
			element.setAttribute('viewBox', value);
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		// what's showing is kept by each frame, so a new target glides on from there
		return () => cancelAnimationFrame(frame);
	}, [svg, target, instant]);
	return target;
}

/** A block's outline: a deeper shade of its own colour, softer than ink. */
const edgeOf = (palette: Palette) => mix(palette.right, INK, 0.45);
/** Its icon: deeper still, so it reads on the white disc. */
const glyphOf = (palette: Palette) => mix(palette.right, INK, 0.6);

function SolidShape({
	solid,
	palette,
	shine,
	dashed = false,
}: {
	solid: Solid;
	palette: Palette;
	/** The paint for the light catching its top. */
	shine: string;
	dashed?: boolean;
}) {
	return (
		<g>
			{solid.sides.map((side, i) => {
				const fill = mix(palette.left, palette.right, side.shade);
				return (
					<polygon
						key={i}
						points={side.points}
						fill={fill}
						stroke={fill}
						strokeWidth="0.03"
					/>
				);
			})}
			<polygon points={solid.top} fill={palette.top} />
			<polygon points={solid.top} fill={shine} />
			<path
				d={solid.outline}
				fill="none"
				stroke={dashed ? '#7b8499' : edgeOf(palette)}
				strokeWidth="1.25"
				strokeDasharray={dashed ? '4 3' : undefined}
				strokeLinejoin="round"
				strokeLinecap="round"
				vectorEffect="non-scaling-stroke"
			/>
		</g>
	);
}

/** How many copies of a part are running: “×3”, on the right of its top. */
function Badge({ at, text }: { at: Pt; text: string }) {
	const width = text.length * 0.44 * CHAR + 0.5;
	return (
		<g transform={`translate(${at[0] + 1.05} ${at[1] - 0.1})`} pointerEvents="none">
			<rect
				x={-width / 2}
				y="-0.36"
				width={width}
				height="0.66"
				rx="0.33"
				fill="#ffffff"
				stroke={INK}
				strokeWidth="1"
				vectorEffect="non-scaling-stroke"
			/>
			<text
				y="0.1"
				textAnchor="middle"
				fontSize="0.44"
				fontWeight="600"
				fill={INK}
				className="font-mono"
			>
				{text}
			</text>
		</g>
	);
}

/** Dots moving along a connection: more for busier ones; red ones fail and fade before arriving. */
function Requests({
	id,
	d,
	length,
	sent,
	failRate,
	background,
	extra,
}: {
	id: string;
	d: string;
	length: number;
	sent: number;
	failRate: number;
	background: boolean;
	extra: boolean;
}) {
	const count = Math.min(
		7,
		Math.max(1, Math.round(Math.log10(sent + 1) * 1.2) + (extra ? 1 : 0)),
	);
	const speed = background ? 1.5 : 2.8;
	const duration = Math.max(1.2, length / speed);
	const seed = hash(id);
	return (
		<>
			{Array.from({ length: count }, (_, i) => {
				const failed = (seed + (i + 1) * 0.618034) % 1 < failRate;
				const begin = `${(-(i / count) * duration).toFixed(2)}s`;
				const dur = `${duration.toFixed(2)}s`;
				return (
					<circle
						key={i}
						r="0.2"
						fill={failed ? FAILED : background ? BACKGROUND_REQUEST : REQUEST}
						stroke={INK}
						strokeWidth="1"
						vectorEffect="non-scaling-stroke"
					>
						<animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={d} />
						{failed && (
							<animate
								attributeName="opacity"
								values="1;1;0;0"
								keyTimes="0;0.6;0.8;1"
								dur={dur}
								begin={begin}
								repeatCount="indefinite"
							/>
						)}
					</circle>
				);
			})}
		</>
	);
}
