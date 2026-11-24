import type { Journey } from '@/model/schema';
import type { JourneyState } from '@/sim/engine';
import { formatMs, formatRps, formatShare } from '@/sim/format';
import { useApp, useSystem } from '@/store';
import { journeyColor, statusColor } from '@/theme';
import { Badge, Meter, SectionTitle } from './controls';
import { cx } from './cx';

/** The requests people make, and the steps of the one being followed. */
export function JourneyPanel() {
	const system = useSystem();
	const journeys = useApp((s) => s.result.journeys);
	const journeyId = useApp((s) => s.journeyId);
	const selectJourney = useApp((s) => s.selectJourney);
	const followed = system.journeys.find((j) => j.id === journeyId);

	return (
		<section aria-labelledby="journeys-title" className="space-y-3">
			<div>
				<SectionTitle id="journeys-title">Journeys</SectionTitle>
				<p className="mt-1 text-xs text-slate-500">
					What people do in the app. Pick one to follow its requests.
				</p>
			</div>
			<ul className="space-y-1">
				<li>
					<button
						type="button"
						aria-pressed={journeyId === null}
						onClick={() => selectJourney(null)}
						className={cx(
							'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
							journeyId === null
								? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-300'
								: 'text-slate-600 hover:bg-slate-100',
						)}
					>
						All journeys at once
					</button>
				</li>
				{system.journeys.map((journey) => {
					const state = journeys[journey.id]!;
					const active = journeyId === journey.id;
					return (
						<li key={journey.id}>
							<button
								type="button"
								aria-pressed={active}
								onClick={() => selectJourney(active ? null : journey.id)}
								className={cx(
									'w-full rounded-lg px-3 py-2 text-left transition-colors',
									active
										? 'bg-cyan-100 ring-1 ring-cyan-300'
										: 'hover:bg-slate-100',
								)}
							>
								<span className="flex items-center gap-2">
									<span
										className="size-2 shrink-0 rounded-full"
										style={{ background: journeyColor(state) }}
									/>
									<span className="truncate text-sm font-medium text-slate-900">
										{journey.name}
									</span>
								</span>
								<span className="mt-0.5 flex gap-3 pl-4 text-xs text-slate-500 tabular-nums">
									<span>{formatRps(state.rps)}</span>
									<span>{formatShare(state.success)} succeed</span>
									<span>{formatMs(state.latencyMs)}</span>
								</span>
							</button>
						</li>
					);
				})}
			</ul>
			{followed && <JourneySteps journey={followed} state={journeys[followed.id]!} />}
		</section>
	);
}

function JourneySteps({ journey, state }: { journey: Journey; state: JourneyState }) {
	const system = useSystem();
	const select = useApp((s) => s.select);
	const name = (id: string) => system.components.find((c) => c.id === id)?.name ?? id;
	const slowest = Math.max(1, ...state.hops.map((h) => h.waitMs));

	return (
		<div className="rounded-xl border border-slate-200 bg-card p-3">
			<p className="text-xs text-slate-500">{journey.description}</p>
			<dl className="mt-3 grid grid-cols-3 gap-2 text-center">
				<Stat label="Succeed" value={formatShare(state.success)} />
				<Stat label="Wait" value={formatMs(state.latencyMs)} />
				<Stat
					label="Partly OK"
					value={state.degraded > 0.001 ? formatShare(state.degraded) : '–'}
				/>
			</dl>
			{state.backgroundFailure > 0.001 && (
				<p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
					{formatShare(state.backgroundFailure)} of the background work fails.
				</p>
			)}
			<h3 className="mt-4 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
				Steps, and where the time goes
			</h3>
			<ol className="mt-2 space-y-2.5">
				{journey.hops.map((hop, i) => {
					const hopState = state.hops[i]!;
					const failing = hopState.failRate > 0.01;
					return (
						<li key={`${hop.from}-${hop.to}-${i}`} className="text-xs">
							<div className="flex items-baseline gap-1.5">
								<span className="w-4 shrink-0 text-slate-400 tabular-nums">
									{i + 1}
								</span>
								<span className="min-w-0 flex-1 text-slate-800">{hop.label}</span>
								<span className="shrink-0 text-slate-500 tabular-nums">
									{hop.mode === 'async' ? 'later' : formatMs(hopState.waitMs)}
								</span>
							</div>
							<div className="mt-0.5 pl-5.5 text-slate-500">
								<button
									type="button"
									className="hover:text-cyan-700 hover:underline"
									onClick={() => select(hop.from)}
								>
									{name(hop.from)}
								</button>
								{' → '}
								<button
									type="button"
									className="hover:text-cyan-700 hover:underline"
									onClick={() => select(hop.to)}
								>
									{name(hop.to)}
								</button>
							</div>
							{hop.mode === 'sync' && (
								<div className="mt-1 pl-5.5">
									<Meter
										share={hopState.waitMs / slowest}
										color={failing ? statusColor.overloaded : '#fb923c'}
									/>
								</div>
							)}
							<div className="mt-1 flex flex-wrap gap-1 pl-5.5">
								{hop.mode === 'async' && <Badge color="#a78bfa">background</Badge>}
								{hop.optional && <Badge>optional</Badge>}
								{hop.onMiss && <Badge>only if not in the cache</Badge>}
								{hop.share < 1 && (
									<Badge>{formatShare(hop.share)} of requests</Badge>
								)}
								{hop.calls !== 1 && <Badge>{hop.calls} calls each</Badge>}
								{hop.retries > 0 && (
									<Badge>
										up to {hop.retries}{' '}
										{hop.retries === 1 ? 'retry' : 'retries'}
									</Badge>
								)}
								{hopState.breakerOpen && (
									<Badge color="#f59e0b">breaker tripped</Badge>
								)}
								{failing && (
									<Badge color={statusColor.overloaded}>
										{formatShare(hopState.failRate)} fail
									</Badge>
								)}
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-slate-50 px-1 py-1.5">
			<dt className="text-[10px] tracking-wide text-slate-500 uppercase">{label}</dt>
			<dd className="text-sm font-semibold text-slate-900 tabular-nums">{value}</dd>
		</div>
	);
}
