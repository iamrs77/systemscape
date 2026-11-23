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
			id: 'load-balancer',
			name: 'Load balancer',
			kind: 'balancer',
			layer: 'balancing',
			summary:
				'Receives every request from the apps and passes it to whichever copy of a gateway is least busy.',
			why: 'The gateways run as several copies. Something has to spread requests across them, and stop sending any to a copy that has crashed.',
			onFailure:
				'Nothing gets in: every journey fails at once. That’s why it runs as a few copies itself, each able to take over.',
			scaling:
				'It only passes requests on, so it’s fast: a couple of copies handle a whole city. More are added as traffic grows.',
			capacityPerInstance: 60_000,
			instances: 2,
			maxInstances: 8,
			latencyMs: 1,
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
			person: 'Arjun',
			story: 'Arjun drives for the app. It’s 9:00 pm and he’s waiting for a ride on 80 Feet Road, Koramangala, with the app open.',
			hops: [
				{
					from: 'driver-app',
					to: 'load-balancer',
					label: 'Position update',
					example: {
						says: 'Every 4 seconds, Arjun’s phone sends where he is, over the connection it keeps open.',
						data: {
							driver: 'Arjun',
							at: '12.9352° N, 77.6245° E',
							time: '9:00:04 pm',
						},
					},
				},
				{
					from: 'load-balancer',
					to: 'realtime-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'When Arjun’s phone first connected, the load balancer gave it the least busy copy of the real-time gateway. His updates keep going to that copy.',
						data: {
							to: 'Real-time gateway, copy 3 of 4',
						},
					},
				},
				{
					from: 'realtime-gateway',
					to: 'location-service',
					label: 'Pass it on',
					example: {
						says: 'The gateway passes the update straight on to the location service.',
						data: {
							driver: 'Arjun',
							at: '12.9352° N, 77.6245° E',
						},
					},
				},
				{
					from: 'location-service',
					to: 'geo-index',
					label: 'File under the driver’s map cell',
					example: {
						says: 'Arjun’s new position replaces his old one, filed under the hexagon he’s in.',
						data: {
							driver: 'Arjun',
							cell: 'Koramangala #4127',
							answer: 'saved',
						},
					},
				},
				{
					from: 'location-service',
					to: 'event-stream',
					label: 'Publish the update',
					example: {
						says: 'A note that Arjun moved is added to the event stream, for anything that needs it later.',
						data: {
							event: 'driver moved',
							driver: 'Arjun',
							cell: 'Koramangala #4127',
						},
					},
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'surge-worker',
					label: 'Count drivers per area',
					example: {
						says: 'The surge calculator reads the note and counts Arjun among the free drivers in his area.',
						data: {
							area: 'Koramangala',
							'free drivers': '38',
						},
					},
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
			person: 'Rohit',
			story: 'It’s 9:01 pm. Rohit is in Koramangala 5th Block and needs to get to Indiranagar. He types the address and waits for the price.',
			hops: [
				{
					from: 'rider-app',
					to: 'load-balancer',
					label: 'Get a fare estimate',
					example: {
						says: 'Rohit’s app asks how much the ride will cost.',
						data: {
							rider: 'Rohit',
							from: 'Koramangala 5th Block',
							to: '100 Feet Road, Indiranagar',
						},
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer sends Rohit’s question to whichever copy of the API gateway is least busy right now.',
						data: {
							to: 'API gateway, copy 2 of 3',
						},
					},
				},
				{
					from: 'api-gateway',
					to: 'pricing-service',
					label: 'Work out the fare',
					example: {
						says: 'The gateway checks it’s really Rohit, then passes the question to pricing.',
						data: {
							rider: 'Rohit (signed in)',
							from: 'Koramangala 5th Block',
							to: '100 Feet Road, Indiranagar',
							answer: '₹212',
						},
					},
				},
				{
					from: 'pricing-service',
					to: 'surge-cache',
					label: 'Surge for this hexagon',
					example: {
						says: 'Pricing asks how busy Rohit’s area is right now.',
						data: {
							cell: 'Koramangala #4127',
							answer: '1.2× (busy)',
						},
					},
				},
				{
					from: 'surge-cache',
					to: 'trip-db',
					label: 'Count recent requests nearby',
					example: {
						says: 'Only when the cache doesn’t know: count the ride requests in this area in the last 5 minutes.',
						data: {
							area: 'Koramangala',
							since: '8:56 pm',
							answer: '142 requests',
						},
					},
					onMiss: true,
					calls: 2,
				},
				{
					from: 'pricing-service',
					to: 'eta-service',
					label: 'Trip length',
					example: {
						says: 'How long will this trip take on tonight’s roads? The fare depends on it.',
						data: {
							from: 'Koramangala 5th Block',
							to: 'Indiranagar',
							answer: '18 min, 6.2 km',
						},
					},
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
			person: 'Rohit',
			story: 'It’s 9:02 pm. Rohit is happy with the ₹212 fare and taps Book.',
			hops: [
				{
					from: 'rider-app',
					to: 'load-balancer',
					label: 'Request a ride',
					example: {
						says: 'Rohit’s app sends the booking.',
						data: {
							rider: 'Rohit',
							pickup: 'Koramangala 5th Block',
							drop: '100 Feet Road, Indiranagar',
							fare: '₹212',
						},
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer sends the booking to whichever copy of the API gateway is least busy right now: this time, a different one.',
						data: {
							to: 'API gateway, copy 1 of 3',
						},
					},
				},
				{
					from: 'api-gateway',
					to: 'dispatch-service',
					label: 'Find a driver',
					example: {
						says: 'The gateway checks it’s really Rohit and hands the booking to Dispatch.',
						data: {
							rider: 'Rohit',
							pickup: '12.9352° N, 77.6245° E',
						},
					},
				},
				{
					from: 'dispatch-service',
					to: 'geo-index',
					label: 'Drivers in nearby cells',
					example: {
						says: 'Which drivers are free in Rohit’s hexagon and the six around it?',
						data: {
							cells: 'Koramangala #4127 and 6 around it',
							answer: '9 free drivers',
						},
					},
				},
				{
					from: 'dispatch-service',
					to: 'eta-service',
					label: 'Arrival time for the closest drivers',
					example: {
						says: 'For the 5 closest drivers: how long would each take to reach Rohit, by road?',
						data: {
							drivers: 'Arjun, Meera and 3 more',
							answer: 'Arjun 3 min, Meera 5 min, …',
						},
					},
					calls: 5,
					optional: true,
				},
				{
					from: 'dispatch-service',
					to: 'realtime-gateway',
					label: 'Offer the ride to a driver',
					example: {
						says: 'Arjun is quickest, so the offer goes to his phone over its open connection.',
						data: {
							to: 'Arjun',
							ride: 'Rohit: Koramangala → Indiranagar',
							answer: 'accepted after 4 s',
						},
					},
					calls: 1.4,
				},
				{
					from: 'dispatch-service',
					to: 'trip-service',
					label: 'Create the trip',
					example: {
						says: 'Arjun said yes, so Dispatch asks for the trip to be created.',
						data: {
							rider: 'Rohit',
							driver: 'Arjun',
							pickup: 'Koramangala 5th Block',
						},
					},
				},
				{
					from: 'trip-service',
					to: 'trip-db',
					label: 'Save the trip',
					retries: 2,
					example: {
						says: 'The trip is saved, with its own number, before anyone is told.',
						data: {
							trip: 'T-48213',
							rider: 'Rohit',
							driver: 'Arjun',
							status: 'driver on the way',
							fare: '₹212',
						},
					},
				},
				{
					from: 'trip-service',
					to: 'event-stream',
					label: 'Trip requested',
					example: {
						says: 'A note goes on the event stream: a trip just started in Koramangala.',
						data: {
							event: 'trip requested',
							trip: 'T-48213',
							area: 'Koramangala',
						},
					},
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'surge-worker',
					label: 'Count demand per area',
					example: {
						says: 'The surge calculator adds it to Koramangala’s demand, which sets the price for the next person.',
						data: {
							area: 'Koramangala',
							'requests in 5 min': '143',
						},
					},
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
			person: 'Rohit',
			story: 'Rohit has a driver. For the next 3 minutes he watches Arjun’s car move towards him on the map.',
			hops: [
				{
					from: 'rider-app',
					to: 'load-balancer',
					label: 'Keep the map live',
					example: {
						says: 'Rohit’s app keeps a connection open, so updates arrive without it having to ask.',
						data: {
							rider: 'Rohit',
							watching: 'trip T-48213',
						},
					},
				},
				{
					from: 'load-balancer',
					to: 'realtime-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer gives Rohit’s connection to the least busy copy of the real-time gateway, and keeps it there.',
						data: {
							to: 'Real-time gateway, copy 4 of 4',
						},
					},
				},
				{
					from: 'realtime-gateway',
					to: 'trip-service',
					label: 'Who’s my driver?',
					example: {
						says: 'Every so often, the gateway checks which driver is on Rohit’s trip.',
						data: {
							trip: 'T-48213',
							answer: 'Arjun',
						},
					},
					share: 0.1,
				},
				{
					from: 'realtime-gateway',
					to: 'geo-index',
					label: 'Driver’s latest position',
					example: {
						says: 'Where is Arjun right now?',
						data: {
							driver: 'Arjun',
							answer: '12.9341° N, 77.6238° E',
						},
					},
				},
				{
					from: 'realtime-gateway',
					to: 'eta-service',
					label: 'Time to pickup',
					example: {
						says: 'How long until Arjun reaches Rohit?',
						data: {
							from: 'Arjun',
							to: 'Rohit',
							answer: '2 min',
						},
					},
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
			person: 'Arjun',
			story: 'At 9:24 pm Arjun drops Rohit on 100 Feet Road, Indiranagar, and taps End trip.',
			rps: 250,
			hops: [
				{
					from: 'driver-app',
					to: 'load-balancer',
					label: 'End trip',
					example: {
						says: 'Arjun’s phone sends that the trip is over.',
						data: {
							driver: 'Arjun',
							trip: 'T-48213',
							ended: '9:24 pm',
						},
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to whichever copy of the API gateway is least busy.',
						data: {
							to: 'API gateway, copy 3 of 3',
						},
					},
				},
				{
					from: 'api-gateway',
					to: 'trip-service',
					label: 'Complete the trip',
					example: {
						says: 'The gateway passes it on, with how far and how long the trip was.',
						data: {
							trip: 'T-48213',
							distance: '6.4 km',
							time: '19 min',
						},
					},
				},
				{
					from: 'trip-service',
					to: 'trip-db',
					label: 'Save fare and status',
					retries: 2,
					example: {
						says: 'The final fare and the new status are saved straight away.',
						data: {
							trip: 'T-48213',
							status: 'completed',
							fare: '₹218',
						},
					},
				},
				{
					from: 'trip-service',
					to: 'event-stream',
					label: 'Trip completed',
					example: {
						says: 'A note goes on the event stream: trip T-48213 is done, and owes ₹218.',
						data: {
							event: 'trip completed',
							trip: 'T-48213',
							fare: '₹218',
						},
					},
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'payment-service',
					label: 'Charge the rider',
					example: {
						says: 'The payment service picks up the note and gets ready to charge Rohit.',
						data: {
							rider: 'Rohit',
							amount: '₹218',
							card: '•••• 4417',
						},
					},
					mode: 'async',
				},
				{
					from: 'payment-service',
					to: 'payment-provider',
					label: 'Charge the card',
					example: {
						says: 'It asks the card company to take the money. If they’re slow, it tries again later, and Rohit never waits.',
						data: {
							card: '•••• 4417',
							amount: '₹218',
							answer: 'approved',
						},
					},
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
