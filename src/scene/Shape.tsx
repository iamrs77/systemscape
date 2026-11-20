import { RoundedBox } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { ComponentKind } from '@/model/schema';

/**
 * A shape for each kind of component, so you can tell them apart at a glance.
 * `surface` is the material, given to every mesh in the shape.
 */
export function Shape({ kind, surface }: { kind: ComponentKind; surface: ReactNode }) {
	switch (kind) {
		case 'client':
			// a phone
			return (
				<RoundedBox
					args={[0.78, 1.36, 0.14]}
					radius={0.07}
					position={[0, 0.78, 0]}
					rotation={[-0.25, 0, 0]}
				>
					{surface}
				</RoundedBox>
			);
		case 'cdn':
			return (
				<mesh position={[0, 0.75, 0]}>
					<octahedronGeometry args={[0.72]} />
					{surface}
				</mesh>
			);
		case 'gateway':
			// a gate everything passes through
			return (
				<mesh position={[0, 0.4, 0]}>
					<cylinderGeometry args={[0.95, 0.95, 0.8, 6]} />
					{surface}
				</mesh>
			);
		case 'service':
			return (
				<RoundedBox args={[1.15, 1.15, 1.15]} radius={0.12} position={[0, 0.6, 0]}>
					{surface}
				</RoundedBox>
			);
		case 'worker':
			return (
				<mesh position={[0, 0.55, 0]}>
					<cylinderGeometry args={[0.62, 0.62, 1.1, 8]} />
					{surface}
				</mesh>
			);
		case 'cache':
			return (
				<mesh position={[0, 0.3, 0]}>
					<cylinderGeometry args={[0.8, 0.8, 0.6, 40]} />
					{surface}
				</mesh>
			);
		case 'database':
			// the classic stack of disks
			return (
				<group>
					{[0.18, 0.55, 0.92].map((y) => (
						<mesh key={y} position={[0, y, 0]}>
							<cylinderGeometry args={[0.72, 0.72, 0.3, 40]} />
							{surface}
						</mesh>
					))}
				</group>
			);
		case 'queue':
		case 'stream':
			// a pipe that messages wait in
			return (
				<mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
					<capsuleGeometry args={[0.38, kind === 'stream' ? 1.7 : 1.2, 8, 24]} />
					{surface}
				</mesh>
			);
		case 'storage':
			return (
				<RoundedBox args={[1.5, 0.75, 1.1]} radius={0.08} position={[0, 0.4, 0]}>
					{surface}
				</RoundedBox>
			);
		case 'external':
			// somewhere else: not ours
			return (
				<mesh position={[0, 0.78, 0]}>
					<icosahedronGeometry args={[0.75, 1]} />
					{surface}
				</mesh>
			);
	}
}
