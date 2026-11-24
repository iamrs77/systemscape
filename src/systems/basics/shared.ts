import type { Track } from '@/learn/course';
import type { SystemInput } from '@/model/schema';

/** A track of the basics, with the parts and journeys only its lessons use. */
export type TrackModule = {
	track: Track;
	/** Parts only this track's lessons use. */
	parts?: SystemInput['components'];
	/**
	 * Journeys only this track's lessons use. They're switched off on an
	 * ordinary day, so Explore freely starts on the simple design.
	 */
	journeys?: SystemInput['journeys'];
};

export const look = { only: ['look'] };

// the scaling lessons look at one idea at a time, so the database is made big enough to stay out of the way when it isn't the subject
export const roomy = { db: 10 };

/** The three web servers a load balancer picks between, drawn apart. */
export const copies = ['web-1', 'web-2', 'web-3'];
/**
 * The load balancer passing a request to one of the three, and that copy
 * reading the product. `hashed` is each copy's share of the shoppers when
 * they're picked by a hash of their address.
 */
export const pickCopies = (hashed: number[]) => [
	...copies.map((to, i) => ({
		from: 'lb',
		to,
		label: `Pass it to Web server ${i + 1}`,
		pick: true,
		share: hashed[i]!,
	})),
	...copies.map((from) => ({ from, to: 'db', label: 'Read the product' })),
];
