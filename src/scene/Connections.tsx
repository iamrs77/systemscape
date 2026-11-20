import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D, QuadraticBezierCurve3, Vector3, type InstancedMesh } from 'three';
import type { System } from '@/model/schema';
import { useApp } from '@/store';
import { sceneColor } from '@/theme';
import { edgeTraffic, type EdgeLayout, type EdgeTraffic, type SceneLayout } from './layout';

const MAX_PACKETS = 500;
/** World units per second. */
const SPEED = { sync: 4.5, async: 2.2 } as const;

type Curves = Map<string, QuadraticBezierCurve3>;

/** The connections between components, and requests flowing along them. */
export function Connections({ system, layout }: { system: System; layout: SceneLayout }) {
	const result = useApp((s) => s.result);
	const journeyId = useApp((s) => s.journeyId);
	const traffic = useMemo(
		() => edgeTraffic(system, result, journeyId),
		[system, result, journeyId],
	);
	const curves = useMemo<Curves>(
		() =>
			new Map(
				layout.edges.map((e) => [
					e.key,
					new QuadraticBezierCurve3(
						new Vector3(...e.start),
						new Vector3(...e.control),
						new Vector3(...e.end),
					),
				]),
			),
		[layout],
	);

	return (
		<group>
			{layout.edges.map((edge) => (
				<Connection
					key={edge.key}
					edge={edge}
					curve={curves.get(edge.key)!}
					traffic={traffic.get(edge.key)}
				/>
			))}
			<Packets edges={layout.edges} curves={curves} traffic={traffic} />
		</group>
	);
}

function edgeColor(edge: EdgeLayout, traffic: EdgeTraffic | undefined) {
	if (!traffic?.active || traffic.sent === 0) return sceneColor.edgeIdle;
	if (traffic.breakerOpen) return sceneColor.breaker;
	if (traffic.failRate > 0.2) return sceneColor.failing;
	return edge.mode === 'async' ? sceneColor.edgeAsync : sceneColor.edge;
}

function Connection({
	edge,
	curve,
	traffic,
}: {
	edge: EdgeLayout;
	curve: QuadraticBezierCurve3;
	traffic: EdgeTraffic | undefined;
}) {
	const points = useMemo(() => curve.getPoints(40), [curve]);
	const active = Boolean(traffic?.active && traffic.sent > 0);
	// busier connections are drawn thicker
	const width = active ? 1.2 + Math.min(2.4, Math.log10(1 + (traffic?.sent ?? 0)) * 0.5) : 1;
	return (
		<Line
			points={points}
			color={edgeColor(edge, traffic)}
			lineWidth={width}
			transparent
			opacity={active ? 0.55 : 0.25}
			dashed={edge.mode === 'async'}
			dashSize={0.35}
			gapSize={0.25}
		/>
	);
}

/** A number in [0, 1) that's always the same for the same text. */
function hash(text: string) {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
	return (h >>> 0) / 2 ** 32;
}

type Packet = {
	curve: QuadraticBezierCurve3;
	/** Trips along the curve per second. */
	rate: number;
	offset: number;
	failed: boolean;
	async: boolean;
};

/**
 * Small glowing dots moving along each connection: more dots for more
 * traffic, red ones for requests that fail (they fade out before arriving).
 */
function Packets({
	edges,
	curves,
	traffic,
}: {
	edges: EdgeLayout[];
	curves: Curves;
	traffic: Map<string, EdgeTraffic>;
}) {
	const paused = useApp((s) => s.paused);
	const mesh = useRef<InstancedMesh>(null);
	const elapsed = useRef(0);

	const packets = useMemo(() => {
		const list: Packet[] = [];
		for (const edge of edges) {
			const t = traffic.get(edge.key);
			if (!t?.active || t.sent <= 0) continue;
			const curve = curves.get(edge.key)!;
			const count = Math.min(10, Math.max(1, Math.ceil(Math.log10(t.sent + 1) * 1.6)));
			const seed = hash(edge.key);
			for (let i = 0; i < count; i++) {
				list.push({
					curve,
					rate: SPEED[edge.mode] / curve.getLength(),
					offset: i / count + seed,
					// spread the failures evenly through the dots
					failed: (seed + (i + 1) * 0.618034) % 1 < t.failRate,
					async: edge.mode === 'async',
				});
			}
		}
		return list.slice(0, MAX_PACKETS);
	}, [edges, curves, traffic]);

	useLayoutEffect(() => {
		const instanced = mesh.current;
		if (!instanced) return;
		packets.forEach((p, i) => {
			const color = p.failed
				? sceneColor.failing
				: p.async
					? sceneColor.packetAsync
					: sceneColor.packet;
			instanced.setColorAt(i, scratchColor.set(color));
		});
		instanced.count = packets.length;
		if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
	}, [packets]);

	useFrame((_, delta) => {
		const instanced = mesh.current;
		if (!instanced) return;
		if (!paused) elapsed.current += Math.min(delta, 0.1);
		packets.forEach((p, i) => {
			const t = (elapsed.current * p.rate + p.offset) % 1;
			p.curve.getPoint(t, scratch.position);
			// failed requests fade out before they arrive
			scratch.scale.setScalar(p.failed && t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1);
			scratch.updateMatrix();
			instanced.setMatrixAt(i, scratch.matrix);
		});
		instanced.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={mesh} args={[undefined, undefined, MAX_PACKETS]} frustumCulled={false}>
			<sphereGeometry args={[0.1, 12, 12]} />
			<meshBasicMaterial toneMapped={false} />
		</instancedMesh>
	);
}

// reused every frame, instead of allocating new ones
const scratch = new Object3D();
const scratchColor = new Color();
