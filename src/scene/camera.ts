import { PerspectiveCamera, Vector3 } from 'three';
import type { View } from '@/store';
import type { SceneLayout } from './layout';

/** Which way the camera looks from, for each view. */
const direction: Record<View | 'tall', Vector3> = {
	'3d': new Vector3(0, 0.68, 0.73).normalize(),
	// on a tall screen, look down more steeply so the rows spread out
	tall: new Vector3(0, 0.86, 0.51).normalize(),
	top: new Vector3(0, 1, 0.0001).normalize(),
};

/** Below this width the row names are hidden and labels shrink (see index.css). */
export const COMPACT_WIDTH = 640;

/** Room around the layout: the row names sit to the left, labels sit above the shapes. */
const ROW_NAME_ROOM = 4.6;
const LABEL_ROOM = 1.6;
const DEPTH_ROOM = 1.8;
const LABEL_HEIGHT = 2.6;

/**
 * The closest camera position, looking at the middle, from which the whole
 * layout fits on screen. Found by projecting the layout's corners, because
 * in perspective the nearest row looks wider than the rest.
 */
export function fitCamera(
	layout: SceneLayout,
	view: View,
	fov: number,
	aspect: number,
	compact = false,
) {
	const camera = new PerspectiveCamera(fov, aspect, 0.1, 1000);
	const from = direction[view === '3d' && aspect < 0.9 ? 'tall' : view];
	// what has to be on screen: each row's ends (with room for the labels and, on
	// a big screen, the row's name), and the labels above the shapes
	const corners: Vector3[] = [];
	for (const row of layout.rows) {
		const left = -row.width / 2 - (compact ? LABEL_ROOM : ROW_NAME_ROOM);
		const right = row.width / 2 + LABEL_ROOM;
		for (const z of [row.z - DEPTH_ROOM, row.z + DEPTH_ROOM]) {
			corners.push(new Vector3(left, 0, z), new Vector3(right, 0, z));
		}
		corners.push(new Vector3(0, LABEL_HEIGHT, row.z));
	}
	const point = new Vector3();
	const fits = (distance: number) => {
		camera.position.copy(from).multiplyScalar(distance);
		camera.lookAt(0, 0, 0);
		camera.updateMatrixWorld();
		return corners.every((corner) => {
			point.copy(corner).project(camera);
			return Math.abs(point.x) <= 0.95 && Math.abs(point.y) <= 0.9 && point.z < 1;
		});
	};

	let near = 2;
	let far = 400;
	for (let i = 0; i < 32; i++) {
		const middle = (near + far) / 2;
		if (fits(middle)) far = middle;
		else near = middle;
	}
	return from.clone().multiplyScalar(far);
}
