import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { exploreHref, homeHref, lessonHref, practiceHref, systemHref } from './route';
import { initialState, useApp } from './store';

/** Opens the app at a page, with some progress already made. */
function setup({
	at = systemHref('ride-hailing'),
	solved = [] as string[],
	learned = [] as string[],
} = {}) {
	localStorage.clear();
	if (solved.length > 0) localStorage.setItem('systemscape:solved', JSON.stringify(solved));
	if (learned.length > 0) localStorage.setItem('systemscape:learned', JSON.stringify(learned));
	window.location.hash = at;
	useApp.setState(initialState());
	return { user: userEvent.setup(), ...render(<App />) };
}

beforeEach(() => {
	vi.restoreAllMocks();
});

type User = ReturnType<typeof userEvent.setup>;

/** The step being explained, beside the diagram. */
const step = () => screen.getByRole('complementary', { name: 'This step' });

describe('the home page', () => {
	it('says what Systemscape is, and lists the systems, with the ones still to come', () => {
		setup({ at: homeHref });
		expect(
			screen.getByRole('heading', { level: 1, name: 'Learn how big apps are built.' }),
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Ride-hailing app' })).toHaveAttribute(
			'href',
			'#/ride-hailing',
		);
		expect(screen.getByText('The big picture')).toBeInTheDocument();
		const coming = screen.getByRole('region', { name: 'Coming soon' });
		expect(within(coming).getByText('UPI payments')).toBeInTheDocument();
		expect(document.title).toBe('Systemscape: how big apps are built');
	});

	it('shows how far you’ve got with a system', () => {
		setup({
			at: homeHref,
			learned: ['ride-hailing/overview'],
			solved: ['ride-hailing/routing-down'],
		});
		expect(screen.getByText('1 of 6 lessons, 1 of 4 challenges done')).toBeInTheDocument();
		expect(screen.getByText('Carry on')).toBeInTheDocument();
	});

	it('opens a system at its first lesson', async () => {
		const { user } = setup({ at: homeHref });
		await user.click(screen.getByRole('link', { name: 'Ride-hailing app' }));
		expect(
			await screen.findByRole('heading', { level: 1, name: 'The big picture' }),
		).toBeInTheDocument();
		expect(within(step()).getByRole('heading', { name: 'What it does' })).toBeInTheDocument();
		expect(document.title).toBe('Ride-hailing app · Systemscape');
	});

	it('is a click away from any system', async () => {
		const { user } = setup();
		await user.click(screen.getByRole('link', { name: 'Systemscape: all systems' }));
		expect(
			await screen.findByRole('heading', { name: 'Learn how big apps are built.' }),
		).toBeInTheDocument();
	});

	it('opens for a link to a system that doesn’t exist', () => {
		setup({ at: '#/stock-trading' });
		expect(
			screen.getByRole('heading', { name: 'Learn how big apps are built.' }),
		).toBeInTheDocument();
	});
});

