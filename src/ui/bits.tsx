import type { ReactNode } from 'react';
import { INK } from '@/diagram/geometry';
import { useApp } from '@/store';
import { cx } from './cx';
import { ExpandIcon, PauseIcon, PlayIcon, ShrinkIcon } from './icons';

/**
 * Small labelled numbers, in a row above the diagram: on a phone a slim one,
 * with just the numbers.
 */
export function Facts({ facts }: { facts: { label: string; value: string; hint?: string }[] }) {
	if (facts.length === 0) return null;
	return (
		<dl className="flex gap-1.5 sm:flex-wrap sm:gap-2">
			{facts.map((fact) => (
				<div
					key={fact.label}
					className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-sm sm:min-w-24 sm:flex-none sm:px-3"
				>
					<dt className="text-[10px] tracking-wider text-slate-500 uppercase">
						{fact.label}
					</dt>
					<dd className="font-mono text-sm font-semibold text-ink tabular-nums sm:text-base">
						{fact.value}
					</dd>
					{fact.hint && (
						<dd className="hidden text-[11px] text-slate-500 sm:block">{fact.hint}</dd>
					)}
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
			className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600"
		>
			<li className="flex items-center gap-1.5">
				<span className="rounded-full border border-ink bg-white px-1.5 font-mono text-[10px] leading-4 font-semibold text-ink">
					×3
				</span>
				copies running
			</li>
			<li className="flex items-center gap-1.5">{dot('#ef8a3d')}request</li>
			<li className="flex items-center gap-1.5">{dot('#9b80df')}background work</li>
			<li className="flex items-center gap-1.5">{dot('#d1492f')}failed request</li>
			<li className="flex items-center gap-1.5">
				<svg width="22" height="8" viewBox="0 0 22 8" aria-hidden="true">
					<path d="M1 4h20" stroke={INK} strokeWidth="1.5" strokeDasharray="4 3" />
				</svg>
				nobody waits for it
			</li>
		</ul>
	);
}

/** A small button in the strip under the diagram; its label shows on wide screens. */
export function FrameButton({
	icon,
	label,
	title,
	onClick,
}: {
	icon: ReactNode;
	label: string;
	title: string;
	onClick(): void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 hover:text-ink"
		>
			{icon}
			<span className="sr-only min-[1400px]:not-sr-only">{label}</span>
		</button>
	);
}

/**
 * The diagram's paper: things over it at the top; below it, any controls, the
 * legend, and buttons to pause, for any `tools`, and to fill the screen.
 */
export function DiagramFrame({
	children,
	over,
	controls,
	tools,
	fill,
}: {
	children: ReactNode;
	over?: ReactNode;
	/** What you can change, in a strip under the diagram. */
	controls?: ReactNode;
	/** More buttons beside Pause. */
	tools?: ReactNode;
	/** Offers a button to show it on the whole screen (see useFullScreen). */
	fill?: { full: boolean; toggle(): void };
}) {
	const paused = useApp((s) => s.paused);
	const setPaused = useApp((s) => s.setPaused);
	const full = fill?.full ?? false;

	return (
		<div
			className={cx(
				'surface diagram-bg relative flex flex-col overflow-hidden lg:min-h-0 lg:flex-1',
				// on the whole screen, a finger drags the diagram rather than the page
				full &&
					'h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-1.5rem)] lg:h-auto [&_svg]:touch-none',
			)}
		>
			{over && <div className="px-2.5 pt-2.5 sm:px-3 sm:pt-3">{over}</div>}
			{/* on a phone the diagram keeps its own height, whatever is below it */}
			<div
				className={
					full
						? 'min-h-0 flex-1'
						: 'h-[55dvh] min-h-[300px] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1'
				}
			>
				<div className="h-full px-2 pt-2">{children}</div>
			</div>
			{controls}
			<div className="flex items-center gap-3 border-t border-slate-200 bg-card/80 px-3 py-1.5">
				<Legend />
				<div className="ml-auto flex shrink-0 items-center gap-1">
					<FrameButton
						icon={
							paused ? (
								<PlayIcon width={12} height={12} />
							) : (
								<PauseIcon width={12} height={12} />
							)
						}
						label={paused ? 'Play' : 'Pause'}
						title={paused ? 'Start the moving dots again' : 'Stop the moving dots'}
						onClick={() => setPaused(!paused)}
					/>
					{tools}
					{fill && (
						<FrameButton
							icon={
								full ? (
									<ShrinkIcon width={12} height={12} />
								) : (
									<ExpandIcon width={12} height={12} />
								)
							}
							label={full ? 'Exit full screen' : 'Full screen'}
							title={full ? 'Back to the page (Esc)' : 'Fill the screen'}
							onClick={fill.toggle}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
