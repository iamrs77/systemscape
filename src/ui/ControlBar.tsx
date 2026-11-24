import { useId } from 'react';
import { TRAFFIC_RANGE, useApp, useSystem, type Option } from '@/store';
import { cx } from './cx';
import { ResetIcon } from './icons';

const switches: { option: Option; label: string; description: string }[] = [
	{
		option: 'autoscale',
		label: 'Autoscaling',
		description: 'Adds copies when a part gets busy. It takes a few minutes.',
	},
	{
		option: 'retries',
		label: 'Retries',
		description: 'Tries a failed call again. This hides small problems, but adds more work.',
	},
	{
		option: 'circuitBreakers',
		label: 'Circuit breakers',
		description: 'Stops calling a part that keeps failing, so nobody waits for it.',
	},
	{
		option: 'sudden',
		label: 'Sudden rush',
		description: 'Everyone arrives at once, too fast for autoscaling to keep up.',
	},
];

const times = (traffic: number) => traffic.toFixed(2).replace(/\.?0+$/, '');

const chip =
	'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors';

/**
 * Everything you can change, in a slim strip under the diagram so the diagram
 * keeps the room: the evening, the traffic, the safety features. Each one says
 * what it does when you hover it.
 */
export function ControlBar() {
	const system = useSystem();
	const presetId = useApp((s) => s.presetId);
	const input = useApp((s) => s.input);
	const applyPreset = useApp((s) => s.applyPreset);
	const setTraffic = useApp((s) => s.setTraffic);
	const setOption = useApp((s) => s.setOption);
	const reset = useApp((s) => s.reset);
	const sliderId = useId();

	return (
		<section
			aria-label="What you can change"
			className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 bg-card px-3 py-2"
		>
			{/* busy evenings, then the ones where a part breaks */}
			{[
				{
					label: 'Which evening',
					presets: system.presets.filter((p) => p.down.length === 0),
				},
				{
					label: 'Something breaks',
					presets: system.presets.filter((p) => p.down.length > 0),
				},
			]
				.filter((group) => group.presets.length > 0)
				.map((group, i) => (
					<div
						key={group.label}
						role="group"
						aria-label={group.label}
						className="flex flex-wrap items-center gap-1"
					>
						{i > 0 && (
							<span className="mr-0.5 text-[11px] text-slate-500" aria-hidden="true">
								Breaks:
							</span>
						)}
						{group.presets.map((p) => (
							<button
								key={p.id}
								type="button"
								aria-pressed={p.id === presetId}
								title={p.description}
								onClick={() => applyPreset(p.id)}
								className={cx(
									chip,
									p.id === presetId
										? 'border-cyan-600 bg-cyan-600 text-white'
										: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
								)}
							>
								{p.name}
							</button>
						))}
					</div>
				))}

			<div className="flex min-w-48 flex-1 items-center gap-2.5">
				<label htmlFor={sliderId} className="shrink-0 text-xs text-slate-500">
					Traffic
				</label>
				<input
					id={sliderId}
					type="range"
					min={Math.log(TRAFFIC_RANGE.min)}
					max={Math.log(TRAFFIC_RANGE.max)}
					step={0.01}
					value={Math.log(input.traffic)}
					aria-valuetext={`${times(input.traffic)} times as busy as a normal evening`}
					onChange={(e) =>
						setTraffic(Number(Math.exp(Number(e.target.value)).toFixed(2)))
					}
					className="h-1 min-w-0 flex-1 cursor-pointer accent-cyan-600"
				/>
				<span
					className="w-10 shrink-0 font-mono text-sm font-semibold text-ink tabular-nums"
					title={`${times(input.traffic)} times as busy as a normal evening`}
				>
					{times(input.traffic)}×
				</span>
			</div>

			<div role="group" aria-label="Safety features" className="flex flex-wrap gap-1">
				{switches.map((s) => {
					const on = input[s.option];
					return (
						<button
							key={s.option}
							type="button"
							role="switch"
							aria-checked={on}
							aria-description={s.description}
							title={s.description}
							onClick={() => setOption(s.option, !on)}
							className={cx(
								chip,
								on
									? 'border-cyan-300 bg-cyan-50 text-cyan-800'
									: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
							)}
						>
							<span
								aria-hidden="true"
								className={cx(
									'size-1.5 rounded-full',
									on ? 'bg-cyan-500' : 'bg-slate-300',
								)}
							/>
							{s.label}
						</button>
					);
				})}
			</div>

			<button
				type="button"
				onClick={reset}
				title="Undo your changes"
				className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-ink"
			>
				<ResetIcon width={12} height={12} />
				Reset
			</button>
		</section>
	);
}
