import type { SystemInput } from '@/model/schema';

/**
 * A ride-hailing app, simplified, based on what Uber and others have shared
 * in public talks and posts. Traffic numbers are for one big city on an
 * ordinary evening; they're illustrative, chosen so the trade-offs show.
 */
export const rideHailing: SystemInput = {
	id: 'ride-hailing',
	name: 'Ride-hailing app',
	tagline:
		'Matching riders with nearby drivers in seconds, while every driver reports where they are.',
	basis: 'inspired',
	description: [
		'Riders ask for a ride; the app finds a nearby driver, shows the fare and the driver coming, and charges the rider at the end. Underneath, every online driver sends their position every few seconds, so the system always knows who is where.',
		'This is a simplified design based on public talks and engineering posts, not any company’s actual system. The traffic numbers are illustrative, for one big city on an ordinary evening.',
	],
	sources: [
		{
			title: 'H3: Uber’s Hexagonal Hierarchical Spatial Index',
			url: 'https://www.uber.com/blog/h3/',
			publisher: 'Uber Engineering, 2018',
		},
		{
			title: 'Scaling Uber’s Real-time Market Platform (talk)',
			url: 'https://www.infoq.com/presentations/uber-market-platform',
			publisher: 'Matt Ranney, QCon London 2015',
		},
		{
			title: 'How Uber Scales Their Real-time Market Platform (summary of the talk)',
			url: 'https://highscalability.com/how-uber-scales-their-real-time-market-platform/',
			publisher: 'High Scalability, 2015',
		},
		{
			title: 'Uber’s Real-Time Push Platform',
			url: 'https://www.uber.com/blog/real-time-push-platform/',
			publisher: 'Uber Engineering, 2020',
		},
		{
			title: 'Uber’s Fulfillment Platform: Ground-up Re-architecture',
			url: 'https://www.uber.com/blog/fulfillment-platform-rearchitecture/',
			publisher: 'Uber Engineering, 2021',
		},
		{
			title: 'Disaster Recovery for Multi-Region Kafka at Uber',
			url: 'https://www.uber.com/blog/kafka/',
			publisher: 'Uber Engineering, 2020',
		},
		{
			title: 'Surge pricing: Rebalancing the marketplace',
			url: 'https://www.uber.com/us/en/marketplace/pricing/surge-pricing',
			publisher: 'Uber',
		},
		{
			title: 'Zero-Sum by Design: 10 Years of Uber’s Payments Platform',
			url: 'https://www.uber.com/blog/ubers-payments-platform/',
			publisher: 'Uber Engineering, 2026',
		},
	],
	decisions: [
		{
			title: 'Driver positions live in memory, not in the main database',
			detail: 'Tens of thousands of position updates arrive every second, and each is out of date seconds later. Only the latest position matters for matching, so it’s kept in an in-memory index split by area. The full history goes to the event stream for anything that needs it later.',
		},
		{
			title: 'The map is cut into cells',
			detail: 'To find drivers near a rider, dispatch looks in the rider’s cell and the cells around it, instead of measuring the distance to every driver. In 2015 Uber’s index used Google’s S2 cells. Uber later open-sourced H3, a grid of hexagons it uses for pricing and dispatch: with hexagons, all six neighbours are the same distance away.',
		},
		{
			title: 'A live connection to every app',
			detail: 'Ride offers and driver positions are pushed to the apps over connections kept open, instead of the apps asking again and again. Uber said apps polling for updates once made up 80% of its API gateway’s requests. The cost is keeping over a million connections open and moving them when a server restarts.',
		},
		{
			title: 'Matching can work without ETAs',
			detail: 'Dispatch ranks nearby drivers by how long they’d take to arrive, which needs the routing service. If routing is slow or down, dispatch falls back to straight-line distance: matches get a little worse, but riders still get a car.',
		},
		{
			title: 'Payment happens after the trip, in the background',
			detail: 'Ending a trip doesn’t wait for the card to be charged. The charge goes through the event stream and is retried, so a payment provider outage doesn’t stop drivers from finishing trips. The cost: some charges fail later and need following up. Uber’s payments platform works mostly in the background like this, recording every charge in a ledger whose entries must add up to zero.',
		},
		{
			title: 'An event stream connects everything else',
			detail: 'Every position update and trip change is published to an event stream. Surge pricing, analytics and fraud checks read from it without slowing down the trip itself.',
		},
	],
	components: [
		{
			id: 'rider-app',
			name: 'Rider app',
			kind: 'client',
			layer: 'clients',
			summary: 'Where riders check prices, ask for a ride and watch their driver arrive.',
			why: 'It’s how riders use the service.',
			onFailure: 'Not part of the simulation: it stands for the riders.',
			scaling: 'Runs on riders’ phones.',
		},
		{
			id: 'driver-app',
			name: 'Driver app',
			kind: 'client',
			layer: 'clients',
			summary:
				'Sends the driver’s position every few seconds, receives ride offers, and ends trips.',
			why: 'It’s how drivers work, and where every position update comes from.',
			onFailure: 'Not part of the simulation: it stands for the drivers.',
			scaling: 'Runs on drivers’ phones.',
		},
		{
			id: 'api-gateway',
			name: 'API gateway',
			kind: 'gateway',
			layer: 'edge',
			summary:
				'The front door for app requests: checks who’s calling, limits abuse, and routes each request to the right service.',
			why: 'One place for logins, rate limits and routing, so services don’t each do it.',
			onFailure: 'Nothing gets in: no prices, no rides, no trips ending.',
			scaling: 'Stateless, so it autoscales easily behind a load balancer.',
			capacityPerInstance: 6_000,
			instances: 3,
			maxInstances: 40,
			latencyMs: 4,
		},
		{
			id: 'realtime-gateway',
			name: 'Real-time gateway',
			kind: 'gateway',
			layer: 'edge',
			summary:
				'Keeps a live connection open to every app, to receive driver positions and push ride offers and the driver’s position to riders.',
			why: 'Pushing over an open connection is faster and cheaper than every app asking for updates again and again.',
			onFailure:
				'Drivers’ positions stop arriving and offers can’t reach them: matching stalls within seconds.',
			scaling:
				'Each server holds a share of the connections; more servers hold more. Connections move when a server restarts.',
			capacityPerInstance: 20_000,
			instances: 4,
			maxInstances: 40,
			latencyMs: 3,
		},
		{
			id: 'location-service',
			name: 'Location service',
			kind: 'service',
			layer: 'services',
			summary:
				'Takes each driver position update, files it under the right map cell, and publishes it to the event stream.',
			why: 'The busiest flow in the system needs its own service, kept simple and fast.',
			onFailure:
				'Positions go stale: dispatch matches riders with drivers who have already moved.',
			scaling: 'Stateless; autoscales with the number of online drivers.',
			capacityPerInstance: 8_000,
			instances: 6,
			maxInstances: 60,
			latencyMs: 4,
		},
		{
			id: 'pricing-service',
			name: 'Pricing service',
			kind: 'service',
			layer: 'services',
			summary:
				'Works out the fare for a trip, including the surge multiplier for the area right now.',
			why: 'Riders see a price before they ask for a ride, many times more often than they book.',
			onFailure: 'Riders can’t see a price, so they can’t ask for a ride.',
			scaling: 'Stateless; autoscales. It leans on the surge cache to stay cheap.',
			capacityPerInstance: 2_500,
			instances: 3,
			maxInstances: 40,
			latencyMs: 12,
		},
		{
			id: 'dispatch-service',
			name: 'Dispatch',
			kind: 'service',
			layer: 'services',
			summary:
				'Finds available drivers in the rider’s map cell and the cells around it, ranks them by arrival time, and offers the ride.',
			why: 'Matching is the core of the product: fast, good matches keep riders and drivers happy.',
			onFailure: 'No one gets matched: every ride request fails.',
			scaling:
				'Autoscales, but slowly: new instances need a few minutes to start and warm up, too slow for a sudden rush.',
			capacityPerInstance: 300,
			instances: 3,
			maxInstances: 30,
			latencyMs: 40,
		},
		{
			id: 'eta-service',
			name: 'ETA service',
			kind: 'service',
			layer: 'services',
			summary:
				'Works out how long a driver would take to reach a point, on real roads with live traffic.',
			why: 'Ranking drivers by arrival time gives better matches than straight-line distance.',
			onFailure:
				'Dispatch falls back to straight-line distance, and riders don’t see an arrival time: worse, but still working.',
			scaling:
				'Route calculations are heavy; it autoscales, but each instance handles far fewer requests than most services.',
			capacityPerInstance: 900,
			instances: 6,
			maxInstances: 60,
			latencyMs: 35,
		},
		{
			id: 'trip-service',
			name: 'Trip service',
			kind: 'service',
			layer: 'services',
			summary:
				'Owns each trip from request to drop-off: who the rider and driver are, and what stage the trip is at.',
			why: 'One place decides a trip’s state, so the rider and driver apps always agree.',
			onFailure: 'Rides can’t be created and trips can’t end.',
			scaling:
				'Stateless; autoscales. The trip database behind it is the harder part to scale.',
			capacityPerInstance: 2_000,
			instances: 3,
			maxInstances: 30,
			latencyMs: 10,
		},
		{
			id: 'payment-service',
			name: 'Payment service',
			kind: 'service',
			layer: 'services',
			summary:
				'Charges the rider once a trip is complete, records it in a ledger, and retries when the payment provider doesn’t answer.',
			why: 'Keeps money handling, retries and receipts in one place.',
			onFailure:
				'Charges wait in the event stream and go through when it’s back. Trips aren’t affected.',
			scaling: 'Autoscales, but the payment provider it calls sets the real limit.',
			capacityPerInstance: 400,
			instances: 2,
			maxInstances: 20,
			latencyMs: 30,
		},
		{
			id: 'event-stream',
			name: 'Event stream',
			kind: 'stream',
			layer: 'async',
			summary:
				'Every position update and trip change, kept in order, for other systems to read at their own pace (like Kafka).',
			why: 'Surge pricing, payments, analytics and fraud checks all need the same events without slowing the trip down.',
			onFailure:
				'Background work stops: surge prices freeze and charges wait. Trips themselves carry on.',
			scaling:
				'Split into partitions spread over brokers; adding brokers is planned, not automatic.',
			capacityPerInstance: 60_000,
			instances: 3,
			latencyMs: 3,
		},
		{
			id: 'surge-worker',
			name: 'Surge calculator',
			kind: 'worker',
			layer: 'async',
			summary:
				'Counts ride requests and available drivers in every hexagon, and keeps each area’s surge multiplier up to date.',
			why: 'When demand outruns supply, higher prices bring more drivers out and spread demand.',
			onFailure: 'Surge prices stop updating and keep their last values.',
			scaling: 'Splits the city between workers; autoscales.',
			capacityPerInstance: 40_000,
			instances: 2,
			maxInstances: 10,
			latencyMs: 15,
		},
		{
			id: 'geo-index',
			name: 'Driver location index',
			kind: 'database',
			layer: 'data',
			summary:
				'Every online driver’s latest position, in memory, grouped by map cell. Answers “which drivers are near here?” in milliseconds.',
			why: 'Matching needs live positions instantly; a disk database couldn’t keep up with the writes.',
			onFailure: 'Dispatch can’t find any drivers: matching stops.',
			scaling:
				'Split into shards by area. Adding shards means moving data, so it’s planned, not automatic.',
			capacityPerInstance: 15_000,
			instances: 6,
			latencyMs: 2,
		},
		{
			id: 'surge-cache',
			name: 'Surge cache',
			kind: 'cache',
			layer: 'data',
			summary: 'The current surge multiplier for each hexagon, ready to read.',
			why: 'Pricing is asked for far more often than surge changes, so reading it from memory saves recalculating it every time.',
			onFailure:
				'Every price check has to count recent demand from the trip database instead.',
			scaling: 'Small and read-heavy; a few replicas are plenty.',
			capacityPerInstance: 100_000,
			instances: 1,
			latencyMs: 1,
			hitRate: 0.97,
		},
		{
			id: 'trip-db',
			name: 'Trip database',
			kind: 'database',
			layer: 'data',
			summary:
				'Every trip and what stage it’s at, stored durably and consistently, split across shards by trip.',
			why: 'Trips are money and records: a trip must never be in two states at once, so this needs a strongly consistent database (Uber moved it to Google Cloud Spanner).',
			onFailure: 'No new rides and no trips ending, until it’s back.',
			scaling: 'Sharded; adding shards is planned work, not automatic.',
			capacityPerInstance: 1_500,
			instances: 3,
			latencyMs: 8,
		},
		{
			id: 'payment-provider',
			name: 'Payment provider',
			kind: 'external',
			layer: 'external',
			summary: 'The card network or bank that actually moves the money.',
			why: 'Moving money needs a licensed provider.',
			onFailure:
				'Charges fail and are retried later. Riders and drivers don’t notice straight away.',
			scaling: 'Not ours to scale: it has its own limits and outages.',
			capacityPerInstance: 1_200,
			instances: 1,
			latencyMs: 250,
		},
	],
	journeys: [
		{
			id: 'share-location',
			name: 'Drivers share their location',
			description:
				'Every online driver’s phone sends its position every few seconds (every 4, in a 2015 Uber talk). The busiest flow by far.',
			rps: 25_000,
			hops: [
				{ from: 'driver-app', to: 'realtime-gateway', label: 'Position update' },
				{ from: 'realtime-gateway', to: 'location-service', label: 'Pass it on' },
				{
					from: 'location-service',
					to: 'geo-index',
					label: 'File under the driver’s map cell',
				},
				{
					from: 'location-service',
					to: 'event-stream',
					label: 'Publish the update',
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'surge-worker',
					label: 'Count drivers per area',
					mode: 'async',
				},
			],
		},
		{
			id: 'check-price',
			name: 'See the price',
			description:
				'A rider enters a destination and sees the fare. Riders check prices far more often than they book.',
			rps: 1_500,
			hops: [
				{ from: 'rider-app', to: 'api-gateway', label: 'Get a fare estimate' },
				{ from: 'api-gateway', to: 'pricing-service', label: 'Work out the fare' },
				{ from: 'pricing-service', to: 'surge-cache', label: 'Surge for this hexagon' },
				{
					from: 'surge-cache',
					to: 'trip-db',
					label: 'Count recent requests nearby',
					onMiss: true,
					calls: 2,
				},
				{
					from: 'pricing-service',
					to: 'eta-service',
					label: 'Trip length',
					optional: true,
				},
			],
		},
		{
			id: 'request-ride',
			name: 'Request a ride',
			description:
				'A rider asks for a ride: dispatch finds nearby drivers, ranks them by arrival time, and offers the ride.',
			rps: 250,
			hops: [
				{ from: 'rider-app', to: 'api-gateway', label: 'Request a ride' },
				{ from: 'api-gateway', to: 'dispatch-service', label: 'Find a driver' },
				{ from: 'dispatch-service', to: 'geo-index', label: 'Drivers in nearby cells' },
				{
					from: 'dispatch-service',
					to: 'eta-service',
					label: 'Arrival time for the closest drivers',
					calls: 5,
					optional: true,
				},
				{
					from: 'dispatch-service',
					to: 'realtime-gateway',
					label: 'Offer the ride to a driver',
					calls: 1.4,
				},
				{ from: 'dispatch-service', to: 'trip-service', label: 'Create the trip' },
				{ from: 'trip-service', to: 'trip-db', label: 'Save the trip', retries: 2 },
				{
					from: 'trip-service',
					to: 'event-stream',
					label: 'Trip requested',
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'surge-worker',
					label: 'Count demand per area',
					mode: 'async',
				},
			],
		},
		{
			id: 'track-driver',
			name: 'Watch the driver arrive',
			description:
				'While a rider waits, the driver’s position and arrival time are pushed to their map every few seconds.',
			rps: 6_000,
			hops: [
				{ from: 'rider-app', to: 'realtime-gateway', label: 'Keep the map live' },
				{
					from: 'realtime-gateway',
					to: 'trip-service',
					label: 'Who’s my driver?',
					share: 0.1,
				},
				{ from: 'realtime-gateway', to: 'geo-index', label: 'Driver’s latest position' },
				{
					from: 'realtime-gateway',
					to: 'eta-service',
					label: 'Time to pickup',
					share: 0.25,
					optional: true,
				},
			],
		},
		{
			id: 'end-trip',
			name: 'End the trip and pay',
			description:
				'The driver ends the trip; the fare is saved straight away and the rider is charged in the background.',
			rps: 250,
			hops: [
				{ from: 'driver-app', to: 'api-gateway', label: 'End trip' },
				{ from: 'api-gateway', to: 'trip-service', label: 'Complete the trip' },
				{ from: 'trip-service', to: 'trip-db', label: 'Save fare and status', retries: 2 },
				{
					from: 'trip-service',
					to: 'event-stream',
					label: 'Trip completed',
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'payment-service',
					label: 'Charge the rider',
					mode: 'async',
				},
				{
					from: 'payment-service',
					to: 'payment-provider',
					label: 'Charge the card',
					mode: 'async',
					retries: 3,
				},
			],
		},
	],
	presets: [
		{
			id: 'normal',
			name: 'Normal evening',
			description: 'An ordinary evening in a big city.',
			traffic: 1,
		},
		{
			id: 'friday-night',
			name: 'Friday night',
			description: 'Busier all evening; traffic builds over hours, so autoscaling keeps up.',
			traffic: 2.5,
		},
		{
			id: 'sudden-rain',
			name: 'Sudden rain',
			description:
				'It starts pouring at rush hour: within minutes, five times as many people want a ride and check prices.',
			traffic: 1.5,
			journeyTraffic: { 'request-ride': 5, 'check-price': 4 },
			sudden: true,
		},
		{
			id: 'new-year',
			name: 'New Year’s Eve',
			description: 'Midnight strikes and the whole city wants to go home at once.',
			traffic: 2.5,
			journeyTraffic: { 'request-ride': 6, 'check-price': 5, 'track-driver': 2 },
			sudden: true,
		},
	],
	challenges: [
		{
			id: 'routing-down',
			title: 'Routing goes down',
			story: 'The ETA service has crashed. Rides still get matched, because dispatch can fall back to straight-line distance, but every ride request now hangs for seconds waiting for answers that never come.',
			preset: 'normal',
			down: ['eta-service'],
			goal: { journey: 'request-ride', minSuccess: 0.99, maxLatencyMs: 500 },
			hint: 'The ETA service can’t be fixed in time. Can callers stop waiting for it?',
			lesson: 'Circuit breakers notice that the ETA service keeps failing and stop calling it, answering at once instead of waiting for a timeout. Because ETAs are optional, matching carries on with straight-line distance. Failing fast plus a fallback is graceful degradation.',
		},
		{
			id: 'sudden-rain',
			title: 'Caught in the rain',
			story: 'It starts pouring at rush hour. Within minutes five times as many people want a ride, and autoscaling won’t add servers for several minutes: by then riders have given up.',
			preset: 'sudden-rain',
			goal: { journey: 'request-ride', minSuccess: 0.99, maxLatencyMs: 1000 },
			hint: 'Find what’s overloaded on the ride request path and add instances by hand, the way teams scale up ahead of a forecast.',
			lesson: 'Autoscaling follows traffic, so it’s always a few minutes behind. For spikes you can see coming (a storm, a concert ending, New Year’s Eve) teams scale up ahead of time. Dispatch is the bottleneck here. The ETA service is overloaded too, but it’s optional: breakers or more instances keep it from slowing requests down.',
		},
		{
			id: 'surge-cache-friday',
			title: 'The surge cache fails on a Friday night',
			story: 'The surge cache crashes at the busiest time of the week. Every price check now counts recent requests in the trip database instead, and the database is drowning. Drivers can’t even end their trips.',
			preset: 'friday-night',
			down: ['surge-cache'],
			goal: { journey: 'check-price', minSuccess: 0.99, maxLatencyMs: 1000 },
			hint: 'The cache can’t come back in time. What was it protecting, and can that take the extra load?',
			lesson: 'A cache hides how much load the database behind it would get. When it fails, every request falls through at once: a cascading failure that hurts unrelated features, like ending trips. Databases need headroom for this, or a fallback that doesn’t touch them, such as using the last known surge prices.',
		},
		{
			id: 'new-year',
			title: 'Midnight on New Year’s Eve',
			story: 'At midnight the whole city wants to go home at once. Ride requests jump six-fold, everyone checks prices, and every part of the system is under strain.',
			preset: 'new-year',
			goal: { journey: 'request-ride', minSuccess: 0.99, maxLatencyMs: 1000 },
			hint: 'Work along the ride request path from the front door to the database. More than one part needs scaling ahead of time.',
			lesson: 'Big, predictable events are planned weeks ahead: teams estimate the peak, scale every part on the critical path before it arrives, and decide what can degrade (like ETAs) to protect what can’t (getting a ride).',
		},
	],
};
