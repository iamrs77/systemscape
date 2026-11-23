import { useEffect, useId, useRef, useState } from 'react';
import { TRAFFIC_RANGE, useApp, useChallenge, useSystem, type Option } from '@/store';
import { Button, Toggle } from './controls';
import { cx } from './cx';
import { ChevronIcon, ResetIcon } from './icons';

/** Scenario and traffic up front; how the system copes, one click away. */
export function ControlBar() {
	const system = useSystem();
	const challenge = useChallenge();
	const presetId = useApp((s) => s.presetId);
	const traffic = useApp((s) => s.input.traffic);
	const applyPreset = useApp((s) => s.applyPreset);
	const setTraffic = useApp((s) => s.setTraffic);
	const reset = useApp((s) => s.reset);
	const sliderId = useId();
	const locked = challenge !== undefined;

	return (
		<div className="surface flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3">
			<div role="group" aria-label="Scenario" className="flex flex-wrap gap-1">
				{system.presets.map((p) => (
					<button
						key={p.id}
						type="button"
						aria-pressed={p.id === presetId}
						disabled={locked && p.id !== presetId}
						title={locked ? 'Set by the challenge' : p.description}
						onClick={() => applyPreset(p.id)}
						className={cx(
							'rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30',
							p.id === presetId
								? 'border-cyan-600 bg-cyan-600 text-white'
								: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
						)}
					>
						{p.name}
					</button>
				))}
			</div>
			<div className="flex min-w-52 flex-1 items-center gap-3">
				<label htmlFor={sliderId} className="shrink-0 text-xs text-slate-500">
					Traffic
				</label>
				<input
					id={sliderId}
					type="range"
					min={Math.log(TRAFFIC_RANGE.min)}
					max={Math.log(TRAFFIC_RANGE.max)}
					step={0.01}
					value={Math.log(traffic)}
					disabled={locked}
					aria-valuetext={`${traffic.toFixed(2)} times normal`}
					onChange={(e) =>
						setTraffic(Number(Math.exp(Number(e.target.value)).toFixed(2)))
					}
					className="h-1 flex-1 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
				/>
				<span className="w-11 shrink-0 text-right text-sm font-semibold text-slate-900 tabular-nums">
					{traffic.toFixed(2).replace(/\.?0+$/, '')}×
				</span>
			</div>
			<div className="flex items-center gap-1">
				<ResilienceMenu />
				<Button size="sm" variant="ghost" onClick={reset} title="Undo your changes">
					<ResetIcon width={14} height={14} />
					Reset
				</Button>
			</div>
		</div>
	);
}

const switches: { option: Option; label: string; description: string }[] = [
	{
		option: 'autoscale',
		label: 'Autoscaling',
		description:
			'Services add instances by themselves when they get busy, up to a limit. It takes minutes, so it can’t catch a sudden rush.',
	},
	{
		option: 'retries',
		label: 'Retries',
		description:
			'Failed calls are tried again. That hides brief blips, but piles more load on something already struggling.',
	},
	{
		option: 'circuitBreakers',
		label: 'Circuit breakers',
		description:
			'Callers stop calling something that keeps failing, and answer at once instead of waiting for a timeout.',
	},
	{
		option: 'sudden',
		label: 'Sudden rush',
		description:
			'The traffic arrives within minutes, faster than autoscaling can add instances.',
	},
];

/** The switches for how the system copes with load and failure, each explained. */
function ResilienceMenu() {
	const input = useApp((s) => s.input);
	const setOption = useApp((s) => s.setOption);
	const locked = useChallenge() !== undefined;
	const [open, setOpen] = useState(false);
	const root = useRef<HTMLDivElement>(null);
	const panelId = useId();
	const on = switches.filter((s) => input[s.option]).length;

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (!root.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	return (
		<div ref={root} className="relative">
			<Button
				size="sm"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen(!open)}
			>
				Resilience
				<span className="rounded bg-slate-200 px-1.5 text-[11px] text-slate-600">
					{on} on
				</span>
				<ChevronIcon
					width={13}
					height={13}
					className={cx('transition-transform', !open && 'rotate-180')}
				/>
			</Button>
			{open && (
				<div
					id={panelId}
					className="surface absolute bottom-full left-0 z-40 mb-2 w-[min(20rem,calc(100vw-2rem))] space-y-3 p-3 sm:right-0 sm:left-auto"
				>
					{switches.map((s) => (
						<div key={s.option}>
							<Toggle
								label={s.label}
								description={s.description}
								checked={input[s.option]}
								disabled={s.option === 'sudden' && locked}
								onChange={(checked) => setOption(s.option, checked)}
							/>
							<p className="mt-0.5 pl-11 text-xs text-slate-500">{s.description}</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
