import { useMemo } from 'react';
import { explain, type Insight } from '@/sim/insights';
import { useApp, useSystem } from '@/store';
import { Badge, Button, SectionTitle } from './controls';
import { ArrowIcon } from './icons';

const insightStyle: Record<Insight['level'], { dot: string; label: string }> = {
	bad: { dot: 'bg-red-400', label: 'Problem' },
	warn: { dot: 'bg-amber-400', label: 'Warning' },
	info: { dot: 'bg-sky-400', label: 'Note' },
	good: { dot: 'bg-emerald-400', label: 'All good' },
};

/** Shown when nothing is selected: what the system is, and what's happening right now. */
export function Overview() {
	const system = useSystem();
	const input = useApp((s) => s.input);
	const result = useApp((s) => s.result);
	const select = useApp((s) => s.select);
	const openDialog = useApp((s) => s.openDialog);
	const insights = useMemo(() => explain(system, input, result), [system, input, result]);

	return (
		<div className="space-y-6">
			<section aria-labelledby="system-title">
				<Badge>
					{system.basis === 'inspired'
						? 'Simplified, from public talks'
						: 'Real architecture'}
				</Badge>
				<h2 id="system-title" className="mt-2 text-lg font-semibold text-white">
					{system.name}
				</h2>
				<p className="mt-1 text-sm text-slate-300">{system.tagline}</p>
				<Button
					size="sm"
					variant="ghost"
					className="-ml-2 mt-2 text-cyan-300"
					onClick={() => openDialog('about')}
				>
					How it’s designed, and the sources
					<ArrowIcon width={13} height={13} />
				</Button>
			</section>

			<section aria-labelledby="happening-title" aria-live="polite">
				<SectionTitle id="happening-title">What’s happening</SectionTitle>
				<ul className="mt-2 space-y-2">
					{insights.map((insight) => (
						<li key={insight.text} className="flex gap-2.5 text-sm">
							<span
								className={`mt-1.5 size-2 shrink-0 rounded-full ${insightStyle[insight.level].dot}`}
							>
								<span className="sr-only">
									{insightStyle[insight.level].label}:
								</span>
							</span>
							<span className="text-slate-300">
								{insight.text}
								{insight.componentId && (
									<>
										{' '}
										<button
											type="button"
											className="text-cyan-300 hover:underline"
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
			</section>

			<section aria-labelledby="decisions-title">
				<SectionTitle id="decisions-title">Design decisions</SectionTitle>
				<div className="mt-2 space-y-1.5">
					{system.decisions.map((decision) => (
						<details
							key={decision.title}
							className="group rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
						>
							<summary className="cursor-pointer list-none text-sm font-medium text-slate-200 marker:hidden">
								{decision.title}
							</summary>
							<p className="mt-1.5 text-sm text-slate-400">{decision.detail}</p>
						</details>
					))}
				</div>
			</section>

			<p className="text-xs text-slate-500">Click any part of the map to see what it does.</p>
		</div>
	);
}
