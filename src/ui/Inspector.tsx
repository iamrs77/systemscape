import type { ReactNode } from 'react';
import { balancingName, balancingRule, balancings, type Balancing } from '@/sim/engine';
import { formatMs, formatRps, formatShare, formatUtilization } from '@/sim/format';
import { MAX_INSTANCES, useApp, useSystem } from '@/store';
import { kindLabel, statusColor, statusLabel } from '@/theme';
import { annotate, namesOf } from '@/learn/glossary';
import { Badge, Button, Meter, Toggle } from './controls';
import { Explained } from './Explained';
import { CrossIcon, MinusIcon, PlusIcon, PowerIcon } from './icons';

/** Everything about one component: what it does, how it's doing, and what you can change. */
export function Inspector({ componentId }: { componentId: string }) {
	const system = useSystem();
	const state = useApp((s) => s.result.components[componentId]);
	const journeys = useApp((s) => s.result.journeys);
	const input = useApp((s) => s.input);
	const select = useApp((s) => s.select);
	const selectJourney = useApp((s) => s.selectJourney);
	const setDown = useApp((s) => s.setDown);
	const setInstances = useApp((s) => s.setInstances);
	const setBalancing = useApp((s) => s.setBalancing);
	const setHealthChecks = useApp((s) => s.setHealthChecks);
	const setSlow = useApp((s) => s.setSlow);
	const setHitRate = useApp((s) => s.setHitRate);
	const setShed = useApp((s) => s.setShed);
	const setCut = useApp((s) => s.setCut);
	const component = system.components.find((c) => c.id === componentId);
	if (!component || !state) return null;
	// a load balancer choosing between copies: how it chooses can be changed
	const picks = system.journeys.some((j) =>
		j.hops.some((h) => h.pick && h.from === component.id),
	);
	const rule = input.balancing?.[component.id] ?? 'round-robin';
	const slowed = (input.slow?.[component.id] ?? 1) > 1;
	const shedding = input.shed?.includes(component.id) ?? false;
	// network links to this part that are broken
	const cutTo = (input.cut ?? [])
		.filter(([a, b]) => a === component.id || b === component.id)
		.map(([a, b]) => (a === component.id ? b : a));
	const hitRate = input.hitRate?.[component.id] ?? component.hitRate ?? 0;

	const isClient = component.kind === 'client';
	// an outside provider runs its own servers
	const scalable = component.kind !== 'external';
	const down = state.status === 'down';
	const color = statusColor[state.status];
	const instances = input.instances[component.id] ?? component.instances;
	const [summary, why, onFailure, scaling] = annotate(
		[component.summary, component.why, component.onFailure, component.scaling],
		namesOf(system),
	);
	// the journeys running now that pass through it: not the designs kept switched off for the lessons
	const usedBy = system.journeys.filter(
		(j) =>
			(journeys[j.id]?.rps ?? 0) > 0 &&
			j.hops.some((h) => h.from === component.id || h.to === component.id),
	);

	return (
		<section aria-labelledby="inspector-title" className="space-y-5">
			<div>
				<div className="flex items-center gap-2">
					<Badge>{kindLabel[component.kind]}</Badge>
					{!isClient && <Badge color={color}>{statusLabel[state.status]}</Badge>}
					{state.breakerOpen && <Badge color="#f59e0b">breaker tripped</Badge>}
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
				<h2 id="inspector-title" className="mt-2 text-lg font-semibold text-slate-900">
					{component.name}
				</h2>
				<p className="mt-1 text-sm text-slate-600">
					<Explained pieces={summary!} />
				</p>
			</div>

			{!isClient && (
				<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
					<div>
						<div className="flex justify-between text-xs">
							<span className="text-slate-500">How busy</span>
							<span className="font-semibold text-slate-900 tabular-nums">
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
						<Row label="Time to answer">{down ? '–' : formatMs(state.latencyMs)}</Row>
						{state.threads !== undefined && (
							<Row label="Threads in use">
								{Math.min(Math.round(state.inFlight), state.threads)} of{' '}
								{state.threads}
							</Row>
						)}
						{state.backlog > 0 ? (
							<Row label="Piling up">{formatRps(state.backlog)}</Row>
						) : (
							<Row label="Failing">{formatShare(state.failRate)}</Row>
						)}
						{state.load > state.demand * 1.01 && (
							<Row label="From retries">{formatRps(state.load - state.demand)}</Row>
						)}
						{component.hitRate !== undefined && (
							<Row label="Answers from memory">{formatShare(down ? 0 : hitRate)}</Row>
						)}
					</dl>

					<div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
						{scalable && <span className="text-xs text-slate-500">Copies</span>}
						{scalable && (
							<div className="flex items-center rounded-lg border border-slate-200">
								<button
									type="button"
									aria-label="Remove a copy"
									disabled={instances <= 1}
									onClick={() => setInstances(component.id, instances - 1)}
									className="grid size-7 place-items-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
								>
									<MinusIcon width={13} height={13} />
								</button>
								<output
									aria-label="Copies set by you"
									className="w-8 text-center text-sm font-semibold text-slate-900 tabular-nums"
								>
									{instances}
								</output>
								<button
									type="button"
									aria-label="Add a copy"
									disabled={instances >= MAX_INSTANCES}
									onClick={() => setInstances(component.id, instances + 1)}
									className="grid size-7 place-items-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
								>
									<PlusIcon width={13} height={13} />
								</button>
							</div>
						)}
						{state.autoscaled && (
							<span className="text-xs text-cyan-700">
								now {state.instances}, added by autoscaling
							</span>
						)}
						<Button
							size="sm"
							variant={down ? 'plain' : 'danger'}
							className="ml-auto"
							onClick={() => setDown(component.id, !down)}
						>
							<PowerIcon width={13} height={13} />
							{down ? 'Bring back' : 'Take down'}
						</Button>
					</div>
					<p className="text-[11px] text-slate-500">
						{!scalable
							? 'Another company runs this, so we can’t add copies. It has its own limits.'
							: component.maxInstances === undefined
								? 'This doesn’t autoscale. The number of copies changes only when you change it.'
								: `Autoscaling can grow this to ${component.maxInstances} copies.`}
					</p>
					<div className="space-y-1.5 border-t border-slate-200 pt-3">
						<Toggle
							label="Slow"
							description="Every request takes ten times as long, like a machine with a failing disk"
							checked={slowed}
							onChange={(on) => setSlow(component.id, on)}
						/>
						{cutTo.map((other) => (
							<div key={other} className="flex items-center gap-2 text-xs">
								<span className="text-slate-600">
									Link to{' '}
									{system.components.find((c) => c.id === other)?.name ?? other}:
									cut
								</span>
								<Button
									size="sm"
									className="ml-auto"
									onClick={() => setCut(component.id, other, false)}
								>
									Mend
								</Button>
							</div>
						))}
						{component.kind !== 'external' && (
							<Toggle
								label="Turn away at once"
								description="When it's full, it says “busy, try later” straight away, instead of letting requests wait for a timeout"
								checked={shedding}
								onChange={(on) => setShed(component.id, on)}
							/>
						)}
						{component.hitRate !== undefined && (
							<label className="flex items-center gap-2 text-xs">
								<span className="text-slate-500">Hit rate</span>
								<input
									type="range"
									min={0}
									max={100}
									step={5}
									value={Math.round(hitRate * 100)}
									onChange={(event) =>
										setHitRate(component.id, Number(event.target.value) / 100)
									}
									className="min-w-0 flex-1 accent-cyan-600"
								/>
								<output className="w-9 text-right font-medium text-slate-900 tabular-nums">
									{Math.round(hitRate * 100)}%
								</output>
							</label>
						)}
					</div>
					{picks && (
						<div className="space-y-1.5 border-t border-slate-200 pt-3">
							<label className="flex items-center justify-between gap-2 text-xs">
								<span className="text-slate-500">Picks a copy by</span>
								<select
									value={rule}
									onChange={(event) =>
										setBalancing(component.id, event.target.value as Balancing)
									}
									className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-900"
								>
									{balancings.map((b) => (
										<option key={b} value={b}>
											{balancingName[b]}
										</option>
									))}
								</select>
							</label>
							<p className="text-[11px] text-slate-500">{balancingRule[rule]}</p>
							<Toggle
								label="Health checks"
								description="Stop sending requests to copies that are down"
								checked={input.healthChecks ?? true}
								onChange={setHealthChecks}
							/>
						</div>
					)}
				</div>
			)}

			<dl className="space-y-3 text-sm">
				<Explain label="Why it’s here">
					<Explained pieces={why!} />
				</Explain>
				{!isClient && (
					<Explain label="When it fails">
						<Explained pieces={onFailure!} />
					</Explain>
				)}
				<Explain label="How it grows">
					<Explained pieces={scaling!} />
				</Explain>
			</dl>

			{usedBy.length > 0 && (
				<div>
					<h3 className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
						Used in
					</h3>
					<ul className="mt-1.5 flex flex-wrap gap-1.5">
						{usedBy.map((j) => (
							<li key={j.id}>
								<button
									type="button"
									onClick={() => selectJourney(j.id)}
									className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-900"
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
			<dd className="font-medium text-slate-900">{children}</dd>
		</div>
	);
}

function Explain({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div>
			<dt className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
				{label}
			</dt>
			<dd className="mt-0.5 text-slate-600">{children}</dd>
		</div>
	);
}
