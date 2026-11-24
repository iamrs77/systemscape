import { parseSystem } from '@/model/parseSystem';
import type { System } from '@/model/schema';
import { rideHailing } from './rideHailing';
import { videoStreaming } from './videoStreaming';

/** The systems you can explore, checked once when the app loads. */
export const systems: readonly System[] = [parseSystem(rideHailing), parseSystem(videoStreaming)];

/** Systems still being built: listed so visitors know what's coming. */
export const comingSoon = [
	{
		name: 'Stock trading app',
		tagline: 'Live prices and order matching for millions of traders.',
	},
	{
		name: 'UPI payments',
		tagline: 'Moving money between banks in seconds, billions of times a month.',
	},
	{ name: 'Stockroom', tagline: 'My own inventory app, with its real architecture.' },
] as const;

export function getSystem(id: string): System {
	return systems.find((s) => s.id === id) ?? systems[0]!;
}
