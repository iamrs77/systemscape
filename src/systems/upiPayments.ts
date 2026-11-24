import type { SystemInput } from '@/model/schema';

/**
 * A UPI payment app, simplified, seen from the app's side: its own backend,
 * and NPCI and the banks outside it. Based on NPCI's and RBI's published
 * rules and on reporting of real outages. Traffic numbers are illustrative,
 * for one big app on an ordinary day.
 */
export const upiPayments: SystemInput = {
	id: 'upi-payments',
	name: 'UPI payments',
	tagline:
		'Moving money between any two bank accounts in India in seconds, billions of times a month.',
	basis: 'inspired',
	description: [
		'Someone scans a QR code at a shop, types their PIN, and the money moves from their bank to the shop’s bank in a couple of seconds. The payment app never holds the money. It asks NPCI, which runs UPI for India’s banks, to ask one bank to take the money and the other to receive it.',
		'This is a simplified design of a payment app like PhonePe or Google Pay, based on NPCI’s and RBI’s published rules and on reporting about real outages. It isn’t any company’s actual system, and the traffic numbers are illustrative.',
	],
	sources: [
		{
			title: 'UPI Product Booklet',
			url: 'https://www.npci.org.in/PDF/npci/upi/Product-Booklet.pdf',
			publisher: 'NPCI',
		},
		{
			title: 'Harmonisation of Turn Around Time and customer compensation for failed transactions',
			url: 'https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=11693',
			publisher: 'Reserve Bank of India, 2019',
		},
		{
			title: 'UPI outage attributed to surge in API calls from banks, says NPCI',
			url: 'https://www.outlookmoney.com/banking/upi-outage-attributed-to-surge-in-api-calls-from-banks-says-npci',
			publisher: 'Outlook Money, 2025',
		},
		{
			title: 'UPI Outage: NPCI Directs Banks To Limit ‘Check Transaction’ API Usage',
			url: 'https://inc42.com/buzz/upi-outage-npci-directs-banks-to-limit-check-transaction-api-usage/',
			publisher: 'Inc42, 2025',
		},
		{
			title: 'NPCI tightens UPI API supervision to curb network stress',
			url: 'https://www.business-standard.com/finance/news/npci-tightens-upi-api-supervision-to-curb-network-stress-125052201406_1.html',
			publisher: 'Business Standard, 2025',
		},
		{
			title: 'UPI at scale: outages and the push for resilient systems',
			url: 'https://www.orfonline.org/expert-speak/upi-at-scale-outages-and-the-push-for-resilient-systems/',
			publisher: 'Observer Research Foundation, 2025',
		},
		{
			title: 'UPI apps to limit balance checks, autopay from Aug 1: How changes help you',
			url: 'https://www.business-standard.com/finance/personal-finance/upi-apps-to-limit-balance-checks-autopay-from-aug-1-how-changes-help-you-125072900572_1.html',
			publisher: 'Business Standard, 2025',
		},
		{
			title: 'UPI hits record 754 mn transactions in a single day',
			url: 'https://www.businesstoday.in/personal-finance/banking/story/upi-hits-record-754-mn-transactions-in-a-single-day-monthly-volume-surges-to-207-bn-in-october-500469-2025-11-01',
			publisher: 'Business Today, 2025',
		},
	],
	decisions: [
		{
			title: 'The app never holds the money',
			detail: 'The money stays in people’s bank accounts. The app asks NPCI, and NPCI asks the payer’s bank to take the money and the shop’s bank to receive it. The PIN is checked by the payer’s own bank, not by the app.',
		},
		{
			title: 'Every payment gets its own ID, saved before it’s sent',
			detail: 'If anything has to be tried again, the same ID goes with it. The banks see they’ve already moved money for that ID, so the money moves only once. This is called being idempotent.',
		},
		{
			title: 'No answer means “pending”, not “failed”',
			detail: 'If the answer doesn’t come back in time, the money may or may not have moved. So the app shows “pending” and asks NPCI later what happened, instead of paying again. After the outage below, NPCI said to wait before asking, at first 90 seconds and later 45 to 60, and to ask no more than 3 times.',
		},
		{
			title: 'Too many status checks once took UPI down',
			detail: 'On 12 April 2025, UPI payments failed across India for about five hours. NPCI said some banks had sent a sudden flood of “check transaction status” requests, which overloaded its switch. Checking too often is like a retry storm: it adds load just when the system is struggling.',
		},
		{
			title: 'Balance checks are limited',
			detail: 'Every balance check goes all the way to the bank. So from August 2025, NPCI limited each app to 50 balance checks a day for each person, and asked banks to send the new balance with every payment instead.',
		},
		{
			title: 'Money that leaves but doesn’t arrive must come back',
			detail: 'If money leaves the payer’s account but can’t be credited to the shop, it has to be returned. The RBI says it must be back by the day after the payment, or the bank pays the customer ₹100 for every day it’s late.',
		},
		{
			title: 'Instant for people, settled later between banks',
			detail: 'Ananya sees her ₹20 leave, and Raju sees it arrive, within seconds. Between the banks, nothing has moved yet. NPCI works out what each bank owes the others, and they settle up in batches through their accounts at the RBI, several times a day.',
		},
		{
			title: 'Apps reach UPI through partner banks',
			detail: 'Only banks can connect to NPCI’s switch. So apps like PhonePe and Google Pay, which aren’t banks, send every request through partner banks. Big apps use several, so one bank’s problem doesn’t stop every payment.',
		},
		{
			title: 'Subscriptions are paid in quiet hours',
			detail: 'A monthly AutoPay payment, like a ₹199 subscription, doesn’t need to happen at a particular minute. So since August 2025, NPCI runs them only outside the busiest hours, 10 am to 1 pm and 5 pm to 9:30 pm, leaving room for people paying in shops.',
		},
		{
			title: 'Festival days are planned for',
			detail: 'UPI handled a record 754 million payments on 18 October 2025, during Diwali week. A rush like that arrives in minutes when a sale opens, too fast for autoscaling, so apps and banks add capacity ahead of time.',
		},
	],
	rows: {
		clients:
			'Everything starts in the payment app on someone’s phone. It keeps very little itself, and never any money.',
		data: 'This is where things are stored. Here, it’s the record of every payment the app has started, split into shards. The money itself isn’t here. It stays in the banks.',
		external:
			'These belong to others: NPCI, which runs UPI for India’s banks, and the banks, which hold the money. They aren’t ours, so we can’t add copies or fix them. We can only cope when they are slow or down.',
	},
	components: [
		{
			id: 'payer-app',
			name: 'Payment app',
			kind: 'client',
			layer: 'clients',
			summary:
				'The app on Ananya’s phone. It scans QR codes, asks for her PIN, and shows whether a payment worked.',
			why: 'It’s how people pay.',
			onFailure:
				'This app stands for the people paying, so the simulation doesn’t make it fail.',
			scaling: 'It runs on each person’s own phone, so there’s nothing to grow.',
		},
		{
			id: 'load-balancer',
			name: 'Load balancer',
			kind: 'balancer',
			layer: 'balancing',
			summary: 'Shares out requests from the app between the copies of the API gateway.',
			why: 'The gateway runs as many copies. Something has to share the work out between them.',
			onFailure: 'Nothing reaches the app’s backend, so nobody can pay with this app.',
			scaling: 'A few copies handle a lot. It autoscales too, when the day gets busy.',
			capacityPerInstance: 50_000,
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
				'The front door for every request from the app. It checks the phone is really Ananya’s, and sends each request to the right service.',
			why: 'Payments need a careful front door: one place that checks who is asking, every time.',
			onFailure: 'Nobody can pay with this app. Other UPI apps still work.',
			scaling:
				'It keeps nothing between requests, so any copy can take any request. That makes autoscaling easy.',
			capacityPerInstance: 4_000,
			instances: 4,
			maxInstances: 40,
			latencyMs: 5,
		},
		{
			id: 'payment-service',
			name: 'Payment service',
			kind: 'service',
			layer: 'services',
			summary:
				'Runs every payment from start to end: gives it its own ID, saves it, sends it to NPCI, and records the answer.',
			why: 'Money needs one careful owner. Every payment’s story is kept in one place, so nothing is lost or done twice.',
			onFailure: 'Nobody can pay with this app until it’s back.',
			scaling:
				'It autoscales, but a new copy takes a few minutes to start. A sale that opens at midnight is faster than that.',
			capacityPerInstance: 2_500,
			instances: 6,
			maxInstances: 60,
			latencyMs: 15,
		},
		{
			id: 'fraud-check',
			name: 'Fraud check',
			kind: 'service',
			layer: 'services',
			summary:
				'Looks at each payment before it’s sent: a new shop, a big amount, an odd hour. Risky ones are stopped or need an extra check.',
			why: 'Once money moves, it’s hard to get back. Stopping a scam before it’s sent is far easier.',
			onFailure:
				'Payments can’t be checked, so they aren’t sent. It’s safer to stop than to let a scam through.',
			scaling: 'It autoscales. Each check takes a little time, so it needs many copies.',
			capacityPerInstance: 1_000,
			instances: 6,
			maxInstances: 60,
			latencyMs: 40,
		},
		{
			id: 'notification-service',
			name: 'Notification service',
			kind: 'notifier',
			layer: 'async',
			summary:
				'Tells both sides when a payment works: a message on Ananya’s phone, and “Received twenty rupees” from the speaker at the shop.',
			why: 'The shopkeeper needs to know at once, without looking at a phone.',
			onFailure:
				'Messages arrive late. Payments still work, but shopkeepers have to check their phones.',
			scaling: 'It autoscales. Messages wait in line until it catches up.',
			capacityPerInstance: 5_000,
			instances: 2,
			maxInstances: 20,
			latencyMs: 20,
		},
		{
			id: 'payments-db',
			name: 'Payments database',
			kind: 'database',
			layer: 'data',
			summary:
				'Every payment the app has started, with its ID and what stage it’s at: started, successful, failed or pending.',
			why: 'The ID is saved before the payment is sent. If anything goes wrong, the app can always find out what happened to it.',
			onFailure:
				'New payments can’t be saved, so they aren’t sent. Nothing is paid without a record.',
			scaling:
				'It’s split into shards. Adding a shard is planned ahead, not done automatically.',
			capacityPerInstance: 3_000,
			instances: 3,
			latencyMs: 6,
		},
		{
			id: 'partner-bank',
			name: 'Partner bank',
			kind: 'external',
			layer: 'external',
			summary:
				'The banks this app reaches UPI through. Apps like PhonePe and Google Pay aren’t banks, so partner banks pass their requests to NPCI.',
			why: 'Only banks can connect to NPCI’s switch. An app needs a bank to vouch for it.',
			onFailure:
				'This app can’t reach UPI at all, though other apps still can. That’s why big apps work with several partner banks.',
			scaling:
				'They belong to the banks, so we can’t make them bigger. Using several spreads the load.',
			capacityPerInstance: 50_000,
			instances: 3,
			latencyMs: 30,
		},
		{
			id: 'npci',
			name: 'NPCI UPI switch',
			kind: 'external',
			layer: 'external',
			summary:
				'The system in the middle of every UPI payment in India. It passes each payment from one bank to the other, and keeps a record of all of them.',
			why: 'Hundreds of banks and apps would otherwise each need to connect to all the others. With a switch, each connects once.',
			onFailure: 'No UPI payment can go anywhere, in any app, until it’s back.',
			scaling:
				'NPCI runs it, not us. It’s built for huge festival days, but it can still be flooded.',
			capacityPerInstance: 60_000,
			instances: 1,
			latencyMs: 60,
		},
		{
			id: 'payer-bank',
			name: 'Ananya’s bank',
			kind: 'external',
			layer: 'external',
			summary:
				'Holds Ananya’s money. It checks her PIN and her balance, and takes the money out of her account.',
			why: 'Only her bank can move her money, and only her bank knows her PIN.',
			onFailure:
				'Ananya can’t pay or check her balance, and money owed back to her has to wait. People with other banks aren’t affected.',
			scaling: 'It belongs to the bank, so we can’t make it bigger.',
			capacityPerInstance: 40_000,
			instances: 1,
			latencyMs: 250,
		},
		{
			id: 'payee-bank',
			name: 'Shop’s bank',
			kind: 'external',
			layer: 'external',
			summary:
				'Holds Raju’s shop account. It puts the money in, and tells NPCI whose account a UPI ID belongs to.',
			why: 'The money has to land in a real account, and only that bank can add it.',
			onFailure:
				'Nobody can pay this shop. If money has already left the payer’s account, it has to be sent back.',
			scaling: 'It belongs to the bank, so we can’t make it bigger.',
			capacityPerInstance: 50_000,
			instances: 1,
			latencyMs: 200,
		},
	],
	journeys: [
		{
			id: 'pay',
			name: 'Pay at a shop',
			description:
				'Someone scans the shop’s QR code, types their PIN, and the money moves from their bank to the shop’s bank.',
			rps: 4_000,
			person: 'Ananya',
			scenario: 'diwali',
			story: 'It’s 7:40 in the morning in Jaipur. Ananya buys a tea at Raju’s stall and scans his QR code to pay ₹20.',
			hops: [
				{
					from: 'payer-app',
					to: 'load-balancer',
					label: 'Pay ₹20',
					example: {
						says: 'Ananya’s app sends the payment, with her PIN locked so only her bank can read it.',
						data: { from: 'ananya@okhdfc', to: 'raju.tea@okaxis', amount: '₹20' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 3 of 4' },
					},
				},
				{
					from: 'api-gateway',
					to: 'payment-service',
					label: 'Start the payment',
					example: {
						says: 'The payment service gives this payment its own ID. Everything that happens to it from now on carries this ID.',
						data: { payment: 'P-73120945', amount: '₹20' },
					},
				},
				{
					from: 'payment-service',
					to: 'fraud-check',
					label: 'Check it looks safe',
					example: {
						says: 'A small amount, to a shop Ananya pays most mornings. Nothing odd here.',
						data: { payment: 'P-73120945', answer: 'safe' },
					},
				},
				{
					from: 'payment-service',
					to: 'payments-db',
					label: 'Save it before sending',
					example: {
						says: 'The payment is saved as “started”, with its ID, before any money moves. Then, whatever happens next, the app can find it.',
						data: { payment: 'P-73120945', status: 'started' },
					},
					retries: 2,
				},
				{
					from: 'payment-service',
					to: 'partner-bank',
					label: 'Pass it to a partner bank',
					example: {
						says: 'The app isn’t a bank, so it reaches UPI through one of its partner banks.',
						data: { via: 'partner bank 2 of 3' },
					},
				},
				{
					from: 'partner-bank',
					to: 'npci',
					label: 'Send it to NPCI',
					example: {
						says: 'The payment goes to NPCI’s switch, which finds the two banks from the UPI IDs.',
						data: { payment: 'P-73120945', from: 'HDFC Bank', to: 'Axis Bank' },
					},
				},
				{
					from: 'npci',
					to: 'payer-bank',
					label: 'Take ₹20 from Ananya',
					example: {
						says: 'Ananya’s bank checks her PIN and her balance, then takes the ₹20 out.',
						data: { account: '•••• 4417', amount: '₹20', answer: 'done' },
					},
				},
				{
					from: 'npci',
					to: 'payee-bank',
					label: 'Give ₹20 to the shop',
					example: {
						says: 'Raju’s bank puts the ₹20 into his account.',
						data: { account: 'Raju Tea Stall', amount: '₹20', answer: 'done' },
					},
				},
				{
					from: 'payment-service',
					to: 'notification-service',
					label: 'Tell both sides',
					example: {
						says: 'Ananya sees a tick on her phone, and the speaker at the stall says “Received twenty rupees”.',
						data: { payment: 'P-73120945', status: 'successful' },
					},
					mode: 'async',
				},
			],
		},
		{
			id: 'check-name',
			name: 'Check who you’re paying',
			description:
				'Before paying, the app shows the name on the account behind a UPI ID or QR code, so people can spot a fake.',
			rps: 4_000,
			person: 'Ananya',
			scenario: 'shop-bank-down',
			story: 'Ananya scans Raju’s QR code. Before she types her PIN, she wants to see it really is his shop.',
			hops: [
				{
					from: 'payer-app',
					to: 'load-balancer',
					label: 'Look up a UPI ID',
					example: {
						says: 'The app asks whose account this UPI ID belongs to.',
						data: { 'UPI ID': 'raju.tea@okaxis' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 1 of 4' },
					},
				},
				{
					from: 'api-gateway',
					to: 'payment-service',
					label: 'Ask whose ID it is',
					example: {
						says: 'The payment service passes the question on to NPCI.',
						data: { 'UPI ID': 'raju.tea@okaxis' },
					},
				},
				{
					from: 'payment-service',
					to: 'partner-bank',
					label: 'Pass it to a partner bank',
					example: {
						says: 'The app isn’t a bank, so it reaches UPI through one of its partner banks.',
						data: { via: 'partner bank 2 of 3' },
					},
				},
				{
					from: 'partner-bank',
					to: 'npci',
					label: 'Find the shop’s bank',
					example: {
						says: 'NPCI knows which bank “okaxis” IDs belong to.',
						data: { 'UPI ID': 'raju.tea@okaxis', bank: 'Axis Bank' },
					},
				},
				{
					from: 'npci',
					to: 'payee-bank',
					label: 'Read the account’s name',
					example: {
						says: 'The shop’s bank sends back the name on the account, and Ananya sees it before she pays.',
						data: { answer: 'RAJU TEA STALL' },
					},
				},
			],
		},
		{
			id: 'check-balance',
			name: 'Check your balance',
			description:
				'Someone asks how much money is in their account. The question goes all the way to their bank.',
			rps: 1_500,
			person: 'Ananya',
			scenario: 'month-start',
			story: 'It’s the first of the month. Ananya checks whether her salary has arrived.',
			hops: [
				{
					from: 'payer-app',
					to: 'load-balancer',
					label: 'Ask for the balance',
					example: {
						says: 'Ananya types her PIN to see her balance. Only her bank can read it.',
						data: { account: 'HDFC •••• 4417' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 2 of 4' },
					},
				},
				{
					from: 'api-gateway',
					to: 'payment-service',
					label: 'Pass it on',
					example: {
						says: 'The payment service counts it: NPCI allows 50 balance checks a day for each person.',
						data: { 'checks today': '3 of 50' },
					},
				},
				{
					from: 'payment-service',
					to: 'partner-bank',
					label: 'Pass it to a partner bank',
					example: {
						says: 'The app isn’t a bank, so it reaches UPI through one of its partner banks.',
						data: { via: 'partner bank 2 of 3' },
					},
				},
				{
					from: 'partner-bank',
					to: 'npci',
					label: 'Send it to NPCI',
					example: {
						says: 'NPCI passes the question to Ananya’s bank.',
						data: { bank: 'HDFC Bank' },
					},
				},
				{
					from: 'npci',
					to: 'payer-bank',
					label: 'Read the balance',
					example: {
						says: 'Her bank checks her PIN and reads her balance.',
						data: { answer: '₹48,210' },
					},
				},
			],
		},
		{
			id: 'check-status',
			name: 'Check a stuck payment',
			description:
				'A payment got no answer in time, so it shows “pending”. Later, the app asks NPCI what really happened, instead of paying again.',
			rps: 400,
			person: 'Ananya',
			scenario: 'status-storm',
			story: 'Ananya paid ₹450 for groceries, but the app said “pending”. The shopkeeper waits while the app finds out.',
			hops: [
				{
					from: 'payer-app',
					to: 'load-balancer',
					label: 'Ask about a pending payment',
					example: {
						says: 'The app waits about a minute, then asks once what happened. NPCI allows up to 3 asks.',
						data: { payment: 'P-73120988', status: 'pending', asked: '1 of 3' },
					},
				},
				{
					from: 'load-balancer',
					to: 'api-gateway',
					label: 'Pick the least busy copy',
					example: {
						says: 'The load balancer passes it to the least busy copy of the API gateway.',
						data: { to: 'API gateway, copy 4 of 4' },
					},
				},
				{
					from: 'api-gateway',
					to: 'payment-service',
					label: 'Look for the answer',
					example: {
						says: 'The payment service hasn’t heard back either, so it asks NPCI.',
						data: { payment: 'P-73120988' },
					},
				},
				{
					from: 'payment-service',
					to: 'partner-bank',
					label: 'Pass it to a partner bank',
					example: {
						says: 'The app isn’t a bank, so it reaches UPI through one of its partner banks.',
						data: { via: 'partner bank 2 of 3' },
					},
				},
				{
					from: 'partner-bank',
					to: 'npci',
					label: 'Ask NPCI what happened',
					example: {
						says: 'NPCI sees every UPI payment, so it knows: the money left Ananya’s bank and reached the shop.',
						data: { payment: 'P-73120988', answer: 'successful' },
					},
				},
				{
					from: 'payment-service',
					to: 'payments-db',
					label: 'Save the answer',
					example: {
						says: 'When the answer is new, the payment is marked “successful”, so nobody asks again.',
						data: { payment: 'P-73120988', status: 'successful' },
					},
					mode: 'async',
					// only when the answer has changed: most checks find nothing new
					share: 0.02,
				},
			],
		},
		{
			id: 'refund',
			name: 'Get money back',
			description:
				'Money left the payer’s account but couldn’t reach the shop. The shop’s bank reports it, and the money is sent back.',
			rps: 10,
			person: 'the shop’s bank',
			scenario: 'bank-down',
			story: 'Ananya’s ₹450 left her account, but the shop’s bank couldn’t add it to the shop’s account. It has to go back.',
			hops: [
				{
					from: 'payee-bank',
					to: 'npci',
					label: 'Report it couldn’t credit',
					example: {
						says: 'The shop’s bank tells NPCI it couldn’t add the money.',
						data: { payment: 'P-73120988', reason: 'account frozen' },
					},
				},
				{
					from: 'npci',
					to: 'payer-bank',
					label: 'Give the money back',
					example: {
						says: 'NPCI tells Ananya’s bank to put the ₹450 back. The RBI says it must be back by the day after the payment.',
						data: { account: '•••• 4417', amount: '₹450', answer: 'returned' },
					},
				},
				{
					from: 'npci',
					to: 'partner-bank',
					label: 'Tell the app',
					example: {
						says: 'NPCI tells the app the payment failed and the money went back.',
						data: { payment: 'P-73120988', status: 'returned' },
					},
					mode: 'async',
				},
				{
					from: 'partner-bank',
					to: 'payment-service',
					label: 'Pass it on',
					example: {
						says: 'The partner bank passes NPCI’s news to the app.',
						data: { payment: 'P-73120988', status: 'returned' },
					},
					mode: 'async',
				},
				{
					from: 'payment-service',
					to: 'payments-db',
					label: 'Mark it returned',
					example: {
						says: 'The payment is marked “returned”, so its story is complete.',
						data: { payment: 'P-73120988', status: 'returned' },
					},
					mode: 'async',
				},
				{
					from: 'payment-service',
					to: 'notification-service',
					label: 'Tell Ananya',
					example: {
						says: 'Ananya gets a message that her ₹450 is back in her account.',
						data: { to: 'Ananya', message: '“₹450 returned to your account”' },
					},
					mode: 'async',
				},
			],
		},
		{
			id: 'autopay',
			name: 'Pay a subscription',
			description:
				'Once a month, a subscription set up with UPI AutoPay is paid without anyone doing anything. NPCI asks the bank for the money, and the app tells its owner it’s done.',
			rps: 200,
			person: 'NPCI',
			scenario: 'autopay-peak',
			story: 'On the 5th of every month, Ananya’s ₹199 music subscription is paid by UPI AutoPay. She set it up once, with her PIN.',
			hops: [
				{
					from: 'npci',
					to: 'payer-bank',
					label: 'Take ₹199 for the subscription',
					example: {
						says: 'NPCI asks Ananya’s bank for this month’s ₹199. No PIN this time: she agreed to it when she set it up.',
						data: {
							subscription: 'music, ₹199 a month',
							account: '•••• 4417',
							answer: 'done',
						},
					},
				},
				{
					from: 'npci',
					to: 'partner-bank',
					label: 'Tell the app',
					example: {
						says: 'NPCI tells the app the subscription was paid.',
						data: { subscription: 'music, ₹199 a month', status: 'paid' },
					},
					mode: 'async',
				},
				{
					from: 'partner-bank',
					to: 'payment-service',
					label: 'Pass it on',
					example: {
						says: 'The partner bank passes the news to the app, which records it.',
						data: { status: 'paid' },
					},
					mode: 'async',
				},
				{
					from: 'payment-service',
					to: 'notification-service',
					label: 'Tell Ananya',
					example: {
						says: 'Ananya gets a message: ₹199 paid for her music subscription.',
						data: { to: 'Ananya', message: '“₹199 paid by AutoPay”' },
					},
					mode: 'async',
				},
			],
		},
	],
	presets: [
		{
			id: 'normal',
			name: 'Normal day',
			description: 'An ordinary day across India.',
			traffic: 1,
		},
		{
			id: 'month-start',
			name: 'First of the month',
			description:
				'Salaries arrive and bills are paid. Three times as many people check their balance, and it builds up slowly through the morning.',
			traffic: 1.5,
			journeyTraffic: { 'check-balance': 3 },
		},
		{
			id: 'diwali',
			name: 'Diwali sale',
			description:
				'A big festive sale opens at midnight. Within minutes, five times as many people pay.',
			traffic: 1,
			journeyTraffic: { pay: 5, 'check-name': 5, 'check-balance': 3 },
			sudden: true,
		},
		{
			id: 'status-storm',
			name: 'Status-check storm',
			description:
				'An app update has a bug: it asks about every pending payment every second, instead of waiting about a minute. NPCI’s switch is flooded, and payments fail in every app. Something like this took UPI down in April 2025. The real fix is in the app: wait longer, and ask fewer times.',
			traffic: 1,
			journeyTraffic: { 'check-status': 200 },
		},
		{
			id: 'autopay-peak',
			name: 'AutoPay at peak time',
			description:
				'How it was before NPCI’s 2025 rule: the morning’s monthly AutoPay payments all run in the busiest hours, on top of everyone paying in shops. Now they run in quieter hours.',
			traffic: 1,
			journeyTraffic: { autopay: 200 },
		},
		{
			id: 'bank-down',
			name: 'Ananya’s bank down',
			description: 'An ordinary day, but Ananya’s bank has an outage.',
			traffic: 1,
			down: ['payer-bank'],
		},
		{
			id: 'shop-bank-down',
			name: 'Shop’s bank down',
			description: 'An ordinary day, but the shop’s bank has an outage.',
			traffic: 1,
			down: ['payee-bank'],
		},
	],
};
