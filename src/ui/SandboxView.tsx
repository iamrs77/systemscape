import { useRef, useState } from 'react';
import { feelOfMs, feelOfShare, formatMs, formatRps, formatShare, perMinute } from '@/sim/format';
import { useApp, useSystem } from '@/store';
import { DiagramFrame, Facts, FrameButton } from './bits';
import { ControlBar } from './ControlBar';
import { cx } from './cx';
import { useFullScreen } from './fullScreen';
import { WhatsHappening } from './Happening';
import { Inspector } from './Inspector';
import { PanelIcon } from './icons';
import { JourneyPanel } from './JourneyPanel';
import { LiveDiagram } from './LiveDiagram';

/**
 * Exploring freely: the live diagram with everything you can change below it,
 * and beside it what's happening, with a fix to try for each problem. It can
 * fill the screen, the panel beside it too, or not.
 */
export function SandboxView() {
	const system = useSystem();
	const selected = useApp((s) => s.selected);
	const journeyId = useApp((s) => s.journeyId);
	const result = useApp((s) => s.result);
	const followed = system.journeys.find((j) => j.id === journeyId);
	const state = followed ? result.journeys[followed.id] : undefined;
	const stage = useRef<HTMLDivElement>(null);
	const { full, toggle } = useFullScreen(stage);
	const [panel, setPanel] = useState(true);

	return (
		// on the page, the two parts sit in its columns; on the whole screen, in their own
		<div
			ref={stage}
			className={
				full
					? cx(
							'fixed inset-0 z-40 space-y-3 overflow-y-auto bg-paper p-2 sm:p-3',
							'lg:grid lg:grid-rows-[minmax(0,1fr)] lg:gap-3 lg:space-y-0 lg:overflow-hidden',
							panel
								? 'lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]'
								: 'lg:grid-cols-[minmax(0,1fr)]',
						)
					: 'contents'
			}
		>
			<main className="flex min-h-0 flex-col gap-3" aria-labelledby="sandbox-title">
				{/* the course beside it already says where you are */}
				<h1 id="sandbox-title" className="sr-only">
					Explore freely
				</h1>
				<DiagramFrame
					fill={{ full, toggle }}
					controls={<ControlBar />}
					tools={
						full && (
							<FrameButton
								icon={<PanelIcon width={12} height={12} />}
								label={panel ? 'Hide side panel' : 'Show side panel'}
								title={`${panel ? 'Hide' : 'Show'} what’s happening and the journeys`}
								onClick={() => setPanel(!panel)}
							/>
						)
					}
					over={
						state && (
							<Facts
								facts={[
									{
										label: followed!.name,
										value: formatRps(state.rps),
										hint: perMinute(state.rps),
									},
									{
										label: 'Succeed',
										value: formatShare(state.success),
										hint: feelOfShare(state.success),
									},
									{
										label: 'Wait',
										value: formatMs(state.latencyMs),
										hint: feelOfMs(state.latencyMs),
									},
								]}
							/>
						)
					}
				>
					<LiveDiagram />
				</DiagramFrame>
			</main>

			{(!full || panel) && (
				<aside
					className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto"
					aria-label="Details"
				>
					<WhatsHappening />
					<div className="surface p-4">
						{selected ? <Inspector componentId={selected} /> : <JourneyPanel />}
					</div>
				</aside>
			)}
		</div>
	);
}
