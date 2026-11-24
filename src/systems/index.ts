import { parseSystem } from '@/model/parseSystem';
import type { System } from '@/model/schema';
import { basics as basicsInput } from './basics';
import { rideHailing } from './rideHailing';
import { stockroom } from './stockroom';
import { upiPayments } from './upiPayments';
import { videoStreaming } from './videoStreaming';

/** The systems you can explore, checked once when the app loads. */
export const systems: readonly System[] = [
	parseSystem(rideHailing),
	parseSystem(videoStreaming),
	parseSystem(upiPayments),
	parseSystem(stockroom),
];

/** Systems still being built: listed so visitors know what's coming. */
export const comingSoon = [
	{
		name: 'Stock trading app',
		tagline: 'Live prices and order matching for millions of traders.',
	},
] as const;

/** The basics: a made-up shop app with a hand-written course on the ideas behind every system. */
export const basics: System = parseSystem(basicsInput);

/** Every system you can open, the basics included. */
export const allSystems: readonly System[] = [basics, ...systems];

export function getSystem(id: string): System {
	return allSystems.find((s) => s.id === id) ?? systems[0]!;
}
