import { useId } from 'react';
import { TRAFFIC_RANGE, useApp, useChallenge, useSystem } from '@/store';
import { Button, Toggle } from './controls';
import { cx } from './cx';
import { ResetIcon } from './icons';

/** Scenario, traffic, and the resilience features you can switch on and off. */
export function ControlBar() {
	const system = useSystem();
	const challenge = useChallenge();
	const presetId = useApp((s) => s.presetId);
	const input = useApp((s) => s.input);
	const applyPreset = useApp((s) => s.applyPreset);
	const setTraffic = useApp((s) => s.setTraffic);
	const setOption = useApp((s) => s.setOption);
	const reset = useApp((s) => s.reset);
	const sliderId = useId();
	const locked = challenge !== undefined;
	const preset = system.presets.find((p) => p.id === presetId);

	return (
		<div
			className="space-y-2.5 border-t border-white/[0.06] bg-slate-950/70 px-4 py-3 backdrop-blur"
			data-tour="controls"
		>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
								'rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30',
								p.id === presetId
									? 'bg-white text-slate-950'
									: 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]',
							)}
						>
							{p.name}
						</button>
					))}
				</div>
				<div className="flex min-w-56 flex-1 items-center gap-3">
					<label htmlFor={sliderId} className="shrink-0 text-xs text-slate-400">
						Traffic
					</label>
					<input
						id={sliderId}
						type="range"
						min={Math.log(TRAFFIC_RANGE.min)}
						max={Math.log(TRAFFIC_RANGE.max)}
						step={0.01}
						value={Math.log(input.traffic)}
						disabled={locked}
						aria-valuetext={`${input.traffic.toFixed(2)} times normal`}
						onChange={(e) =>
							setTraffic(Number(Math.exp(Number(e.target.value)).toFixed(2)))
						}
						className="h-1 flex-1 cursor-pointer accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
					/>
					<span className="w-12 shrink-0 text-right text-sm font-semibold text-white tabular-nums">
						{input.traffic.toFixed(input.traffic < 10 ? 2 : 1).replace(/\.?0+$/, '')}×
					</span>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-x-1 gap-y-1">
				<Toggle
					label="Autoscaling"
					description="Services add instances by themselves when they get busy, up to a limit. It takes a few minutes, so it can't catch a sudden rush."
					checked={input.autoscale}
					onChange={(on) => setOption('autoscale', on)}
				/>
				<Toggle
					label="Retries"
					description="Failed calls are tried again. That hides brief blips, but adds load to something that's already struggling."
					checked={input.retries}
					onChange={(on) => setOption('retries', on)}
				/>
				<Toggle
					label="Circuit breakers"
					description="Callers stop calling something that keeps failing, and answer straight away instead of waiting for a timeout."
					checked={input.circuitBreakers}
					onChange={(on) => setOption('circuitBreakers', on)}
				/>
				<Toggle
					label="Sudden rush"
					description="The traffic arrives within minutes, faster than autoscaling can add instances."
					checked={input.sudden}
					disabled={locked}
					onChange={(on) => setOption('sudden', on)}
				/>
				<span className="ml-auto flex items-center gap-2">
					{preset && !locked && (
						<span className="hidden text-xs text-slate-500 xl:inline">
							{preset.description}
						</span>
					)}
					<Button size="sm" variant="ghost" onClick={reset} title="Undo your changes">
						<ResetIcon width={14} height={14} />
						Reset
					</Button>
				</span>
			</div>
		</div>
	);
}
