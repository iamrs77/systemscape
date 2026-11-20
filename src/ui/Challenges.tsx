import { useState, type ReactNode } from 'react';
import type { Challenge } from '@/model/schema';
import { formatMs, formatShare } from '@/sim/format';
import { meetsGoal } from '@/systems/challenges';
import { useApp, useChallenge, useSystem } from '@/store';
import { Button, SectionTitle } from './controls';
import { cx } from './cx';
import { CheckIcon, CrossIcon } from './icons';

/** The list of challenges, with the ones already solved ticked. */
export function ChallengeList() {
	const system = useSystem();
	const solved = useApp((s) => s.solved);
	const activeId = useApp((s) => s.challengeId);
	const start = useApp((s) => s.startChallenge);
	if (system.challenges.length === 0) return null;

	return (
		<section aria-labelledby="challenges-title" className="space-y-3" data-tour="challenges">
			<div>
				<SectionTitle id="challenges-title">Challenges</SectionTitle>
				<p className="mt-1 text-xs text-slate-500">
					Something goes wrong. Can you keep it running?
				</p>
			</div>
			<ul className="space-y-1">
				{system.challenges.map((challenge, index) => {
					const done = solved.includes(`${system.id}/${challenge.id}`);
					const active = activeId === challenge.id;
					return (
						<li key={challenge.id}>
							<button
								type="button"
								onClick={() => start(challenge.id)}
								aria-current={active || undefined}
								className={cx(
									'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
									active
										? 'bg-amber-400/10 text-amber-100 ring-1 ring-amber-400/40'
										: 'text-slate-200 hover:bg-white/[0.05]',
								)}
							>
								<span
									className={cx(
										'grid size-5 shrink-0 place-items-center rounded-full',
										done
											? 'bg-emerald-400/20 text-emerald-300'
											: 'bg-white/[0.06] text-slate-500',
									)}
								>
									{done ? (
										<CheckIcon width={12} height={12} />
									) : (
										<span
											className="text-[11px] font-semibold tabular-nums"
											aria-hidden="true"
										>
											{index + 1}
										</span>
									)}
								</span>
								<span className="min-w-0 flex-1 truncate">{challenge.title}</span>
								{done && <span className="sr-only">, solved</span>}
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

/** The active challenge: the story, the goal checked live, a hint, and the lesson once solved. */
export function ChallengeCard() {
	const system = useSystem();
	const challenge = useChallenge();
	const result = useApp((s) => s.result);
	const leave = useApp((s) => s.leaveChallenge);
	const start = useApp((s) => s.startChallenge);
	const [hintFor, setHintFor] = useState<string | null>(null);
	const [collapsed, setCollapsed] = useState(false);
	if (!challenge) return null;

	const met = meetsGoal(result, challenge);
	const journey = system.journeys.find((j) => j.id === challenge.goal.journey)!;
	const state = result.journeys[journey.id]!;
	const index = system.challenges.indexOf(challenge);
	const next = system.challenges[index + 1];

	return (
		<section
			aria-label={`Challenge: ${challenge.title}`}
			className={cx(
				'rounded-2xl border bg-slate-900/60 p-4',
				met ? 'border-emerald-400/40' : 'border-amber-400/30',
			)}
		>
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<p
						className={cx(
							'text-[11px] font-semibold tracking-[0.12em] uppercase',
							met ? 'text-emerald-300' : 'text-amber-300',
						)}
					>
						{met ? 'Solved' : 'Challenge'}
					</p>
					<h2 className="mt-0.5 text-base font-semibold text-white">{challenge.title}</h2>
				</div>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setCollapsed(!collapsed)}
					aria-expanded={!collapsed}
				>
					{collapsed ? 'Show' : 'Hide'}
				</Button>
				<Button size="sm" onClick={leave}>
					Leave
				</Button>
			</div>

			{!collapsed && (
				<div className="mt-2 space-y-3 text-sm">
					{!met && <p className="text-slate-300">{challenge.story}</p>}
					<Goal
						challenge={challenge}
						journeyName={journey.name}
						success={state.success}
						latencyMs={state.latencyMs}
					/>
					{met ? (
						<div className="space-y-3">
							<p className="text-slate-200">{challenge.lesson}</p>
							{next && (
								<Button variant="primary" onClick={() => start(next.id)}>
									Next challenge: {next.title}
								</Button>
							)}
						</div>
					) : hintFor === challenge.id ? (
						<p className="rounded-lg bg-cyan-400/10 px-3 py-2 text-cyan-100">
							<span className="font-semibold">Hint: </span>
							{challenge.hint}
						</p>
					) : (
						<Button
							size="sm"
							variant="ghost"
							className="-ml-2 text-cyan-300"
							onClick={() => setHintFor(challenge.id)}
						>
							Show a hint
						</Button>
					)}
				</div>
			)}
		</section>
	);
}

function Goal({
	challenge,
	journeyName,
	success,
	latencyMs,
}: {
	challenge: Challenge;
	journeyName: string;
	success: number;
	latencyMs: number;
}) {
	const { minSuccess, maxLatencyMs } = challenge.goal;
	return (
		<div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
			<p className="text-xs text-slate-400">
				Goal for <span className="text-slate-200">{journeyName}</span>
			</p>
			<ul className="mt-1 space-y-0.5 tabular-nums">
				<Check ok={success >= minSuccess}>
					At least {formatShare(minSuccess)} succeed{' '}
					<span className="text-slate-500">(now {formatShare(success)})</span>
				</Check>
				{maxLatencyMs !== undefined && (
					<Check ok={latencyMs <= maxLatencyMs}>
						Users wait {formatMs(maxLatencyMs)} or less{' '}
						<span className="text-slate-500">(now {formatMs(latencyMs)})</span>
					</Check>
				)}
			</ul>
		</div>
	);
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
	return (
		<li className="flex items-center gap-2">
			<span className={ok ? 'text-emerald-300' : 'text-red-300'}>
				{ok ? <CheckIcon width={14} height={14} /> : <CrossIcon width={14} height={14} />}
			</span>
			<span className="sr-only">{ok ? 'Met:' : 'Not met:'}</span>
			<span>{children}</span>
		</li>
	);
}
