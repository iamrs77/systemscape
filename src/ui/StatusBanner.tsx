import { useMemo, useState } from 'react';
import { explain, type Insight } from '@/sim/insights';
import { useApp, useSystem } from '@/store';
import { cx } from './cx';
import { ChevronIcon } from './icons';

const dot: Record<Insight['level'], string> = {
	bad: 'bg-red-500',
	warn: 'bg-amber-500',
	info: 'bg-sky-500',
	good: 'bg-emerald-500',
};
const spoken: Record<Insight['level'], string> = {
	bad: 'Problem',
	warn: 'Warning',
	info: 'Note',
	good: 'All good',
};

/** One line over the map saying how the system is doing, with the details a click away. */
export function StatusBanner() {
	const system = useSystem();
	const journeyId = useApp((s) => s.journeyId);
	const input = useApp((s) => s.input);
	const result = useApp((s) => s.result);
	const select = useApp((s) => s.select);
	const [open, setOpen] = useState(false);

	const insights = useMemo(() => explain(system, input, result), [system, input, result]);
	// lead with the worst problem (in the followed journey, if it has one), or
	// with "all good" when there isn't one
	const followed = system.journeys.find((j) => j.id === journeyId)?.name;
	const problems = insights.filter((i) => i.level === 'bad' || i.level === 'warn');
	const headline =
		(followed ? problems.find((i) => i.text.startsWith(followed)) : undefined) ??
		problems[0] ??
		insights.find((i) => i.level === 'good') ??
		insights[0]!;
	const rest = insights.filter((i) => i !== headline);

	return (
		<section aria-label="What’s happening" className="surface overflow-hidden">
			<div className="flex items-start gap-2.5 px-3.5 py-2.5">
				<span className={cx('mt-1.5 size-2 shrink-0 rounded-full', dot[headline.level])} />
				<p className="min-w-0 flex-1 text-sm text-slate-900" aria-live="polite">
					<span className="sr-only">{spoken[headline.level]}: </span>
					{headline.text}
				</p>
				{rest.length > 0 && (
					<button
						type="button"
						aria-expanded={open}
						onClick={() => setOpen(!open)}
						className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-cyan-700 hover:bg-slate-100"
					>
						{open ? 'Less' : `${rest.length} more`}
						<ChevronIcon
							width={12}
							height={12}
							className={cx('transition-transform', open && 'rotate-180')}
						/>
					</button>
				)}
			</div>
			{open && (
				<ul className="max-h-72 space-y-2 overflow-y-auto border-t border-slate-200 px-3.5 py-2.5">
					{rest.map((insight) => (
						<li key={insight.text} className="flex gap-2.5 text-sm">
							<span
								className={cx(
									'mt-1.5 size-2 shrink-0 rounded-full',
									dot[insight.level],
								)}
							>
								<span className="sr-only">{spoken[insight.level]}:</span>
							</span>
							<span className="text-slate-600">
								{insight.text}
								{insight.componentId && (
									<>
										{' '}
										<button
											type="button"
											className="text-cyan-700 hover:underline"
											onClick={() => select(insight.componentId!)}
										>
											Inspect
										</button>
									</>
								)}
							</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
