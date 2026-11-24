import type { SystemInput } from '@/model/schema';

/**
 * A video streaming app, simplified, based on what Netflix and Hotstar have
 * shared in public posts and talks. Traffic numbers are for one country on
 * an ordinary evening; they're illustrative, chosen so the trade-offs show.
 */
export const videoStreaming: SystemInput = {
	id: 'video-streaming',
	name: 'Video streaming app',
	tagline:
		'Getting a film, or a live cricket final, to millions of screens at once without buffering.',
	basis: 'inspired',
	description: [
		'Viewers browse what to watch, press play, and the video starts in a second or two. The video itself doesn’t come from the main servers. It comes from video servers close to the viewer, many inside their internet provider’s building. Behind the scenes, every new film is turned into many versions, one for each kind of screen and internet speed. Live matches are made into pieces as they happen.',
		'This is a simplified design based on public posts and talks by Netflix and Hotstar, not either company’s actual system. The traffic numbers are illustrative, for one country on an ordinary evening.',
	],
	sources: [
		{
			title: 'How Netflix works with ISPs around the globe to deliver a great viewing experience',
			url: 'https://about.netflix.com/en/news/how-netflix-works-with-isps-around-the-globe-to-deliver-a-great-viewing-experience',
			publisher: 'Netflix',
		},
		{
			title: 'Open Connect Overview',
			url: 'https://openconnect.netflix.com/Open-Connect-Overview.pdf',
			publisher: 'Netflix',
		},
		{
			title: 'Netflix: What Happens When You Press Play?',
			url: 'https://highscalability.com/netflix-what-happens-when-you-press-play/',
			publisher: 'Todd Hoff, High Scalability, 2017',
		},
		{
			title: 'Per-Title Encode Optimization',
			url: 'https://netflixtechblog.com/per-title-encode-optimization-7e99442b62a2',
			publisher: 'Netflix Technology Blog, 2015',
		},
		{
			title: 'Scaling Time Series Data Storage, Part I',
			url: 'https://netflixtechblog.com/scaling-time-series-data-storage-part-i-ec2b6d44ba39',
			publisher: 'Netflix Technology Blog, 2018',
		},
		{
			title: 'Making the Netflix API More Resilient',
			url: 'https://netflixtechblog.com/making-the-netflix-api-more-resilient-a8ec62159c2d',
			publisher: 'Netflix Technology Blog, 2011',
		},
		{
			title: 'India and Australia World Cup final shatters streaming records on Hotstar',
			url: 'https://techcrunch.com/2023/11/19/india-and-australia-world-cup-final-shatters-streaming-records-on-hotstar',
			publisher: 'TechCrunch, 2023',
		},
		{
			title: 'How Disney Hotstar achieved its impressive live streaming feat',
			url: 'https://analyticsindiamag.com/how-disney-hotstar-achieved-its-impressive-live-streaming-feat/',
			publisher: 'Analytics India Magazine',
		},
	],
	decisions: [
		{
			title: 'The video comes from servers next door, not from the main servers',
			detail: 'Netflix places its own video servers inside internet providers’ buildings, at no cost to them. Popular films are copied there at night, when the internet is quiet. So when someone presses play, the video only travels a few kilometres. The main servers just decide which nearby server to use.',
		},
		{
			title: 'Every film is made in many versions, ahead of time',
			detail: 'A phone on a slow connection and a big 4K TV need very different files. So each film is encoded into many versions, each cut into pieces a few seconds long. Netflix even tunes the versions for each title: a simple cartoon needs fewer bits than a dark action film.',
		},
		{
			title: 'The app keeps the next half minute ready',
			detail: 'While a film plays, the app fetches the next piece again and again, and keeps a buffer of what’s coming. If the internet slows down, it picks a smaller version for the next piece. The picture gets softer for a moment, instead of stopping.',
		},
		{
			title: 'A live match is made into pieces as it happens',
			detail: 'A live encoder turns every couple of seconds of the match into pieces in each version, and the CDN fetches them. Everyone watching asks for the same newest piece at the same moment, so the CDN answers almost all of them. Making each piece takes a moment, which is why the stream is a few seconds behind the stadium.',
		},
		{
			title: 'When recommendations fail, show popular titles instead',
			detail: 'Netflix wraps each call to another service so that, when it keeps failing, calls stop and a fallback is used. For the home screen, the fallback is rows that aren’t personal, like what’s popular. It’s less useful, but people can still pick something to watch.',
		},
		{
			title: 'Watch history is written far more than it’s read',
			detail: 'Every viewer’s app saves how far they’ve got every few seconds, but the history is only read when someone starts watching. Netflix found about nine writes for every read. So the history lives in a database built for lots of writes, split into shards by viewer.',
		},
		{
			title: 'Search has its own index',
			detail: 'Looking for a word in every title’s name and description would be slow. A search index lists every word and the titles it appears in, like the index at the back of a book. It’s built from the catalogue, so a new title shows up in search a few minutes late.',
		},
		{
			title: 'Scale up before the big match',
			detail: 'For a cricket final, tens of millions open the app in the last few minutes before the first ball. Hotstar had about 59 million people watching the 2023 World Cup final at once. That rush comes too fast for autoscaling, so Hotstar adds servers ahead of time, and tests with pretend crowds before the day.',
		},
	],
	rows: {
		clients:
			'Everything starts in an app: on a phone, a smart TV, or the content team’s upload tool. The apps keep very little themselves. They ask the backend for everything they show.',
		edge: 'There are two front doors. Requests to browse, search and press play come in through the API gateway. But the video itself comes through a different door: the CDN, which sits close to the viewer.',
		external:
			'These belong to other companies. Here, it’s the broadcaster, who sends the live picture from the ground. It isn’t ours, so we can’t fix it. We can only cope when it’s late.',
	},
	components: [
		{
			id: 'viewer-app',
			name: 'Viewer app',
			kind: 'client',
			layer: 'clients',
			summary:
				'The app on a phone or a smart TV. It shows what to watch, and plays the video a few seconds at a time.',
			why: 'It’s how people watch.',
			onFailure: 'This app stands for the viewers, so the simulation doesn’t make it fail.',
			scaling: 'It runs on each viewer’s own phone or TV, so there’s nothing to grow.',
		},
		{
			id: 'studio-app',
			name: 'Studio upload tool',
			kind: 'client',
			layer: 'clients',
			summary: 'The tool the content team uses to add new films and episodes.',
			why: 'Every film starts here, as one big file from the studio.',
			onFailure:
				'This tool stands for the content team, so the simulation doesn’t make it fail.',
			scaling: 'Only a few people use it, so there’s nothing to grow.',
		},
		{
			id: 'load-balancer',
			name: 'Load balancer',
			kind: 'balancer',
			layer: 'balancing',
			summary: 'Shares out requests from the apps between the copies of the API gateway.',
			why: 'The gateway runs as many copies. Something has to share the work out between them.',
			onFailure:
				'Nothing reaches the API gateway, so nobody can browse or press play. Films already playing keep going, because the video comes from the CDN.',
			scaling: 'A few copies handle a lot. It autoscales too, when the evening gets busy.',
			capacityPerInstance: 150_000,
			instances: 2,
			maxInstances: 10,
			latencyMs: 1,
		},
		{
			id: 'api-gateway',
			name: 'API gateway',
			kind: 'gateway',
			layer: 'edge',
			summary:
				'The front door for everything except the video itself. It checks who is asking, and sends each request to the right service.',
			why: 'The apps talk to one place, and the services behind it can change without the apps noticing.',
			onFailure: 'Nobody can browse or start a film. Films already playing keep going.',
			scaling:
				'It keeps nothing between requests, so any copy can take any request. That makes autoscaling easy.',
			capacityPerInstance: 10_000,
			instances: 8,
			maxInstances: 80,
			latencyMs: 4,
		},
		{
			id: 'cdn',
			name: 'CDN',
			kind: 'cdn',
			layer: 'edge',
			summary:
				'Video servers close to viewers, many inside their internet provider’s building. They keep copies of the films, so almost all the video comes from nearby.',
			why: 'Sending every piece of video from one place would be slow and very costly. From next door, it starts fast and doesn’t clog up the internet.',
			onFailure:
				'Every piece of video has to come from the main video storage, far away. It can’t keep up, so films buffer and stop.',
			scaling:
				'The servers are real machines in other companies’ buildings. Adding more is planned months ahead, not done automatically.',
			capacityPerInstance: 50_000,
			instances: 60,
			latencyMs: 15,
			hitRate: 0.99,
		},
		{
			id: 'catalog-service',
			name: 'Catalogue service',
			kind: 'service',
			layer: 'services',
			summary:
				'Knows every film and show: its title, pictures, episodes, and which countries can watch it.',
			why: 'Every screen of the app shows titles, so many parts need the same facts about them.',
			onFailure:
				'The home screen can’t fill in its rows, so viewers see empty or broken screens.',
			scaling:
				'It autoscales. Most of what it reads comes from the catalogue cache, so each copy can answer a lot.',
			capacityPerInstance: 5_000,
			instances: 6,
			maxInstances: 60,
			latencyMs: 10,
		},
		{
			id: 'search-service',
			name: 'Search service',
			kind: 'service',
			layer: 'services',
			summary:
				'Finds the titles that match what a viewer types, even with a spelling mistake.',
			why: 'There are thousands of titles. People need to find one by its name, an actor, or the kind of story.',
			onFailure: 'Search stops working. Viewers can still browse the home screen and play.',
			scaling: 'It autoscales. It keeps nothing itself, so any copy can take any request.',
			capacityPerInstance: 2_000,
			instances: 4,
			maxInstances: 40,
			latencyMs: 20,
		},
		{
			id: 'recommendation-service',
			name: 'Recommender',
			kind: 'service',
			layer: 'services',
			summary:
				'Picks the rows on each viewer’s home screen, like “Because you watched…”, from what they’ve watched before.',
			why: 'There are thousands of titles. Good picks help people find something to watch quickly.',
			onFailure:
				'The home screen shows popular titles instead of personal ones. It’s less useful, but it still works.',
			scaling: 'It autoscales. Picking rows is heavy work, so it needs many copies.',
			capacityPerInstance: 2_500,
			instances: 12,
			maxInstances: 60,
			latencyMs: 60,
		},
		{
			id: 'playback-service',
			name: 'Playback service',
			kind: 'service',
			layer: 'services',
			summary:
				'When someone presses play, it checks they’re allowed to watch, picks the nearest video servers that have the film, and sends back their addresses.',
			why: 'Someone has to decide, for each viewer, which version to start with and which nearby server to fetch it from.',
			onFailure: 'Nobody can start a film. Films already playing keep going.',
			scaling:
				'It autoscales, but a new copy takes a few minutes to start. That’s too slow when millions press play at once.',
			capacityPerInstance: 1_500,
			instances: 4,
			maxInstances: 60,
			latencyMs: 25,
		},
		{
			id: 'history-service',
			name: 'Watch history service',
			kind: 'service',
			layer: 'services',
			summary:
				'Remembers how far each viewer got in every title, so “Continue watching” starts where they stopped.',
			why: 'People stop and come back, often on a different screen. Their place has to follow them.',
			onFailure:
				'Films start from the beginning instead of where the viewer stopped. Watching itself carries on.',
			scaling: 'It autoscales. It keeps nothing itself, so any copy can take any request.',
			capacityPerInstance: 15_000,
			instances: 4,
			maxInstances: 40,
			latencyMs: 8,
		},
		{
			id: 'upload-service',
			name: 'Upload service',
			kind: 'service',
			layer: 'services',
			summary: 'Takes in new films from the content team, and saves the original file.',
			why: 'Films arrive as huge files. One part takes care of receiving them safely.',
			onFailure:
				'New films can’t be added for a while. Viewers don’t notice, because everything already ready keeps playing.',
			scaling: 'Uploads are rare, so a couple of copies are plenty.',
			capacityPerInstance: 50,
			instances: 2,
			maxInstances: 10,
			latencyMs: 200,
		},
		{
			id: 'live-encoder',
			name: 'Live encoder',
			kind: 'worker',
			layer: 'services',
			summary:
				'Turns the live picture from the ground into pieces a couple of seconds long, in every version, as the match happens.',
			why: 'Everyone watching live needs the same pieces, moments after they happen. Making them once, for everyone, is the only way.',
			onFailure:
				'No new pieces are made, so the picture freezes for everyone watching live. That’s why a spare copy is always running, often in another building.',
			scaling:
				'It doesn’t autoscale. A spare copy runs the whole time, ready to take over at once.',
			capacityPerInstance: 4,
			instances: 2,
			latencyMs: 1_500,
		},
		{
			id: 'encode-queue',
			name: 'Encoding queue',
			kind: 'queue',
			layer: 'async',
			summary:
				'A waiting list of encoding jobs. Each new film becomes many jobs, one for each version and piece that’s needed.',
			why: 'Encoding takes far longer than an upload. Jobs wait here, so the content team doesn’t have to.',
			onFailure:
				'New films can’t be prepared. Viewers don’t notice, because what’s already ready keeps playing.',
			scaling:
				'It only holds the list, so it rarely needs to grow. When the encoder is busy, jobs simply wait longer.',
			capacityPerInstance: 5_000,
			instances: 2,
			latencyMs: 3,
		},
		{
			id: 'encoders',
			name: 'Encoder',
			kind: 'worker',
			layer: 'async',
			summary:
				'Turns one film into many versions: small ones for phones on slow internet, sharp ones for big TVs. Each version is cut into pieces a few seconds long.',
			why: 'Making every version once, ahead of time, means nobody waits for it while watching.',
			onFailure:
				'Jobs wait in the queue. New films come out late, but everything already prepared plays as normal.',
			scaling:
				'Encoding is heavy work, so it runs as many copies. Autoscaling adds more when the queue gets long.',
			capacityPerInstance: 20,
			instances: 5,
			maxInstances: 50,
			latencyMs: 500,
		},
		{
			id: 'catalog-cache',
			name: 'Catalogue cache',
			kind: 'cache',
			layer: 'data',
			summary:
				'Keeps the catalogue in memory, ready to read in an instant. Titles rarely change, so almost every read is answered here.',
			why: 'Every home screen shows dozens of titles. Reading them all from the database each time would be slow.',
			onFailure:
				'Every read goes to the catalogue database. It’s slower, and the database may not keep up.',
			scaling: 'It’s mostly read, so a few copies are plenty.',
			capacityPerInstance: 100_000,
			instances: 2,
			latencyMs: 1,
			hitRate: 0.98,
		},
		{
			id: 'catalog-db',
			name: 'Catalogue database',
			kind: 'database',
			layer: 'data',
			summary:
				'Every title, with its episodes, pictures and descriptions in every language, saved safely.',
			why: 'The catalogue must be kept safely, and changed in one place, even if the cache is lost.',
			onFailure:
				'New titles can’t be added. Viewers barely notice while the cache still has the titles.',
			scaling:
				'It’s split into a few shards. The cache answers most reads, so it rarely needs more.',
			capacityPerInstance: 4_000,
			instances: 3,
			latencyMs: 6,
		},
		{
			id: 'search-index',
			name: 'Search index',
			kind: 'database',
			layer: 'data',
			summary:
				'Every word in every title’s name and description, and the titles it appears in, like the index at the back of a book.',
			why: 'Looking for a word in every title would be slow. The index finds them all at once.',
			onFailure: 'Search stops working until it’s back. Browsing and watching carry on.',
			scaling:
				'It’s split into shards. It’s built from the catalogue, so a new title shows up in search a few minutes late.',
			capacityPerInstance: 5_000,
			instances: 3,
			latencyMs: 5,
		},
		{
			id: 'history-db',
			name: 'Watch history database',
			kind: 'database',
			layer: 'data',
			summary:
				'Every viewer’s place in every title, split into shards by viewer. It’s written far more often than it’s read.',
			why: 'Millions of apps save their place every few seconds. This database is built to take that many writes.',
			onFailure:
				'Places stop being saved, so films restart from where they were last saved. Watching carries on.',
			scaling:
				'It’s split into shards. Adding a shard is planned ahead, not done automatically.',
			capacityPerInstance: 20_000,
			instances: 6,
			latencyMs: 4,
		},
		{
			id: 'video-storage',
			name: 'Video storage',
			kind: 'storage',
			layer: 'data',
			summary:
				'Every version of every film, in pieces a few seconds long, kept safely, and the newest pieces of every live match. The CDN copies from here.',
			why: 'There has to be one complete, safe copy of everything. The CDN only keeps what’s popular nearby.',
			onFailure:
				'New films can’t be saved, and the CDN can’t fetch what it doesn’t have. Popular films still play from the CDN.',
			scaling:
				'It can hold any amount of video. But it can only send so much at once, which is why the CDN matters.',
			capacityPerInstance: 5_000,
			instances: 8,
			latencyMs: 40,
		},
		{
			id: 'broadcaster',
			name: 'Broadcaster',
			kind: 'external',
			layer: 'external',
			summary:
				'The TV company filming the match. It sends the live picture from the ground, as it happens.',
			why: 'The cameras at the ground belong to the broadcaster. The app only gets the picture.',
			onFailure: 'No live picture arrives, so live matches stop. Films carry on as normal.',
			scaling: 'It belongs to another company, so we can’t make it bigger.',
			capacityPerInstance: 1_000,
			instances: 1,
			latencyMs: 1,
		},
	],
	journeys: [
		{
			id: 'browse',
			name: 'Browse what to watch',
			description:
				'A viewer opens the app and sees rows of films and shows, picked for them.',
			rps: 20_000,
			person: 'Meera',
			scenario: 'recs-down',
			story: 'It’s 8:30 pm in Pune. Meera opens the app on her TV to find something to watch.',
			hops: [
				{
					from: 'viewer-app',
					to: 'load-balancer',
					label: 'Open the home screen',
					example: {
						says: 'Meera’s TV asks for her home screen.',
						data: { viewer: 'Meera', device: 'TV, living room' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 5 of 8' },
					},
				},
				{
					from: 'api-gateway',
					to: 'recommendation-service',
					label: 'Pick rows for this viewer',
					example: {
						says: 'Which rows suit Meera tonight? She has watched a lot of crime dramas this month.',
						data: {
							viewer: 'Meera',
							answer: '“Because you watched City of Thieves”, “Top 10 in India”, …',
						},
					},
					optional: true,
				},
				{
					from: 'api-gateway',
					to: 'catalog-service',
					label: 'Fill in the titles',
					example: {
						says: 'For each row, the catalogue service fills in the names, pictures and short descriptions.',
						data: { titles: '40', language: 'English' },
					},
				},
				{
					from: 'catalog-service',
					to: 'catalog-cache',
					label: 'Read them from memory',
					example: {
						says: 'Almost every title is already in the catalogue cache.',
						data: { answer: '40 titles, 39 from memory' },
					},
				},
				{
					from: 'catalog-cache',
					to: 'catalog-db',
					label: 'Read the rest from the database',
					example: {
						says: 'The one title that wasn’t in memory is read from the database, and kept in memory for next time.',
						data: { title: 'a new documentary' },
					},
					onMiss: true,
				},
			],
		},
		{
			id: 'search',
			name: 'Search for a title',
			description:
				'A viewer types a word, and sees the titles that match. The words are looked up in a search index, not in the catalogue.',
			rps: 3_000,
			person: 'Meera',
			scenario: 'sunday',
			story: 'Meera remembers a film her friend mentioned, with “monsoon” in its name. She types it into search.',
			hops: [
				{
					from: 'viewer-app',
					to: 'load-balancer',
					label: 'Search for a word',
					example: {
						says: 'Meera’s TV sends what she typed.',
						data: { viewer: 'Meera', typed: 'monsun' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 3 of 8' },
					},
				},
				{
					from: 'api-gateway',
					to: 'search-service',
					label: 'Find matching titles',
					example: {
						says: 'The search service fixes the spelling: Meera probably meant “monsoon”.',
						data: { typed: 'monsun', 'looking for': 'monsoon' },
					},
				},
				{
					from: 'search-service',
					to: 'search-index',
					label: 'Look up the word',
					example: {
						says: 'The index lists every title with “monsoon” in its name or description, at once.',
						data: { word: 'monsoon', answer: '6 titles, best match first' },
					},
				},
				{
					from: 'search-service',
					to: 'catalog-service',
					label: 'Fill in the titles',
					example: {
						says: 'The catalogue service adds the pictures and short descriptions.',
						data: { titles: '6' },
					},
				},
				{
					from: 'catalog-service',
					to: 'catalog-cache',
					label: 'Read them from memory',
					example: {
						says: 'All six are in the catalogue cache.',
						data: { answer: '6 titles, all from memory' },
					},
				},
			],
		},
		{
			id: 'press-play',
			name: 'Press play',
			description:
				'A viewer presses play. The backend checks they may watch, finds where they stopped, and points the app to nearby video servers. The video itself comes from there.',
			rps: 2_000,
			person: 'Meera',
			scenario: 'final',
			story: 'Meera picks a film and presses play. She expects it to start in a second or two.',
			hops: [
				{
					from: 'viewer-app',
					to: 'load-balancer',
					label: 'Press play',
					example: {
						says: 'Meera’s TV asks to play the film.',
						data: { viewer: 'Meera', title: 'The Long Monsoon', device: 'TV' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 2 of 8' },
					},
				},
				{
					from: 'api-gateway',
					to: 'playback-service',
					label: 'Get ready to play',
					example: {
						says: 'The playback service checks Meera’s plan includes this film in India, and picks the nearest video servers that have it.',
						data: {
							title: 'The Long Monsoon',
							answer: '3 nearby video servers, 8 versions to choose from',
						},
					},
				},
				{
					from: 'playback-service',
					to: 'history-service',
					label: 'Find where she stopped',
					example: {
						says: 'Meera watched 41 minutes of this film last week, so it can start from there.',
						data: { viewer: 'Meera', answer: 'start at 41:12' },
					},
					optional: true,
				},
				{
					from: 'history-service',
					to: 'history-db',
					label: 'Read her place',
					example: {
						says: 'Her place is read from the watch history database.',
						data: { viewer: 'Meera', title: 'The Long Monsoon', answer: '41:12' },
					},
				},
				{
					from: 'viewer-app',
					to: 'cdn',
					label: 'Fetch the first few seconds',
					example: {
						says: 'The TV fetches the first piece of video from a server in her internet provider’s building, a few kilometres away. Nothing is ready yet, so Meera waits for this one.',
						data: {
							piece: '4 seconds, from 41:12',
							version: '1080p',
							from: 'CDN, Pune',
						},
					},
				},
				{
					from: 'cdn',
					to: 'video-storage',
					label: 'Copy it from storage',
					example: {
						says: 'If that server doesn’t have the film yet, it copies it from storage first. That’s rare: popular films are copied there at night.',
						data: { title: 'The Long Monsoon', version: '1080p' },
					},
					onMiss: true,
				},
			],
		},
		{
			id: 'watch',
			name: 'Keep watching',
			description:
				'While a film plays, the app fetches the next few seconds of video again and again. It keeps about half a minute ready, called a buffer, so a slow moment doesn’t stop the film. Each time, it picks a sharper or smaller version to suit the internet speed, which is called adaptive streaming. Now and then, it saves how far the viewer has got.',
			rps: 300_000,
			person: 'Meera',
			scenario: 'cdn-down',
			story: 'The film is playing. Every few seconds, Meera’s TV quietly fetches the next piece. Now and then, it saves her place.',
			hops: [
				{
					from: 'viewer-app',
					to: 'cdn',
					label: 'Fetch the next few seconds',
					example: {
						says: 'The TV fetches the next 4 seconds. It already has the next half minute ready, so Meera doesn’t notice this wait. The internet is fast tonight, so it picks the sharp version.',
						data: { piece: '4 seconds, at 43:30', version: '1080p' },
					},
				},
				{
					from: 'cdn',
					to: 'video-storage',
					label: 'Copy it from storage',
					example: {
						says: 'Only if the nearby server doesn’t have this piece. Almost always, it does.',
						data: { piece: '4 seconds, at 43:30' },
					},
					onMiss: true,
				},
				{
					from: 'viewer-app',
					to: 'load-balancer',
					label: 'Save her place',
					example: {
						says: 'Every 40 seconds or so, the app saves where Meera is. The film keeps playing, and nobody waits for this.',
						data: { title: 'The Long Monsoon', at: '43:05' },
					},
					mode: 'async',
					// one in ten fetches: a save every 40 seconds, against a piece every 4
					share: 0.1,
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it on to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 7 of 8' },
					},
					mode: 'async',
				},
				{
					from: 'api-gateway',
					to: 'history-service',
					label: 'Pass it on',
					example: {
						says: 'The gateway passes Meera’s place to the watch history service.',
						data: { viewer: 'Meera', at: '43:05' },
					},
					mode: 'async',
				},
				{
					from: 'history-service',
					to: 'history-db',
					label: 'Write it down',
					example: {
						says: 'Her place is written to her shard of the watch history database.',
						data: { viewer: 'Meera', title: 'The Long Monsoon', at: '43:05' },
					},
					mode: 'async',
					retries: 1,
				},
			],
		},
		{
			id: 'watch-live',
			name: 'Watch the match live',
			description:
				'A viewer watches a live match. The app keeps fetching the newest few seconds from the CDN, a little behind what’s happening at the ground.',
			rps: 50_000,
			person: 'Meera',
			scenario: 'final',
			story: 'It’s the World Cup final. Meera has been watching on her phone since the toss, along with millions of others. Her phone keeps fetching the newest few seconds.',
			hops: [
				{
					from: 'viewer-app',
					to: 'cdn',
					label: 'Fetch the newest few seconds',
					example: {
						says: 'Her phone asks for the newest piece of the match. Millions of phones ask for the very same piece at the same moment.',
						data: {
							match: 'India v Australia',
							piece: '2 seconds, 1:58:14 pm',
							version: '720p',
						},
					},
				},
				{
					from: 'cdn',
					to: 'video-storage',
					label: 'Copy the newest piece',
					example: {
						says: 'Each CDN server fetches each new piece once, then answers everyone near it from its copy.',
						data: { piece: '2 seconds, 1:58:14 pm' },
					},
					onMiss: true,
				},
			],
		},
		{
			id: 'live-feed',
			name: 'Send the live match',
			description:
				'The broadcaster sends the live picture from the ground. The live encoder makes it into pieces in every version, and saves them for the CDN. Making each piece takes a moment, so viewers see the match a few seconds late.',
			rps: 2,
			person: 'the broadcaster',
			scenario: 'live-down',
			story: 'At the ground, the broadcaster’s cameras film the final. Every couple of seconds, the newest stretch of the picture is sent to us.',
			hops: [
				{
					from: 'broadcaster',
					to: 'live-encoder',
					label: 'Send the newest moment',
					example: {
						says: 'The broadcaster sends the last 2 seconds of the match, straight from the ground.',
						data: { match: 'India v Australia', piece: '2 seconds, 1:58:14 pm' },
					},
				},
				{
					from: 'live-encoder',
					to: 'video-storage',
					label: 'Save every version',
					example: {
						says: 'The live encoder makes 8 versions of those 2 seconds, from small to sharp, and saves them. The CDN fetches them from here.',
						data: { versions: '8', piece: '2 seconds, 1:58:14 pm' },
					},
					calls: 8,
				},
			],
		},
		{
			id: 'add-film',
			name: 'Add a new film',
			description:
				'The content team uploads a new film. It’s saved, then turned into many versions in the background, ready for every kind of screen.',
			rps: 1,
			person: 'Kabir',
			scenario: 'encoders-down',
			story: 'Kabir, on the content team, uploads tomorrow’s new episode.',
			hops: [
				{
					from: 'studio-app',
					to: 'load-balancer',
					label: 'Upload the film',
					example: {
						says: 'Kabir’s tool sends the finished episode: one big, very sharp file.',
						data: { title: 'The Long Monsoon, episode 3', size: '120 GB' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 1 of 8' },
					},
				},
				{
					from: 'api-gateway',
					to: 'upload-service',
					label: 'Take in the upload',
					example: {
						says: 'The gateway checks Kabir is allowed to add films, and passes the upload on.',
						data: { by: 'Kabir', title: 'The Long Monsoon, episode 3' },
					},
				},
				{
					from: 'upload-service',
					to: 'video-storage',
					label: 'Save the original',
					example: {
						says: 'The original file is saved safely, before anything else happens to it.',
						data: { file: 'episode-3-original.mov', size: '120 GB' },
					},
				},
				{
					from: 'upload-service',
					to: 'encode-queue',
					label: 'Add the encoding jobs',
					example: {
						says: 'The episode becomes many jobs: 12 versions, each in hundreds of pieces. Kabir doesn’t wait for them.',
						data: { versions: '12', jobs: 'about 1,200' },
					},
					mode: 'async',
				},
				{
					from: 'encode-queue',
					to: 'encoders',
					label: 'Hand out the next job',
					example: {
						says: 'Each free copy of the encoder takes the next job from the front of the queue.',
						data: { job: 'version 1080p, piece 418' },
					},
					mode: 'async',
					calls: 40,
				},
				{
					from: 'encoders',
					to: 'video-storage',
					label: 'Save each version',
					example: {
						says: 'Each finished piece is saved next to the original.',
						data: { piece: 'version 1080p, piece 418', size: '3 MB' },
					},
					mode: 'async',
					calls: 40,
				},
				{
					from: 'encoders',
					to: 'catalog-service',
					label: 'Mark it ready to watch',
					example: {
						says: 'When every version is done, the episode is marked ready.',
						data: { title: 'The Long Monsoon, episode 3', status: 'ready' },
					},
					mode: 'async',
				},
				{
					from: 'catalog-service',
					to: 'catalog-db',
					label: 'Add it to the catalogue',
					example: {
						says: 'The episode is added to the catalogue, so it shows up on home screens.',
						data: { title: 'The Long Monsoon, episode 3', from: 'tomorrow, 12:00 am' },
					},
					mode: 'async',
				},
			],
		},
	],
	presets: [
		{
			id: 'normal',
			name: 'Normal evening',
			description: 'An ordinary evening across the country.',
			traffic: 1,
		},
		{
			id: 'sunday',
			name: 'Sunday night',
			description:
				'Busier all evening. The crowd builds slowly, so autoscaling has time to keep up.',
			traffic: 2,
		},
		{
			id: 'final',
			name: 'Cricket final',
			description:
				'India is in the World Cup final. In the last few minutes before the first ball, tens of millions open the app and press play at almost the same moment.',
			traffic: 1,
			journeyTraffic: { browse: 4, 'press-play': 25, 'watch-live': 40 },
			sudden: true,
		},
		{
			id: 'recs-down',
			name: 'Recommendations down',
			description: 'An ordinary evening, but the recommender has crashed.',
			traffic: 1,
			down: ['recommendation-service'],
		},
		{
			id: 'cdn-down',
			name: 'CDN down',
			description:
				'An ordinary evening, but the CDN’s video servers go down. Every piece of video has to come from the main video storage instead.',
			traffic: 1,
			down: ['cdn'],
		},
		{
			id: 'live-down',
			name: 'Live encoder down',
			description:
				'In the middle of a match, the live encoder and its spare both fail. No new pieces of the match are made.',
			traffic: 1,
			down: ['live-encoder'],
		},
		{
			id: 'encoders-down',
			name: 'Encoder down',
			description: 'The encoder crashes just as a new season is being uploaded.',
			traffic: 1,
			down: ['encoders'],
		},
	],
};
