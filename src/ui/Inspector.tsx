import type { ReactNode } from 'react';
import { formatMs, formatRps, formatShare, formatUtilization } from '@/sim/format';
import { MAX_INSTANCES, useApp, useChallenge, useSystem } from '@/store';
import { kindLabel, statusColor, statusLabel } from '@/theme';
import { Badge, Button, Meter } from './controls';
import { CrossIcon, MinusIcon, PlusIcon, PowerIcon } from './icons';

/** Everything about one component: what it does, how it's doing, and what you can change. */
export function Inspector({ componentId }: { componentId: string }) {
	const system = useSystem();
	const challenge = useChallenge();
	const state = useApp((s) => s.result.components[componentId]);
	const input = useApp((s) => s.input);
	const select = useApp((s) => s.select);
	const selectJourney = useApp((s) => s.selectJourney);
	const setDown = useApp((s) => s.setDown);
	const setInstances = useApp((s) => s.setInstances);
	const component = system.components.find((c) => c.id === componentId);
	if (!component || !state) return null;

	const isClient = component.kind === 'client';
	// an outside provider runs its own servers
	const scalable = component.kind !== 'external';
	const down = state.status === 'down';
	const color = statusColor[state.status];
	const instances = input.instances[component.id] ?? component.instances;
	const stuckDown = down && challenge?.down.includes(component.id);
	const usedBy = system.journeys.filter((j) =>
		j.hops.some((h) => h.from === component.id || h.to === component.id),
	);

	return (
		<section aria-labelledby="inspector-title" className="space-y-5">
			<div>
				<div className="flex items-center gap-2">
					<Badge>{kindLabel[component.kind]}</Badge>
					{!isClient && <Badge color={color}>{statusLabel[state.status]}</Badge>}
					{state.breakerOpen && <Badge color="#f59e0b">breaker open</Badge>}
					<Button
						size="sm"
						variant="ghost"
						className="ml-auto"
						aria-label="Close details"
						onClick={() => select(null)}
					>
						<CrossIcon width={14} height={14} />
					</Button>
				</div>
				<h2 id="inspector-title" className="mt-2 text-lg font-semibold text-white">
					{component.name}
				</h2>
				<p className="mt-1 text-sm text-slate-300">{component.summary}</p>
			</div>

			{!isClient && (
				<div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
					<div>
						<div className="flex justify-between text-xs">
							<span className="text-slate-400">How busy</span>
							<span className="font-semibold text-white tabular-nums">
								{down ? 'Down' : formatUtilization(state.utilization)}
							</span>
						</div>
						<div className="mt-1.5">
							<Meter share={down ? 0 : state.utilization} color={color} />
						</div>
					</div>
					<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs tabular-nums">
						<Row label="Getting">{formatRps(state.load)}</Row>
						<Row label="Can handle">{formatRps(state.capacity)}</Row>
						<Row label="Response time">{down ? '–' : formatMs(state.latencyMs)}</Row>
						<Row label="Failing">{formatShare(state.failRate)}</Row>
						{state.load > state.demand * 1.01 && (
							<Row label="Of which retries">
								{formatRps(state.load - state.demand)}
							</Row>
						)}
						{component.hitRate !== undefined && (
							<Row label="Answers from memory">
								{formatShare(down ? 0 : component.hitRate)}
							</Row>
						)}
					</dl>

					<div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
						{scalable && <span className="text-xs text-slate-400">Instances</span>}
						{scalable && (
							<div className="flex items-center rounded-lg border border-white/10">
								<button
									type="button"
									aria-label="Remove an instance"
									disabled={instances <= 1}
									onClick={() => setInstances(component.id, instances - 1)}
									className="grid size-7 place-items-center text-slate-300 hover:text-white disabled:opacity-30"
								>
									<MinusIcon width={13} height={13} />
								</button>
								<output
									aria-label="Instances set by you"
									className="w-8 text-center text-sm font-semibold text-white tabular-nums"
								>
									{instances}
								</output>
								<button
									type="button"
									aria-label="Add an instance"
									disabled={instances >= MAX_INSTANCES}
									onClick={() => setInstances(component.id, instances + 1)}
									className="grid size-7 place-items-center text-slate-300 hover:text-white disabled:opacity-30"
								>
									<PlusIcon width={13} height={13} />
								</button>
							</div>
						)}
						{state.autoscaled && (
							<span className="text-xs text-cyan-300">
								autoscaled to {state.instances}
							</span>
						)}
						<Button
							size="sm"
							variant={down ? 'plain' : 'danger'}
							className="ml-auto"
							disabled={stuckDown}
							title={
								stuckDown
									? 'Part of the challenge: it can’t be fixed in time'
									: undefined
							}
							onClick={() => setDown(component.id, !down)}
						>
							<PowerIcon width={13} height={13} />
							{down ? 'Bring back' : 'Take down'}
						</Button>
					</div>
					<p className="text-[11px] text-slate-500">
						{!scalable
							? 'Not ours to scale: another company runs it, with its own limits.'
							: component.maxInstances === undefined
								? 'Doesn’t autoscale: instances only change when you change them.'
								: `Autoscales up to ${component.maxInstances} instances.`}
					</p>
				</div>
			)}

			<dl className="space-y-3 text-sm">
				<Explain label="Why it’s here">{component.why}</Explain>
				{!isClient && <Explain label="When it fails">{component.onFailure}</Explain>}
				<Explain label="How it scales">{component.scaling}</Explain>
			</dl>

			{usedBy.length > 0 && (
				<div>
					<h3 className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
						Part of
					</h3>
					<ul className="mt-1.5 flex flex-wrap gap-1.5">
						{usedBy.map((j) => (
							<li key={j.id}>
								<button
									type="button"
									onClick={() => selectJourney(j.id)}
									className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300 hover:bg-white/[0.12] hover:text-white"
								>
									{j.name}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</section>
	);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div>
			<dt className="text-slate-500">{label}</dt>
			<dd className="font-medium text-slate-100">{children}</dd>
		</div>
	);
}

function Explain({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div>
			<dt className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
				{label}
			</dt>
			<dd className="mt-0.5 text-slate-300">{children}</dd>
		</div>
	);
}
