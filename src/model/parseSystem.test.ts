import { describe, expect, it } from 'vitest';
import { parseSystem } from './parseSystem';
import type { ComponentKind, SystemInput } from './schema';

type ComponentInput = SystemInput['components'][number];

const component = (id: string, kind: ComponentKind, extra: object = {}): ComponentInput => ({
	id,
	name: id,
	kind,
	layer: kind === 'client' ? 'clients' : 'services',
	summary: 's',
	why: 'w',
	onFailure: 'f',
	scaling: 's',
	...(kind === 'client' ? {} : { capacityPerInstance: 100 }),
	...extra,
});

const valid = (): SystemInput => ({
	id: 'tiny',
	name: 'Tiny',
	tagline: 't',
	basis: 'real',
	description: ['d'],
	components: [component('app', 'client'), component('svc', 'service')],
	journeys: [
		{
			id: 'use',
			name: 'Use',
			description: 'd',
			rps: 10,
			hops: [{ from: 'app', to: 'svc', label: 'call' }],
		},
	],
	presets: [{ id: 'normal', name: 'Normal', description: 'd', traffic: 1 }],
});

describe('parseSystem', () => {
	it('accepts a valid system and fills in defaults', () => {
		const system = parseSystem(valid());
		expect(system.journeys[0]!.hops[0]).toMatchObject({ mode: 'sync', retries: 0, share: 1 });
		expect(system.components[1]!.instances).toBe(1);
	});

	it('lists every broken reference at once', () => {
		const broken = valid();
		broken.journeys[0]!.hops.push({ from: 'nowhere', to: 'missing', label: 'x' });
		broken.challenges = [
			{
				id: 'c',
				title: 't',
				story: 's',
				preset: 'no-preset',
				goal: { journey: 'no-journey', minSuccess: 0.9 },
				hint: 'h',
				lesson: 'l',
			},
		];
		expect(() => parseSystem(broken)).toThrowError(
			/no component "missing"[\s\S]*isn't reached by an earlier hop[\s\S]*no preset "no-preset"[\s\S]*no journey "no-journey"/,
		);
	});

	it('requires journeys to start from a client', () => {
		const broken = valid();
		broken.journeys[0]!.hops = [{ from: 'svc', to: 'app', label: 'x' }];
		expect(() => parseSystem(broken)).toThrowError(/must start from a client/);
	});

	it('requires a hit rate on caches, and only on caches', () => {
		const broken = valid();
		broken.components.push(component('cache', 'cache'));
		expect(() => parseSystem(broken)).toThrowError(/only caches and CDNs have a hitRate/);
	});

	it('rejects duplicate ids', () => {
		const broken = valid();
		broken.components.push(component('svc', 'service'));
		expect(() => parseSystem(broken)).toThrowError(/two components have the id "svc"/);
	});
});