describe('a lesson', () => {
	it('goes a step at a time, with the buttons or the arrow keys', async () => {
		const { user } = setup();
		expect(screen.getByRole('button', { name: '← Back' })).toBeDisabled();
		await user.click(within(step()).getByRole('button', { name: /^Next/ }));
		expect(
			await within(step()).findByRole('heading', { name: 'How to read it' }),
		).toBeInTheDocument();
		expect(window.location.hash).toBe('#/ride-hailing/learn/overview/2');

		await user.keyboard('{ArrowRight}');
		expect(
			await within(step()).findByRole('heading', { name: 'The apps' }),
		).toBeInTheDocument();
		await user.keyboard('{ArrowLeft}');
		expect(
			await within(step()).findByRole('heading', { name: 'How to read it' }),
		).toBeInTheDocument();

		// how far through the lesson you are
		expect(within(step()).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
	});

	it('follows a request call by call, saying who waits and why each part is there', () => {
		setup({ at: lessonHref('ride-hailing', 'request-ride', 3) });
		const here = step();
		expect(within(here).getByRole('heading', { name: 'Find a driver' })).toBeInTheDocument();
		expect(within(here).getByText('Rohit waits for this')).toBeInTheDocument();
		expect(within(here).getByText('What’s sent')).toBeInTheDocument();
		expect(here).toHaveTextContent('API gateway calls Dispatch, and waits for the answer.');
		expect(within(here).getByText('Why Dispatch?')).toBeInTheDocument();
		expect(within(here).getByText('When it fails')).toBeInTheDocument();
		// the numbers over the diagram
		const facts = screen.getByText('Copies of Dispatch').closest('div')!;
		expect(facts).toHaveTextContent('3');
	});

	it('explains any part you click, then goes back to the step', async () => {
		const { user } = setup({ at: lessonHref('ride-hailing', 'request-ride', 3) });
		await user.click(screen.getByRole('button', { name: 'More about Dispatch →' }));
		expect(within(step()).getByRole('heading', { name: 'Dispatch' })).toBeInTheDocument();
		expect(within(step()).getByText('Why it’s here')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: '← Back to the step' }));
		expect(within(step()).getByRole('heading', { name: 'Find a driver' })).toBeInTheDocument();

		// the parts on the diagram are buttons too
		await user.click(screen.getByRole('button', { name: /^API gateway: Gateway/ }));
		expect(within(step()).getByRole('heading', { name: 'API gateway' })).toBeInTheDocument();
	});

	it('shows what breaks on a busy night, then offers the challenge for it', () => {
		setup({ at: lessonHref('ride-hailing', 'request-ride', 12) });
		expect(step()).toHaveTextContent(/only [\d.]+% of “Request a ride” requests succeed/);
		expect(within(step()).getByText('Something breaks')).toBeInTheDocument();
	});

	it('ticks a lesson off when you reach its end, and leads on to the next', () => {
		setup({ at: lessonHref('ride-hailing', 'overview', 9) });
		expect(useApp.getState().learned).toEqual(['ride-hailing/overview']);
		const course = screen.getByRole('navigation', { name: 'Course' });
		expect(
			within(course).getByRole('link', { name: /The big picture.*\(done\)/ }),
		).toBeInTheDocument();
		expect(
			within(step()).getByRole('link', { name: /Next lesson: Drivers share their location/ }),
		).toHaveAttribute('href', lessonHref('ride-hailing', 'share-location'));
	});

	it('ends a journey’s lesson with its challenge', () => {
		setup({ at: lessonHref('ride-hailing', 'request-ride', 13) });
		expect(within(step()).getByRole('link', { name: /Start the challenge/ })).toHaveAttribute(
			'href',
			practiceHref('ride-hailing', 'routing-down'),
		);
	});
});

/** Flips one of the switches under Resilience. */
async function flip(user: User, name: string) {
	await user.click(screen.getByRole('button', { name: /Resilience/ }));
	await user.click(screen.getByRole('switch', { name }));
	await user.keyboard('{Escape}');
}

describe('the sandbox', () => {
	it('shows what’s happening, and the journeys to follow', () => {
		setup({ at: exploreHref('ride-hailing') });
		expect(
			screen.getByRole('heading', { level: 1, name: 'Explore freely' }),
		).toBeInTheDocument();
		const status = screen.getByRole('region', { name: 'What’s happening' });
		expect(within(status).getByText(/Everything is working/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Request a ride/ })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
	});

	it('explains each resilience switch where you flip it', async () => {
		const { user } = setup({ at: exploreHref('ride-hailing') });
		await user.click(screen.getByRole('button', { name: /Resilience/ }));
		expect(screen.getByText(/stop calling something that keeps failing/)).toBeInTheDocument();
		await user.click(screen.getByRole('switch', { name: 'Retries' }));
		expect(useApp.getState().input.retries).toBe(false);
		expect(screen.getByRole('button', { name: /Resilience/ })).toHaveTextContent('1 on');
	});

	it('follows a journey step by step', async () => {
		const { user } = setup({ at: exploreHref('ride-hailing') });
		await user.click(screen.getByRole('button', { name: /End the trip and pay/ }));
		const steps = screen.getByRole('heading', { name: /Steps, and where the time goes/ })
			.nextElementSibling as HTMLElement;
		expect(within(steps).getByText('Charge the card')).toBeInTheDocument();
		expect(within(steps).getAllByText('background').length).toBeGreaterThan(0);
	});

	it('explains a part, and lets you take it down', async () => {
		const { user } = setup({ at: exploreHref('ride-hailing') });
		await flip(user, 'Circuit breakers');
		await user.click(screen.getAllByRole('button', { name: 'ETA service' })[0]!);
		expect(screen.getByRole('heading', { name: 'ETA service' })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: 'ETA service' })).toHaveTextContent(
			/falls back to straight-line distance/,
		);

		await user.click(screen.getByRole('button', { name: 'Take down' }));
		expect(useApp.getState().input.down.has('eta-service')).toBe(true);
		expect(screen.getByRole('button', { name: /^ETA service: down/ })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Add an instance' }));
		expect(useApp.getState().input.instances['eta-service']).toBe(7);

		await user.click(screen.getByRole('button', { name: 'Close details' }));
		expect(screen.queryByRole('heading', { name: 'ETA service' })).not.toBeInTheDocument();
	});

	it('opens the design write-up with its sources, and closes it with Escape', async () => {
		const { user } = setup({ at: exploreHref('ride-hailing') });
		await user.click(screen.getByRole('button', { name: 'About this design' }));
		const dialog = screen.getByRole('dialog', { name: 'Ride-hailing app' });
		expect(within(dialog).getByRole('link', { name: /H3: Uber’s Hexagonal/ })).toHaveAttribute(
			'href',
			'https://www.uber.com/blog/h3/',
		);
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('lists the systems, and the ones still to come, in the system picker', async () => {
		const { user } = setup({ at: exploreHref('ride-hailing') });
		await user.click(screen.getByRole('button', { name: /Ride-hailing app/, expanded: false }));
		expect(screen.getByRole('link', { name: /Matching riders/ })).toHaveAttribute(
			'aria-current',
			'page',
		);
		expect(screen.getByText('UPI payments')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'All systems' })).toHaveAttribute('href', '#/');
	});
});

