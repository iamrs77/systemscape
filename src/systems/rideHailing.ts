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
		'Finds a nearby driver for each rider in seconds, while every driver’s phone keeps sharing its location.',
	basis: 'inspired',
	description: [
		'A rider asks for a ride. The app finds a nearby driver and shows the price and the car on its way. At the end, it charges the rider. Behind the scenes, every working driver’s phone sends its location every few seconds. So the system always knows where every driver is.',
		'This is a simpler version, based on public talks and blog posts by engineers. It is not any company’s real system. The traffic numbers are examples, for one big city on an ordinary evening.',
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
			title: 'Driver locations are kept in memory, not in the main database',
			detail: 'Tens of thousands of location updates arrive every second, and each one is old a few seconds later. Matching only needs each driver’s latest location. So that is kept in the computer’s memory, which is much faster than a disk. It’s grouped by area of the city. The full history goes to the event stream, for anything that needs it later.',
		},
		{
			title: 'The map is cut into small cells',
			detail: 'To find drivers near a rider, Dispatch looks only in the rider’s cell and the cells around it. It doesn’t measure the distance to every driver in the city. In 2015, Uber used a grid of cells made by Google. Later, Uber made a grid of hexagons, called H3, for pricing and matching, and shared it for free. With hexagons, all six neighbouring cells are the same distance away.',
		},
		{
			title: 'A live connection to every phone',
			detail: 'The system sends ride offers and driver locations to the apps over connections that stay open. Without them, the apps would ask “anything new?” again and again. Uber said this asking once made up 80% of the requests to its API gateway. The cost is keeping over a million connections open, and moving them to another server when one restarts.',
		},
		{
			title: 'Matching works even without arrival times',
			detail: 'Dispatch puts nearby drivers in order by how soon they could arrive. To know that, it asks the ETA service. If the ETA service is slow or down, Dispatch uses the straight-line distance on the map instead. Matches get a little worse, but riders still get a car.',
		},
		{
			title: 'Payment happens after the trip, in the background',
			detail: 'When a trip ends, the app doesn’t wait for the card to be charged. The charge goes through the event stream and is retried if it fails. So if the payment provider is down, drivers can still finish trips. The cost: some charges fail later, and someone has to follow them up. Uber’s real payments system works mostly in the background like this. It writes every charge in a ledger, which is a list of all the money that moves. The entries must add up to zero, so no money appears or disappears.',
		},
		{
			title: 'An event stream connects everything else',
			detail: 'Every driver location and every trip change is added to an event stream. Other parts read from it: surge pricing, payments and notifications. None of them slow down the trip itself.',
		},
		{
			title: 'Past trips are read from a copy',
			detail: 'Riders look at old trips and receipts far more often than trips change. So those reads go to a read-only copy of the trip database, a moment behind it. The main database is left free to save new trips. The cost: a trip that just ended can take a second to show up.',
		},
		{
			title: 'Notifications go through Apple and Google',
			detail: 'A closed app can’t keep a live connection open. So messages like “Your driver has arrived” are sent as notifications. Only Apple and Google can deliver one to a phone, so every app sends them through their services. They set the limits, and now and then they’re slow.',
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
			onFailure: 'This app stands for the riders, so the simulation doesn’t make it fail.',
			scaling: 'It runs on each rider’s own phone, so there’s nothing to grow.',
		},
		{
			id: 'driver-app',
			name: 'Driver app',
			kind: 'client',
			layer: 'clients',
			summary:
				'Sends the driver’s location every few seconds, gets ride offers, and ends trips.',
			why: 'It’s how drivers do their work. Every location update starts here.',
			onFailure: 'This app stands for the drivers, so the simulation doesn’t make it fail.',
			scaling: 'It runs on each driver’s own phone, so there’s nothing to grow.',
		},
		{
			id: 'load-balancer',
			name: 'Load balancer',
			kind: 'balancer',
			layer: 'balancing',
			summary:
				'Receives every request from the apps and passes it to the least busy copy of a gateway.',
			why: 'Each gateway runs as several copies. Something has to share the requests out between them. It also stops sending requests to a copy that has crashed.',
			onFailure:
				'Nothing gets in, and every journey fails at once. That’s why it runs as a few copies too, and each one can take over.',
			scaling:
				'It only passes requests on, so it’s very fast. Two copies can handle a whole city. More are added as traffic grows.',
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
				'The front door for requests from the apps. It checks who is asking, stops anyone sending too many requests, and sends each request to the right service.',
			why: 'Checking who is signed in, limiting requests and picking the right service all happen in one place. So each service doesn’t have to do them itself.',
			onFailure:
				'Nothing gets in. Riders can’t see prices or book rides, and drivers can’t end trips.',
			scaling:
				'It keeps nothing between requests, so any copy can take any request. That makes autoscaling easy: the load balancer just spreads requests over more copies.',
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
				'Keeps a live connection open to every phone, like a phone call that stays connected. Drivers send their location through it. Ride offers and the driver’s location go back to the phones the same way, straight away.',
			why: 'Without it, every phone would keep asking “anything new?” every few seconds. An open connection is faster and much cheaper.',
			onFailure:
				'Driver locations stop coming in, and drivers stop getting ride offers. Within seconds, no new rides can be matched.',
			scaling:
				'Each server holds some of the open connections, so more servers hold more. When a server restarts, its phones connect to another one.',
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
				'Takes each new driver location, files it under the right map cell, and adds it to the event stream.',
			why: 'Driver locations are the busiest work in the whole system. They get their own service, kept simple and fast.',
			onFailure:
				'Driver locations get old. Dispatch then matches riders with drivers who have already moved away.',
			scaling:
				'It keeps nothing between requests, so autoscaling just adds copies as more drivers come online.',
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
				'Works out the price of a trip. If the area is busy right now, the price is multiplied, for example by 1.2. This is called surge pricing.',
			why: 'Riders see a price before they book. They check prices many more times than they actually book.',
			onFailure: 'Riders can’t see a price, so they can’t ask for a ride.',
			scaling:
				'It keeps nothing between requests, so autoscaling can add copies. It reads the surge from the surge cache, which saves a lot of work.',
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
				'Finds free drivers in the rider’s map cell and the cells around it. It puts them in order by how soon they can arrive, and offers the ride.',
			why: 'Matching riders with drivers is the heart of the app. Fast, good matches keep riders and drivers happy.',
			onFailure: 'No one gets matched, so every ride request fails.',
			scaling:
				'It autoscales, but slowly. A new copy needs a few minutes to start and get ready. That’s too slow for a sudden rush.',
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
				'Works out how long a driver would take to reach a place. It uses real roads, and how busy they are right now.',
			why: 'A driver who looks close on the map can be far away by road. So arrival time gives better matches than straight-line distance.',
			onFailure:
				'Arrival times disappear: riders don’t see how soon their driver comes. Dispatch picks drivers by straight-line distance instead. It’s worse, but rides still work.',
			scaling:
				'Working out routes takes a lot of computing. It autoscales, but each copy handles far fewer requests than most services.',
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
				'Looks after each trip from booking to drop-off. It knows who the rider and driver are, and what stage the trip is at.',
			why: 'Only one part decides what stage a trip is at. So the rider’s app and the driver’s app always agree.',
			onFailure: 'New rides can’t be booked, and trips can’t end.',
			scaling:
				'It keeps nothing between requests, so autoscaling can add copies. The trip database behind it is much harder to scale.',
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
				'Charges the rider when a trip ends, and keeps a record of every charge. If the payment provider doesn’t answer, it retries.',
			why: 'All the money work happens in one place: charges, retries and receipts.',
			onFailure:
				'Charges wait in the event stream and go through when it’s back. Trips carry on as normal.',
			scaling:
				'It autoscales, but the payment provider sets the real limit. It can only take so many charges a second.',
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
				'A long list of everything that happens, in order: every driver location and every trip change. Other parts read it when they’re ready, so nobody waits for them.',
			why: 'Surge pricing, payments and notifications all need to know what happened. They read it here, so they never slow a trip down.',
			onFailure:
				'Background work stops. Surge prices stay as they are, and charges wait. Trips themselves carry on.',
			scaling:
				'The list is split into pieces kept on several servers. Adding servers is planned ahead, not done automatically.',
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
				'Counts ride requests and free drivers in every map cell. From these, it works out how much prices should go up in each area, and keeps that up to date.',
			why: 'When more riders want a car than there are drivers, higher prices bring more drivers out. Some riders wait a little, which spreads out the rush.',
			onFailure: 'Surge prices stop changing and stay where they were.',
			scaling:
				'The city is split between several workers, each counting its own areas. Autoscaling adds workers when it gets busy.',
			capacityPerInstance: 40_000,
			instances: 2,
			maxInstances: 10,
			latencyMs: 15,
		},
		{
			id: 'notification-service',
			name: 'Notification service',
			kind: 'notifier',
			layer: 'async',
			summary:
				'Sends messages to people’s phones, like “Your driver has arrived”. They show up even when the app is closed.',
			why: 'A closed app can’t keep a live connection open. A notification is the only way to reach it.',
			onFailure:
				'Messages stop arriving. Riders miss “Your driver has arrived” and have to open the app to check. Rides carry on.',
			scaling:
				'It autoscales. Messages wait in the event stream until it catches up, so a burst only delays them a little.',
			capacityPerInstance: 3_000,
			instances: 2,
			maxInstances: 20,
			latencyMs: 15,
		},
		{
			id: 'geo-index',
			name: 'Driver location index',
			kind: 'database',
			layer: 'data',
			summary:
				'Every working driver’s latest location, grouped by map cell. It’s kept in the computer’s memory, which is much faster than a disk. It answers “which drivers are near here?” in a few milliseconds.',
			why: 'Matching needs drivers’ locations instantly. A database on disk couldn’t keep up with so many updates every second.',
			onFailure: 'Dispatch can’t find any drivers, so matching stops.',
			scaling:
				'It’s split into shards, and each shard holds some areas of the city. Adding a shard means moving data, so it’s planned ahead, not done automatically.',
			capacityPerInstance: 15_000,
			instances: 6,
			latencyMs: 2,
		},
		{
			id: 'surge-cache',
			name: 'Surge cache',
			kind: 'cache',
			layer: 'data',
			summary:
				'Remembers the current surge for each map cell, such as 1.2×, ready to read in an instant.',
			why: 'Riders check prices far more often than the surge changes. Reading the surge from memory saves working it out again every time.',
			onFailure:
				'Every price check must then count recent ride requests in the trip database. That’s slower, and puts heavy load on the database.',
			scaling: 'It’s small and mostly read, so a few copies are plenty.',
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
				'Every trip and what stage it’s at, saved safely so nothing is lost. The trips are split into shards, so each server holds only some of them.',
			why: 'Trips involve money, so their records must be right. A trip must never be in two stages at once, so every server must agree on its latest stage. Uber moved this to Google Cloud Spanner, a database built for that.',
			onFailure: 'No new rides can start and no trips can end, until it’s back.',
			scaling:
				'It’s split into shards. Adding a shard is planned ahead, not done automatically.',
			capacityPerInstance: 1_500,
			instances: 3,
			latencyMs: 8,
		},
		{
			id: 'trip-history',
			name: 'Trip history',
			kind: 'database',
			layer: 'data',
			summary:
				'A read-only copy of the trip database, a moment behind it. Past trips and receipts are read from here. This kind of copy is called a read replica.',
			why: 'People look at old trips far more often than trips change. Reading from a copy keeps that work off the trip database, which is busy saving new trips.',
			onFailure:
				'Riders can’t see past trips or receipts for a while. Booking, riding and paying carry on.',
			scaling:
				'When more people read, add another copy. Each copy gets every change from the trip database a moment later.',
			capacityPerInstance: 3_000,
			instances: 2,
			latencyMs: 5,
		},
		{
			id: 'payment-provider',
			name: 'Payment provider',
			kind: 'external',
			layer: 'external',
			summary: 'The card company or bank that actually moves the money.',
			why: 'Only a company with a legal licence can move people’s money.',
			onFailure:
				'Charges fail and are retried later. Riders and drivers don’t notice straight away.',
			scaling:
				'It belongs to another company, so we can’t make it bigger. It has its own limits, and sometimes it goes down.',
			capacityPerInstance: 1_200,
			instances: 1,
			latencyMs: 250,
		},
		{
			id: 'push-provider',
			name: 'Apple & Google push',
			kind: 'external',
			layer: 'external',
			summary:
				'The services Apple and Google run to deliver a notification to an iPhone or an Android phone.',
			why: 'Only Apple and Google can wake a phone and show a notification on it. Every app has to send its notifications through them.',
			onFailure:
				'Notifications arrive late, or not at all. The app still works when it’s open.',
			scaling:
				'It belongs to Apple and Google, so we can’t make it bigger. They also limit how many notifications each app can send.',
			capacityPerInstance: 20_000,
			instances: 1,
			latencyMs: 120,
		},
	],
	journeys: [
		{
			id: 'share-location',
			scenario: 'new-year',
			name: 'Drivers share their location',
			description:
				'Every working driver’s phone sends its location every few seconds. In a 2015 talk, Uber said every 4 seconds. This is by far the busiest journey.',
			rps: 25_000,
			person: 'Arjun',
			story: 'Arjun drives for the app. It’s 9:00 pm. He’s on 80 Feet Road, Koramangala, with the app open, waiting for someone to book.',
			hops: [
				{
					from: 'driver-app',
					to: 'load-balancer',
					label: 'Send the driver’s location',
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
						says: 'When Arjun’s phone first connected, the load balancer chose the least busy copy of the real-time gateway. All his updates keep going to that same copy.',
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
					label: 'Save it in the right map cell',
					example: {
						says: 'Arjun’s new location replaces his old one. It’s saved under the map cell he’s in.',
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
					label: 'Post to the event stream',
					example: {
						says: 'A note saying “Arjun moved” goes on the event stream, for any part that needs it later.',
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
					label: 'Count free drivers in each area',
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
			scenario: 'cache-restart',
			name: 'See the price',
			description:
				'A rider types where they want to go and sees the price. Riders check prices far more often than they book.',
			rps: 1_500,
			person: 'Rohit',
			story: 'It’s 9:01 pm. Rohit is in Koramangala 5th Block and needs to get to Indiranagar. He types the address and waits for the price.',
			hops: [
				{
					from: 'rider-app',
					to: 'load-balancer',
					label: 'Ask for the price',
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
						says: 'The load balancer sends Rohit’s question to the least busy copy of the API gateway.',
						data: {
							to: 'API gateway, copy 2 of 3',
						},
					},
				},
				{
					from: 'api-gateway',
					to: 'pricing-service',
					label: 'Work out the price',
					example: {
						says: 'The gateway checks it’s really Rohit, then passes the question to the pricing service.',
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
					label: 'Check how busy the area is',
					example: {
						says: 'The pricing service asks how busy Rohit’s area is right now.',
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
						says: 'The cache doesn’t know, so the database counts the ride requests in this area in the last 5 minutes.',
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
					label: 'Check how long the trip takes',
					example: {
						says: 'How long will this trip take on tonight’s roads? The price depends on it.',
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
			scenario: 'sudden-rain',
			name: 'Request a ride',
			description:
				'A rider asks for a ride. Dispatch finds nearby drivers, puts them in order by how soon they can arrive, and offers the ride.',
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
						says: 'The load balancer sends the booking to the least busy copy of the API gateway. This time, it’s a different copy.',
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
					label: 'Look in nearby map cells',
					example: {
						says: 'Which drivers are free in Rohit’s map cell and the six cells around it?',
						data: {
							cells: 'Koramangala #4127 and 6 around it',
							answer: '9 free drivers',
						},
					},
				},
				{
					from: 'dispatch-service',
					to: 'eta-service',
					label: 'Ask when each driver could arrive',
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
							answer: 'accepted after 4 seconds',
						},
					},
					calls: 1.4,
				},
				{
					from: 'dispatch-service',
					to: 'trip-service',
					label: 'Create the trip',
					example: {
						says: 'Arjun said yes, so Dispatch asks the trip service to create the trip.',
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
					label: 'Post to the event stream',
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
					label: 'Count requests in each area',
					example: {
						says: 'The surge calculator adds it to the count of ride requests in Koramangala. That count helps set the price for the next rider.',
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
				'While a rider waits, the driver’s location and arrival time are sent to their map every few seconds.',
			rps: 6_000,
			person: 'Rohit',
			scenario: 'maps-down',
			story: 'Rohit has a driver. For the next 3 minutes he watches Arjun’s car move towards him on the map.',
			hops: [
				{
					from: 'rider-app',
					to: 'load-balancer',
					label: 'Keep the map up to date',
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
					label: 'Check who the driver is',
					example: {
						says: 'Now and then, the gateway checks which driver is on Rohit’s trip.',
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
					label: 'Get the driver’s location',
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
					label: 'Check how soon the driver arrives',
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
				{
					from: 'realtime-gateway',
					to: 'notification-service',
					label: 'Say the driver has arrived',
					example: {
						says: 'Arjun’s car reaches the pickup point. Rohit’s app might be closed, so the gateway asks for a notification too.',
						data: {
							to: 'Rohit',
							message: '“Arjun has arrived. White Swift, KA 01 AB 1234”',
						},
					},
					mode: 'async',
					share: 0.04,
				},
				{
					from: 'notification-service',
					to: 'push-provider',
					label: 'Send it through Apple',
					example: {
						says: 'Rohit has an iPhone, so the message goes through Apple. It shows on his lock screen, even with the app closed.',
						data: {
							phone: 'Rohit’s iPhone',
							answer: 'delivered',
						},
					},
					mode: 'async',
					share: 0.04,
					retries: 1,
				},
			],
		},
		{
			id: 'end-trip',
			name: 'End the trip and pay',
			description:
				'The driver ends the trip. The fare is saved straight away, and the rider is charged in the background.',
			person: 'Arjun',
			scenario: 'payments-down',
			story: 'At 9:24 pm, Arjun drops Rohit off on 100 Feet Road, Indiranagar, and taps End trip.',
			rps: 250,
			hops: [
				{
					from: 'driver-app',
					to: 'load-balancer',
					label: 'End the trip',
					example: {
						says: 'Arjun’s phone says the trip is over.',
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
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
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
					label: 'Save the fare and status',
					retries: 2,
					example: {
						says: 'The final fare is saved straight away, and the trip is marked as done.',
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
					label: 'Post to the event stream',
					example: {
						says: 'A note goes on the event stream: trip T-48213 is done, and the rider owes ₹218.',
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
				{
					from: 'trip-db',
					to: 'trip-history',
					label: 'Copy it to the trip history',
					example: {
						says: 'A moment later, the finished trip is copied to the read-only trip history, where Rohit will look for it.',
						data: {
							trip: 'T-48213',
							delay: 'about 1 second',
						},
					},
					mode: 'async',
				},
			],
		},
		{
			id: 'see-trips',
			name: 'See past trips',
			description:
				'A rider opens their past trips and receipts. These are read from a copy of the trip database, not the main one.',
			rps: 400,
			person: 'Rohit',
			scenario: 'cache-restart',
			story: 'The next morning, Rohit opens his past trips to find the receipt for last night’s ride.',
			hops: [
				{
					from: 'rider-app',
					to: 'load-balancer',
					label: 'Open past trips',
					example: {
						says: 'Rohit’s app asks for his recent trips.',
						data: {
							rider: 'Rohit',
							show: 'last 10 trips',
						},
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: {
							to: 'API gateway, copy 2 of 3',
						},
					},
				},
				{
					from: 'api-gateway',
					to: 'trip-service',
					label: 'Get the rider’s trips',
					example: {
						says: 'The gateway checks it’s really Rohit, and asks for his trips.',
						data: {
							rider: 'Rohit',
							trips: 'last 10',
						},
					},
				},
				{
					from: 'trip-service',
					to: 'trip-history',
					label: 'Read them from the copy',
					example: {
						says: 'The trips are read from the trip history, not the busy trip database.',
						data: {
							answer: '10 trips, newest first. T-48213: ₹218, paid',
						},
					},
				},
			],
		},
		{
			id: 'cancel-ride',
			name: 'Cancel a ride',
			description:
				'A rider cancels before the driver arrives. The trip is marked as cancelled, and the driver is free for the next ride.',
			rps: 30,
			person: 'Rohit',
			story: 'Another evening, Rohit books a ride, then a friend offers him a lift. He taps Cancel, twice by mistake.',
			hops: [
				{
					from: 'rider-app',
					to: 'load-balancer',
					label: 'Cancel the ride',
					example: {
						says: 'Rohit’s app asks to cancel his trip. He tapped twice, so the request goes twice.',
						data: {
							rider: 'Rohit',
							trip: 'T-51907',
						},
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes each request to the least busy copy of the API gateway.',
						data: {
							to: 'API gateway, copy 1 of 3',
						},
					},
				},
				{
					from: 'api-gateway',
					to: 'trip-service',
					label: 'Cancel the trip',
					example: {
						says: 'The second request finds the trip already cancelled, so it changes nothing. Cancelling is idempotent: doing it twice is the same as doing it once.',
						data: {
							trip: 'T-51907',
							answer: 'cancelled, and the second tap changes nothing',
						},
					},
				},
				{
					from: 'trip-service',
					to: 'trip-db',
					label: 'Mark it cancelled',
					retries: 2,
					example: {
						says: 'The trip is saved as cancelled. If saving fails, it’s tried again, which is safe for the same reason.',
						data: {
							trip: 'T-51907',
							status: 'cancelled',
						},
					},
				},
				{
					from: 'trip-service',
					to: 'event-stream',
					label: 'Post to the event stream',
					example: {
						says: 'A note goes on the event stream: trip T-51907 is cancelled.',
						data: {
							event: 'trip cancelled',
							trip: 'T-51907',
						},
					},
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'dispatch-service',
					label: 'Free the driver',
					example: {
						says: 'Dispatch marks the driver, Kiran, as free again, so he can get the next ride offer.',
						data: {
							driver: 'Kiran',
							status: 'free',
						},
					},
					mode: 'async',
				},
				{
					from: 'event-stream',
					to: 'notification-service',
					label: 'Tell the driver',
					example: {
						says: 'A notification tells Kiran the ride is off, in case his app is in the background.',
						data: {
							to: 'Kiran',
							message: '“Rohit cancelled the ride”',
						},
					},
					mode: 'async',
				},
				{
					from: 'notification-service',
					to: 'push-provider',
					label: 'Send it through Google',
					example: {
						says: 'Kiran has an Android phone, so the message goes through Google.',
						data: {
							phone: 'Kiran’s Android',
							answer: 'delivered',
						},
					},
					mode: 'async',
					retries: 1,
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
			description:
				'Busier all evening. Traffic grows slowly over hours, so autoscaling has time to keep up.',
			traffic: 2.5,
		},
		{
			id: 'sudden-rain',
			name: 'Sudden rain',
			description:
				'It starts raining hard at rush hour. Within minutes, five times as many people want a ride, and four times as many check prices.',
			traffic: 1.5,
			journeyTraffic: { 'request-ride': 5, 'check-price': 4 },
			sudden: true,
		},
		{
			id: 'new-year',
			name: 'New Year’s Eve',
			description: 'It’s midnight, and the whole city wants to go home at the same time.',
			traffic: 2.5,
			journeyTraffic: { 'request-ride': 6, 'check-price': 5, 'track-driver': 2 },
			sudden: true,
		},
		{
			id: 'maps-down',
			name: 'Maps go down',
			description:
				'An ordinary evening, but the service that works out arrival times has stopped working.',
			traffic: 1,
			down: ['eta-service'],
		},
		{
			id: 'cache-restart',
			name: 'Cache restarts',
			description:
				'A busy Friday night, and the surge cache restarts empty. Every price check has to do the slow work again.',
			traffic: 2.5,
			down: ['surge-cache'],
		},
		{
			id: 'payments-down',
			name: 'Payments down',
			description:
				'An ordinary evening, but the payment provider has an outage. It can’t take any charges.',
			traffic: 1,
			down: ['payment-provider'],
		},
	],
};
