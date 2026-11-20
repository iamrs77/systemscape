import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
import { DoubleSide, type Group, type MeshStandardMaterial } from 'three';
import type { Component } from '@/model/schema';
import { useApp } from '@/store';
import { sceneColor, statusColor } from '@/theme';
import type { Vec3 } from './layout';
import { SHAPE_SCALE } from './sizes';
import { Shape } from './Shape';

const RING_INNER = 1.4;
const RING_OUTER = 1.56;

function glow(materials: Iterable<MeshStandardMaterial>, intensity: number) {
	for (const material of materials) material.emissiveIntensity = intensity;
}

type Props = {
	component: Component;
	position: Vec3;
	/** Not part of the journey being followed. */
	dimmed: boolean;
};

export function ComponentNode({ component, position, dimmed }: Props) {
	const state = useApp((s) => s.result.components[component.id]!);
	const selected = useApp((s) => s.selected === component.id);
	const select = useApp((s) => s.select);
	const hovered = useApp((s) => s.hovered === component.id);
	const hover = useApp((s) => s.hover);

	const isClient = component.kind === 'client';
	const color = isClient ? sceneColor.client : statusColor[state.status];
	const down = state.status === 'down';
	const overloaded = state.status === 'overloaded';

	// every mesh in the shape gets its own material; keep them to animate the glow
	const materials = useRef(new Set<MeshStandardMaterial>());
	const keep = useCallback((material: MeshStandardMaterial | null) => {
		if (!material) return;
		materials.current.add(material);
		return () => {
			materials.current.delete(material);
		};
	}, []);

	const group = useRef<Group>(null);
	useFrame(({ clock }) => {
		// overloaded parts throb; hovered and selected ones glow
		const pulse = overloaded && !dimmed ? 0.35 + 0.3 * Math.sin(clock.elapsedTime * 7) : 0;
		glow(materials.current, (hovered || selected ? 0.45 : 0.14) + pulse);
		if (group.current) {
			const lift = hovered || selected ? 0.12 : 0;
			group.current.position.y += (lift - group.current.position.y) * 0.2;
		}
	});

	const surface = (
		<meshStandardMaterial
			ref={keep}
			color={down ? '#3f3f46' : color}
			emissive={color}
			roughness={0.38}
			metalness={0.2}
			transparent={dimmed || down}
			opacity={dimmed ? 0.16 : down ? 0.55 : 1}
			wireframe={down}
		/>
	);
	// how full it is, as an arc on the ground around it
	const arc =
		Math.PI * 2 * Math.min(1, Math.max(0.001, Math.round(state.utilization * 200) / 200));

	const onClick = (event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();
		select(component.id);
	};

	return (
		<group position={position}>
			<group
				ref={group}
				onClick={onClick}
				onPointerOver={(e) => {
					e.stopPropagation();
					hover(component.id);
					document.body.style.cursor = 'pointer';
				}}
				onPointerOut={() => {
					hover(null);
					document.body.style.cursor = '';
				}}
			>
				<group scale={SHAPE_SCALE}>
					<Shape kind={component.kind} surface={surface} />
				</group>
			</group>

			{!isClient && (
				<group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
					<mesh>
						<ringGeometry args={[RING_INNER, RING_OUTER, 64]} />
						<meshBasicMaterial
							color="#1e293b"
							transparent
							opacity={dimmed ? 0.2 : 0.8}
							side={DoubleSide}
						/>
					</mesh>
					<mesh position={[0, 0, 0.001]}>
						<ringGeometry args={[RING_INNER, RING_OUTER, 64, 1, Math.PI / 2, arc]} />
						<meshBasicMaterial
							color={color}
							transparent
							opacity={dimmed || down ? 0.2 : 0.95}
							side={DoubleSide}
						/>
					</mesh>
				</group>
			)}
			{selected && (
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
					<ringGeometry args={[1.72, 1.84, 64]} />
					<meshBasicMaterial color={sceneColor.selected} side={DoubleSide} />
				</mesh>
			)}
		</group>
	);
}
