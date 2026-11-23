import { formatMs, formatRps, formatShare } from '@/sim/format';
import { useApp, useChallenge, useSystem } from '@/store';
import { DiagramFrame, Facts } from './bits';
import { ChallengeCard } from './Challenges';
import { ControlBar } from './ControlBar';
import { Inspector } from './Inspector';
import { JourneyPanel } from './JourneyPanel';
import { LiveDiagram } from './LiveDiagram';
import { StatusBanner } from './StatusBanner';

/** Exploring freely, or a challenge: the live diagram, the controls, and the details beside them. */
export function SandboxView() {
	const system = useSystem();
	const challenge = useChallenge();
	const selected = useApp((s) => s.selected);
	const journeyId = useApp((s) => s.journeyId);
	const result = useApp((s) => s.result);
	const followed = system.journeys.find((j) => j.id === journeyId);
	const state = followed ? result.journeys[followed.id] : undefined;

	return (
		<>
			<main className="flex min-h-0 flex-col gap-3" aria-labelledby="sandbox-title">
				<header className="px-1">
					<p className="text-xs text-slate-500">{challenge ? 'Challenge' : 'Sandbox'}</p>
					<h1
						id="sandbox-title"
						className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl"
					>
						{challenge ? challenge.title : 'Explore freely'}
					</h1>
					<p className="mt-1 text-sm text-slate-600">
						{challenge
							? 'Something has gone wrong. Change things until the goal is met: it’s checked as you go.'
							: 'Push the traffic, take parts down, add copies, and switch the safety features on and off. Click any part to change it.'}
					</p>
				</header>
				<StatusBanner />
				<DiagramFrame
					over={
						state && (
							<Facts
								facts={[
									{ label: followed!.name, value: formatRps(state.rps) },
									{ label: 'Succeed', value: formatShare(state.success) },
									{ label: 'Wait', value: formatMs(state.latencyMs) },
								]}
							/>
						)
					}
				>
					<LiveDiagram />
				</DiagramFrame>
				<ControlBar />
			</main>

			<aside className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto" aria-label="Details">
				{challenge && <ChallengeCard />}
				<div className="surface p-4">
					{selected ? <Inspector componentId={selected} /> : <JourneyPanel />}
				</div>
			</aside>
		</>
	);
}
