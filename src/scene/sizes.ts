import type { ComponentKind } from '@/model/schema';

/** Shapes are modelled about a unit across, then drawn this much bigger. */
export const SHAPE_SCALE = 1.3;

/** How tall each shape is, so its label sits just above it. */
export const shapeHeight: Record<ComponentKind, number> = {
	client: 1.5,
	cdn: 1.5,
	gateway: 0.9,
	service: 1.2,
	worker: 1.1,
	cache: 0.6,
	database: 1.1,
	queue: 0.8,
	stream: 0.8,
	storage: 0.8,
	external: 1.5,
};
