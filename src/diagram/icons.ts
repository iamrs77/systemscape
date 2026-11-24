import type { IconName } from './geometry';

/** Line icons on a 24px grid, drawn on top of each block so you can tell the kinds apart. */
export const iconPaths: Record<IconName, string> = {
	// a rack of two servers
	server: 'M4 4.5h16v6.5H4z M4 13h16v6.5H4z M7.5 7.75h.01 M7.5 16.25h.01 M11 7.75h5 M11 16.25h5',
	// traffic coming in and going out
	gateway: 'M3 9h15 M14 5l4 4-4 4 M21 15H6 M10 11l-4 4 4 4',
	// a gear: work done in the background
	worker: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.3 5.3l2.1 2.1 M16.6 16.6l2.1 2.1 M5.3 18.7l2.1-2.1 M16.6 7.4l2.1-2.1',
	database:
		'M4.5 6c0-1.66 3.36-3 7.5-3s7.5 1.34 7.5 3-3.36 3-7.5 3-7.5-1.34-7.5-3z M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6 M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3',
	// a lightning bolt: fast answers
	cache: 'M13.5 2.5 5 13.5h6.5l-1 8 8.5-11h-6.5z',
	// messages waiting in line
	queue: 'M4 6h16 M4 12h16 M4 18h10',
	// events flowing on
	stream: 'M3 7h15 M14.5 3.5 18 7l-3.5 3.5 M3 17h15 M14.5 13.5 18 17l-3.5 3.5',
	storage: 'M3 7.5 12 3l9 4.5-9 4.5z M3 7.5v9l9 4.5 9-4.5v-9 M12 12v9',
	// a bell: a message for someone's phone
	bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z M10 21a2 2 0 0 0 4 0',
	// a bank: someone else's system
	external: 'M3 9.5 12 4l9 5.5 M5.5 10v7.5 M10 10v7.5 M14 10v7.5 M18.5 10v7.5 M3 20.5h18',
	// one stream of requests, spread three ways
	balancer:
		'M3 12h5 M8 12c3.5 0 3.5-6 7.5-6H20 M8 12h12 M8 12c3.5 0 3.5 6 7.5 6H20 M17.5 3.5 20 6l-2.5 2.5 M17.5 9.5 20 12l-2.5 2.5 M17.5 15.5 20 18l-2.5 2.5',
	// a phone: the app on someone's phone
	phone: 'M8 2.5h8A1.5 1.5 0 0 1 17.5 4v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5z M10.5 18.5h3',
	cdn: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z M3 12h18 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9 M12 3C9.5 5.5 8.5 8.5 8.5 12s1 6.5 3.5 9',
};
