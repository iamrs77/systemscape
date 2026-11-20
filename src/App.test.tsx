import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { initialState, useApp } from './store';

// jsdom can't do WebGL: the panels are what's tested here, the scene in e2e
vi.mock('@/scene/Scene', () => ({ default: () => <div data-testid="scene" /> }));

function setup({ toured = true } = {}) {
	localStorage.clear();
	if (toured) localStorage.setItem('systemscape:toured', '1');
	useApp.setState(initialState());
	return { user: userEvent.setup(), ...render(<App />) };
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('the app', () => {
	it('shows the system, its journeys, and what’s happening', async () => {
		setup();
		expect(await screen.findByTestId('scene')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Ride-hailing app' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Request a ride/ })).toBeInTheDocument();
		expect(screen.getByText(/Everything is working/)).toBeInTheDocument();
	});

	it('follows a journey step by step', async () => {
		const { user } = setup();
		await user.click(screen.getByRole('button', { name: /End the trip and pay/ }));
		const steps = screen.getByRole('heading', { name: /Steps, and where the time goes/ })
			.nextElementSibling as HTMLElement;
		expect(within(steps).getByText('Charge the card')).toBeInTheDocument();
		expect(within(steps).getAllByText('background').length).toBeGreaterThan(0);
	});

	it('explains a part, and lets you take it down', async () => {
		const { user } = setup();
		await user.click(screen.getByRole('switch', { name: 'Circuit breakers' }));
		// find the inspector through a step in a followed journey
		await user.click(screen.getByRole('button', { name: /Request a ride/ }));
		await user.click(screen.getAllByRole('button', { name: 'ETA service' })[0]!);
		expect(screen.getByRole('heading', { name: 'ETA service' })).toBeInTheDocument();
		expect(screen.getByText(/falls back to straight-line distance/)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Take down' }));
		expect(useApp.getState().input.down.has('eta-service')).toBe(true);
		expect(screen.getByRole('button', { name: 'Bring back' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Add an instance' }));
		expect(useApp.getState().input.instances['eta-service']).toBe(7);

		await user.click(screen.getByRole('button', { name: 'Close details' }));
		expect(screen.queryByRole('heading', { name: 'ETA service' })).not.toBeInTheDocument();
	});

	it('runs a challenge from failing to solved', async () => {
		const { user } = setup();
		await user.click(screen.getByRole('button', { name: /Routing goes down/ }));
		const card = screen.getByRole('region', { name: 'Challenge: Routing goes down' });
		expect(within(card).getByText(/Not met:/)).toBeInTheDocument();
		// the scenario is locked
		expect(screen.getByRole('slider', { name: 'Traffic' })).toBeDisabled();

		await user.click(within(card).getByRole('button', { name: 'Show a hint' }));
		expect(within(card).getByText(/Can callers stop waiting for it/)).toBeInTheDocument();

		await user.click(screen.getByRole('switch', { name: 'Circuit breakers' }));
		expect(within(card).getByText('Solved')).toBeInTheDocument();
		expect(within(card).getByText(/graceful degradation/)).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Routing goes down, solved' }),
		).toBeInTheDocument();

		await user.click(within(card).getByRole('button', { name: /Next challenge/ }));
		expect(
			screen.getByRole('region', { name: 'Challenge: Caught in the rain' }),
		).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Leave' }));
		expect(screen.queryByRole('region', { name: /Challenge:/ })).not.toBeInTheDocument();
	});

	it('opens the design write-up with its sources, and closes it with Escape', async () => {
		const { user } = setup();
		await user.click(screen.getByRole('button', { name: 'About this design' }));
		const dialog = screen.getByRole('dialog', { name: 'Ride-hailing app' });
		expect(within(dialog).getByRole('link', { name: /H3: Uber’s Hexagonal/ })).toHaveAttribute(
			'href',
			'https://www.uber.com/blog/h3/',
		);
		expect(within(dialog).getByText(/not any company’s actual system/)).toBeInTheDocument();
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('shows the tour on a first visit, and not again once skipped', async () => {
		const { user, unmount } = setup({ toured: false });
		const tour = await screen.findByRole('dialog', { name: 'The system, in 3D' });
		await user.click(within(tour).getByRole('button', { name: 'Next' }));
		expect(screen.getByRole('dialog', { name: 'Follow a journey' })).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Skip the tour' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		unmount();

		act(() => useApp.setState(initialState()));
		render(<App />);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('lists the systems still to come', async () => {
		const { user } = setup();
		await user.click(screen.getByRole('button', { name: /Ride-hailing app/, expanded: false }));
		expect(screen.getByText('Coming soon')).toBeInTheDocument();
		expect(screen.getByText('UPI payments')).toBeInTheDocument();
	});
});
