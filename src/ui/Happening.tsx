import { useMemo, useState } from 'react';
import { annotate, namesOf } from '@/learn/glossary';
import { fixesFor } from '@/sim/fixes';
import type { Insight } from '@/sim/insights';
import { explain } from '@/sim/insights';
import { useApp, useSystem } from '@/store';
import { cx } from './cx';
import { Explained } from './Explained';

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

/** Shown before "Show all": the most serious come first. */
const FIRST = 5;

/**
 * What's going on, in plain words and most serious first, with a fix to try
 * for each problem: add copies of what's overloaded, bring back what's down,
 * switch on the safety feature that would help.
 */
export function WhatsHappening() {
	const system = useSystem();
	const input = useApp((s) => s.input);
	const result = useApp((s) => s.result);
	const applyChange = useApp((s) => s.applyChange);
	const select = useApp((s) => s.select);
	const [all, setAll] = useState(false);

	const insights = useMemo(() => explain(system, input, result), [system, input, result]);
	const fixes = fixesFor(system, input, result, insights);
	const texts = annotate(
		insights.map((i) => i.text),
		namesOf(system),
	);

	return (
		<section aria-labelledby="happening-title" className="surface p-4">
			<h2
				id="happening-title"
				className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase"
			>
				What’s happening
			</h2>
			<ul className="mt-2.5 space-y-3" aria-live="polite">
				{insights.slice(0, all ? insights.length : FIRST).map((insight, i) => {
					const mine = fixes[i]!;
					return (
						<li key={insight.text} className="flex gap-2.5 text-sm">
							<span
								className={cx(
									'mt-1.5 size-2 shrink-0 rounded-full',
									dot[insight.level],
								)}
							>
								<span className="sr-only">{spoken[insight.level]}:</span>
							</span>
							<div className="min-w-0">
								<p className="text-slate-700">
									<Explained pieces={texts[i]!} />
								</p>
								{(mine.length > 0 || insight.componentId) && (
									<div className="mt-1.5 flex flex-wrap gap-1.5">
										{mine.map((fix) => (
											<button
												key={fix.label}
												type="button"
												onClick={() => applyChange(fix.change)}
												className="press rounded-lg border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-800 hover:bg-cyan-100"
											>
												{fix.label}
											</button>
										))}
										{insight.componentId && (
											<button
												type="button"
												onClick={() => select(insight.componentId!)}
												className="px-1 py-1 text-xs text-slate-500 hover:text-ink hover:underline"
											>
												More about{' '}
												{system.components.find(
													(c) => c.id === insight.componentId,
												)?.name ?? 'it'}
											</button>
										)}
									</div>
								)}
							</div>
						</li>
					);
				})}
			</ul>
			{insights.length > FIRST && (
				<button
					type="button"
					onClick={() => setAll(!all)}
					className="mt-3 text-xs font-medium text-cyan-700 hover:underline"
				>
					{all ? 'Show fewer' : `Show all ${insights.length}`}
				</button>
			)}
		</section>
	);
}
