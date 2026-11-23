import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Challenge } from '@/model/schema';
import { formatMs, formatShare } from '@/sim/format';
import { meetsGoal } from '@/systems/challenges';
import { useApp, useChallenge, useSystem } from '@/store';
import { annotate, namesOf } from '@/learn/glossary';
import { exploreHref, practiceHref } from '@/route';
import { Explained } from './Explained';
import { buttonSizes, buttonVariants } from './buttonStyles';
import { Button } from './controls';
import { cx } from './cx';
import { CheckIcon, CrossIcon } from './icons';

/** The active challenge: the story, the goal checked live, a hint, and the lesson once solved. */
export function ChallengeCard() {
	const system = useSystem();
	const challenge = useChallenge();
	const result = useApp((s) => s.result);
	const [hintFor, setHintFor] = useState<string | null>(null);
	const [collapsed, setCollapsed] = useState(false);
	const card = useRef<HTMLElement>(null);
	// a new challenge scrolls its card into view
	useEffect(() => {
		card.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [challenge?.id]);
	if (!challenge) return null;

	const met = meetsGoal(result, challenge);
	const [story, hint, lesson] = annotate(
		[challenge.story, challenge.hint, challenge.lesson],
		namesOf(system),
	);
	const journey = system.journeys.find((j) => j.id === challenge.goal.journey)!;
	const state = result.journeys[journey.id]!;
	const index = system.challenges.indexOf(challenge);
	const next = system.challenges[index + 1];

	return (
		<section
			ref={card}
			aria-label={`Challenge: ${challenge.title}`}
			className={cx('surface p-4', met ? 'bg-emerald-50' : 'bg-amber-50')}
		>
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<p
						className={cx(
							'text-[11px] font-semibold tracking-[0.12em] uppercase',
							met ? 'text-emerald-600' : 'text-amber-600',
						)}
					>
						{met ? 'Solved' : 'Challenge'}
					</p>
					<h2 className="mt-0.5 text-base font-semibold text-slate-900">
						{challenge.title}
					</h2>
				</div>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setCollapsed(!collapsed)}
					aria-expanded={!collapsed}
				>
					{collapsed ? 'Show' : 'Hide'}
				</Button>
				<a
					href={exploreHref(system.id)}
					className={cx(
						'inline-flex items-center rounded-lg',
						buttonSizes.sm,
						buttonVariants.plain,
					)}
				>
					Leave
				</a>
			</div>

			{!collapsed && (
				<div className="mt-2 space-y-3 text-sm">
					{!met && (
						<p className="text-slate-600">
							<Explained pieces={story!} />
						</p>
					)}
					<Goal
						challenge={challenge}
						journeyName={journey.name}
						success={state.success}
						latencyMs={state.latencyMs}
					/>
					{met ? (
						<div className="space-y-3">
							<p className="text-slate-800">
								<Explained pieces={lesson!} />
							</p>
							{next && (
								<a
									href={practiceHref(system.id, next.id)}
									className={cx(
										'inline-flex items-center gap-1.5 rounded-lg',
										buttonSizes.md,
										buttonVariants.primary,
									)}
								>
									Next challenge: {next.title}
								</a>
							)}
						</div>
					) : hintFor === challenge.id ? (
						<p className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-900">
							<span className="font-semibold">Hint: </span>
							<Explained pieces={hint!} />
						</p>
					) : (
						<Button
							size="sm"
							variant="ghost"
							className="-ml-2 text-cyan-700"
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
		<div className="rounded-lg border border-slate-200 bg-card px-3 py-2">
			<p className="text-xs text-slate-500">
				Goal for <span className="text-slate-800">{journeyName}</span>
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
			<span className={ok ? 'text-emerald-600' : 'text-red-600'}>
				{ok ? <CheckIcon width={14} height={14} /> : <CrossIcon width={14} height={14} />}
			</span>
			<span className="sr-only">{ok ? 'Met:' : 'Not met:'}</span>
			<span>{children}</span>
		</li>
	);
}
