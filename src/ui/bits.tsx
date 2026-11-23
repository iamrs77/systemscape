import type { ReactNode } from 'react';
import { INK } from '@/diagram/geometry';
import { useApp } from '@/store';
import { cx } from './cx';
import { PauseIcon, PlayIcon } from './icons';

/** Small labelled numbers, like the ones over the diagram. */
export function Facts({ facts }: { facts: { label: string; value: string; hint?: string }[] }) {
	if (facts.length === 0) return null;
	return (
		<dl className="flex flex-wrap gap-2">
			{facts.map((fact) => (
				<div
					key={fact.label}
					className="min-w-24 rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 shadow-sm"
				>
					<dt className="text-[10px] tracking-wider text-slate-500 uppercase">
						{fact.label}
					</dt>
					<dd className="font-mono text-base font-semibold text-ink tabular-nums">
						{fact.value}
					</dd>
					{fact.hint && <dd className="text-[11px] text-slate-500">{fact.hint}</dd>}
				</div>
			))}
		</dl>
	);
}

/** A boxed note beside a lesson step. */
export function Callout({
	tone,
	title,
	children,
}: {
	tone: 'good' | 'warn';
	title: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cx(
				'rounded-xl border px-3.5 py-3 text-sm',
				tone === 'good'
					? 'border-cyan-400 bg-cyan-50 text-cyan-900'
					: 'border-red-300 bg-red-50 text-red-900',
			)}
		>
			<p className="text-[11px] font-semibold tracking-wider uppercase opacity-80">{title}</p>
			<p className="mt-1">{children}</p>
		</div>
	);
}

const dot = (colour: string) => (
	<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
		<circle cx="6" cy="6" r="4.5" fill={colour} stroke={INK} strokeWidth="1.2" />
	</svg>
);

/** What the marks on the diagram mean. */
export function Legend() {
	return (
		<ul
			aria-label="Legend"
			className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600"
		>
			<li className="flex items-center gap-1.5">
				<span className="rounded-full border border-ink bg-white px-1.5 font-mono text-[10px] leading-4 font-semibold text-ink">
					×3
				</span>
				copies running
			</li>
			<li className="flex items-center gap-1.5">{dot('#ef8a3d')}request</li>
			<li className="flex items-center gap-1.5">{dot('#9b80df')}background work</li>
			<li className="flex items-center gap-1.5">{dot('#d1492f')}fails</li>
			<li className="flex items-center gap-1.5">
				<svg width="22" height="8" viewBox="0 0 22 8" aria-hidden="true">
					<path d="M1 4h20" stroke={INK} strokeWidth="1.5" strokeDasharray="4 3" />
				</svg>
				nobody waits
			</li>
		</ul>
	);
}

/** The diagram's paper: things over it at the top, the legend and a pause button below. */
export function DiagramFrame({ children, over }: { children: ReactNode; over?: ReactNode }) {
	const paused = useApp((s) => s.paused);
	const setPaused = useApp((s) => s.setPaused);
	return (
		<div className="surface diagram-bg relative flex h-[60dvh] min-h-[360px] flex-col overflow-hidden lg:h-auto lg:min-h-0 lg:flex-1">
			{over && <div className="px-3 pt-3">{over}</div>}
			<div className="min-h-0 flex-1">
				<div className="h-full px-2 pt-2">{children}</div>
			</div>
			<div className="flex items-center gap-3 border-t border-slate-200 bg-card/80 px-3 py-2">
				<Legend />
				<button
					type="button"
					onClick={() => setPaused(!paused)}
					className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 hover:text-ink"
				>
					{paused ? (
						<PlayIcon width={12} height={12} />
					) : (
						<PauseIcon width={12} height={12} />
					)}
					{paused ? 'Play' : 'Pause'}
				</button>
			</div>
		</div>
	);
}
