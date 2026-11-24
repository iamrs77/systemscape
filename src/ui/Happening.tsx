import { useMemo, useState } from 'react';
import { annotate, namesOf } from '@/learn/glossary';
import type { Insight } from '@/sim/insights';
import { explain } from '@/sim/insights';
import { MAX_INSTANCES, useApp, useSystem } from '@/store';
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

/** Autoscaling and hand-added copies aim to keep each part at most this busy. */
const COMFORTABLE = 0.7;

/** Shown before "Show all": the most serious come first. */
const FIRST = 5;

type Fix = { label: string; run(): void };

/**
 * What's going on, in plain words and most serious first, with a fix to try
 * for each problem: add copies of what's overloaded, bring back what's down,
 * switch on the safety feature that would help.
 */
export function WhatsHappening() {
	const system = useSystem();
	const input = useApp((s) => s.input);
	const result = useApp((s) => s.result);
	const setInstances = useApp((s) => s.setInstances);
	const setDown = useApp((s) => s.setDown);
	const setOption = useApp((s) => s.setOption);
	const select = useApp((s) => s.select);
	const [all, setAll] = useState(false);

	const insights = useMemo(() => explain(system, input, result), [system, input, result]);
	const texts = annotate(
		insights.map((i) => i.text),
		namesOf(system),
	);

	// each fix is offered once, beside the first problem it would help
	const offered = new Set<string>();
	const fixesFor = (insight: Insight): Fix[] => {
		const fixes: Fix[] = [];
		const component = system.components.find((c) => c.id === insight.componentId);
		const state = component && result.components[component.id];
		if (insight.retryStorm && input.retries) {
			fixes.push({ label: 'Turn off retries', run: () => setOption('retries', false) });
		}
		if (component && state?.status === 'down') {
			fixes.push({
				label: `Bring back ${component.name}`,
				run: () => setDown(component.id, false),
			});
			if (!input.circuitBreakers) {
				fixes.push({
					label: 'Turn on circuit breakers',
					run: () => setOption('circuitBreakers', true),
				});
			}
		} else if (component && state?.status === 'overloaded') {
			if (component.kind === 'external') {
				if (!input.circuitBreakers) {
					fixes.push({
						label: 'Turn on circuit breakers',
						run: () => setOption('circuitBreakers', true),
					});
				}
			} else {
				const needed = Math.min(
					MAX_INSTANCES,
					Math.ceil((state.instances * state.utilization) / COMFORTABLE),
				);
				if (needed > state.instances) {
					const more = needed - state.instances;
					fixes.push({
						label: `Add ${more} ${more === 1 ? 'copy' : 'copies'} of ${component.name}`,
						run: () => setInstances(component.id, needed),
					});
				}
				if (!input.autoscale && component.maxInstances !== undefined) {
					fixes.push({
						label: 'Turn on autoscaling',
						run: () => setOption('autoscale', true),
					});
				}
			}
		}
		return fixes.filter((fix) => {
			if (offered.has(fix.label)) return false;
			offered.add(fix.label);
			return true;
		});
	};

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
					const fixes = fixesFor(insight);
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
								{(fixes.length > 0 || insight.componentId) && (
									<div className="mt-1.5 flex flex-wrap gap-1.5">
										{fixes.map((fix) => (
											<button
												key={fix.label}
												type="button"
												onClick={fix.run}
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