describe('a challenge', () => {
	it('runs from failing to solved, and on to the next', async () => {
		const { user } = setup({ at: practiceHref('ride-hailing', 'routing-down') });
		const card = await screen.findByRole('region', { name: 'Challenge: Routing goes down' });
		expect(within(card).getByText(/Not met:/)).toBeInTheDocument();
		// the scenario is set by the challenge
		expect(screen.getByRole('slider', { name: 'Traffic' })).toBeDisabled();

		await user.click(within(card).getByRole('button', { name: 'Show a hint' }));
		expect(within(card).getByText(/Can callers stop waiting for it/)).toBeInTheDocument();

		await flip(user, 'Circuit breakers');
		expect(within(card).getByText('Solved')).toBeInTheDocument();
		expect(within(card).getByText(/graceful degradation/)).toBeInTheDocument();
		const course = screen.getByRole('navigation', { name: 'Course' });
		expect(
			within(course).getByRole('link', { name: /Routing goes down.*\(done\)/ }),
		).toBeInTheDocument();

		await user.click(within(card).getByRole('link', { name: /Next challenge/ }));
		expect(
			await screen.findByRole('region', { name: 'Challenge: Caught in the rain' }),
		).toBeInTheDocument();
		await user.click(screen.getByRole('link', { name: 'Leave' }));
		expect(
			await screen.findByRole('heading', { level: 1, name: 'Explore freely' }),
		).toBeInTheDocument();
		expect(useApp.getState().challengeId).toBeNull();
	});
});

describe('words, explained', () => {
	it('underlines a word the first time it appears, and says what it means when tapped', async () => {
		const { user } = setup({ at: lessonHref('ride-hailing', 'overview', 7) });
		expect(within(step()).getByRole('heading', { name: 'The data' })).toBeInTheDocument();
		// once only, however often the word comes up
		expect(within(step()).getAllByRole('button', { name: /^shards?$/ })).toHaveLength(1);

		const word = within(step()).getByRole('button', { name: 'shards' });
		await user.click(word);
		expect(word).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('dialog', { name: 'What “Shard” means' })).toHaveTextContent(
			/One slice of data/,
		);
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(word).toHaveFocus();

		// the words in a part's name are explained too
		await user.click(within(step()).getByRole('button', { name: 'index' }));
		expect(screen.getByRole('dialog', { name: 'What “Index” means' })).toHaveTextContent(
			/back of a book/,
		);
		// a click anywhere else closes it
		await user.click(within(step()).getByRole('heading', { name: 'The data' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('lists every word in the glossary', async () => {
		const { user } = setup({ at: lessonHref('ride-hailing', 'overview', 7) });
		await user.click(within(step()).getByRole('button', { name: 'cache' }));
		await user.click(screen.getByRole('button', { name: 'All the words →' }));
		const glossary = screen.getByRole('dialog', { name: 'Words, explained' });
		expect(within(glossary).getByText('Circuit breaker')).toBeInTheDocument();
		await user.keyboard('{Escape}');

		await user.click(screen.getByRole('button', { name: 'Glossary' }));
		expect(screen.getByRole('dialog', { name: 'Words, explained' })).toBeInTheDocument();
	});
});
