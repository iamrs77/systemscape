import { Grid, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { useApp, useSystem } from '@/store';
import { sceneColor } from '@/theme';
import { COMPACT_WIDTH, fitCamera } from './camera';
import { ComponentNode } from './ComponentNode';
import { Connections } from './Connections';
import { LabelTracker, Labels } from './Labels';
import {
	anchorsFor,
	COLUMN_GAP,
	journeyComponents,
	labelPriority,
	layoutSystem,
	type SceneLayout,
} from './layout';

/** The 3D map of the system. Loaded lazily: three.js is most of the download. */
export default function Scene() {
	const system = useSystem();
	const journeyId = useApp((s) => s.journeyId);
	const select = useApp((s) => s.select);
	const layout = useMemo(() => layoutSystem(system), [system]);
	const inJourney = useMemo(
		() => (journeyId ? journeyComponents(system, journeyId) : null),
		[system, journeyId],
	);
	const fromTop = useApp((s) => s.view === 'top');
	const result = useApp((s) => s.result);
	const selected = useApp((s) => s.selected);
	const hovered = useApp((s) => s.hovered);
	const anchors = useMemo(() => {
		const priority = labelPriority(system, result, { selected, hovered, inJourney });
		return anchorsFor(system, layout, fromTop).sort(
			(a, b) => (priority.get(a.id) ?? 99) - (priority.get(b.id) ?? 99),
		);
	}, [system, layout, fromTop, result, selected, hovered, inJourney]);
	const labels = useRef(new Map<string, HTMLElement>());

	return (
		<div className="absolute inset-0">
			<Canvas
				camera={{ fov: 32, near: 0.1, far: 400, position: [0, 30, 34] }}
				dpr={[1, 2]}
				onPointerMissed={() => select(null)}
			>
				<color attach="background" args={[sceneColor.background]} />
				<fog attach="fog" args={[sceneColor.background, 45, 110]} />
				<hemisphereLight args={['#dbeafe', '#0b1020', 1.1]} />
				<directionalLight position={[10, 20, 14]} intensity={1.6} />
				<directionalLight position={[-12, 8, -10]} intensity={0.4} color="#a5b4fc" />

				<Ground layout={layout} />
				{system.components.map((component) => (
					<ComponentNode
						key={component.id}
						component={component}
						position={layout.nodes[component.id]!.position}
						dimmed={inJourney !== null && !inJourney.has(component.id)}
					/>
				))}
				<Connections system={system} layout={layout} />
				<CameraRig layout={layout} />
				<LabelTracker anchors={anchors} registry={labels} />
			</Canvas>
			<Labels system={system} layout={layout} registry={labels} inJourney={inJourney} />
		</div>
	);
}

function Ground({ layout }: { layout: SceneLayout }) {
	return (
		<group>
			<Grid
				position={[0, -0.01, 0]}
				infiniteGrid
				cellSize={1}
				cellThickness={0.5}
				cellColor="#111827"
				sectionSize={COLUMN_GAP}
				sectionThickness={0.8}
				sectionColor="#1e293b"
				fadeDistance={70}
				fadeStrength={1.5}
			/>
			{layout.rows.map((row) => (
				<group key={row.layer} position={[0, 0, row.z]}>
					<mesh rotation={[-Math.PI / 2, 0, 0]}>
						<planeGeometry args={[row.width + 1.4, 3.6]} />
						<meshBasicMaterial color={sceneColor.row} transparent opacity={0.55} />
					</mesh>
				</group>
			))}
		</group>
	);
}

const origin = new Vector3(0, 0, 0);

/** Fits the whole system in view, and moves smoothly between the 3D and top views. */
function CameraRig({ layout }: { layout: SceneLayout }) {
	const view = useApp((s) => s.view);
	const camera = useThree((s) => s.camera);
	const width = useThree((s) => s.size.width);
	const height = useThree((s) => s.size.height);
	const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
	const goal = useRef<Vector3 | null>(null);

	useEffect(() => {
		if (!(camera instanceof PerspectiveCamera)) return;
		const aspect = width / Math.max(1, height);
		goal.current = fitCamera(layout, view, camera.fov, aspect, width < COMPACT_WIDTH);
	}, [camera, layout, view, width, height]);

	useFrame((_, delta) => {
		const target = goal.current;
		const orbit = controls.current;
		if (!target || !orbit) return;
		const k = 1 - Math.exp(-delta * 5);
		camera.position.lerp(target, k);
		orbit.target.lerp(origin, k);
		orbit.update();
		if (camera.position.distanceTo(target) < 0.02) goal.current = null;
	});

	return (
		<OrbitControls
			ref={controls}
			makeDefault
			enableDamping
			enableRotate={view === '3d'}
			minDistance={8}
			maxDistance={110}
			maxPolarAngle={1.35}
			// stop the user taking over mid-move
			onStart={() => (goal.current = null)}
		/>
	);
}
