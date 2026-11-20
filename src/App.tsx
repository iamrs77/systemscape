import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { useApp } from '@/store';
import { cx } from '@/ui/cx';
import { AboutDialog } from '@/ui/AboutDialog';
import { ChallengeCard, ChallengeList } from '@/ui/Challenges';
import { ControlBar } from '@/ui/ControlBar';
import { Inspector } from '@/ui/Inspector';
import { JourneyPanel } from '@/ui/JourneyPanel';
import { Overview } from '@/ui/Overview';
import { TopBar } from '@/ui/TopBar';
import { Tour } from '@/ui/Tour';
import { hasToured } from '@/ui/toured';
import { useMediaQuery } from '@/ui/useMediaQuery';

// three.js is most of the download: load it after the page shows
const Scene = lazy(() => import('@/scene/Scene'));

export function App() {
	const selected = useApp((s) => s.selected);
	const focused = useApp((s) => s.focused);
	const openDialog = useApp((s) => s.openDialog);
	// on small screens, details slide up over the map instead of sitting far below it
	const wide = useMediaQuery('(min-width: 1024px)');

	useEffect(() => {
		if (!hasToured()) openDialog('tour');
	}, [openDialog]);

	return (
		<div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
			<TopBar />
			<div
				className={cx(
					'flex min-h-0 flex-1 flex-col lg:grid',
					focused
						? 'lg:grid-cols-1'
						: 'lg:grid-cols-[280px_minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_340px] 2xl:grid-cols-[340px_minmax(0,1fr)_380px]',
				)}
			>
				<main className="flex min-h-0 flex-col lg:order-2">
					<div
						className="relative h-[62dvh] min-h-[380px] lg:h-auto lg:flex-1"
						data-tour="scene"
						role="region"
						aria-label="3D map of the system. Every part is also a button you can select."
					>
						<SceneBoundary>
							<Suspense fallback={<SceneMessage>Loading the 3D view…</SceneMessage>}>
								<Scene />
							</Suspense>
						</SceneBoundary>
					</div>
					<ControlBar />
				</main>
				<aside
					className={cx(
						'space-y-8 border-white/[0.06] px-4 py-5 lg:order-1 lg:overflow-y-auto lg:border-r',
						focused && 'lg:hidden',
					)}
					aria-label="Journeys and challenges"
				>
					<ChallengeCard />
					<div data-tour="journeys">
						<JourneyPanel />
					</div>
					<ChallengeList />
				</aside>
				<aside
					className={cx(
						'border-t border-white/[0.06] px-4 py-5 lg:order-3 lg:overflow-y-auto lg:border-t-0 lg:border-l',
						focused && 'lg:hidden',
					)}
					aria-label={selected && wide ? 'Selected part' : 'What’s happening'}
					data-tour="inspector"
				>
					{selected && wide ? <Inspector componentId={selected} /> : <Overview />}
				</aside>
				{selected && (!wide || focused) && (
					<div className="fixed inset-x-0 bottom-0 z-40 max-h-[62dvh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-slate-950/95 px-4 pt-4 pb-6 shadow-2xl backdrop-blur lg:inset-x-auto lg:top-16 lg:right-4 lg:bottom-auto lg:max-h-[calc(100dvh-6rem)] lg:w-[380px] lg:rounded-2xl lg:border">
						<Inspector componentId={selected} />
					</div>
				)}
			</div>
			<AboutDialog />
			<Tour />
		</div>
	);
}

function SceneMessage({ children }: { children: ReactNode }) {
	return (
		<div className="grid h-full place-items-center px-6 text-center text-sm text-slate-400">
			{children}
		</div>
	);
}

/** If the browser can't do 3D, say so: the panels still work without it. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
	override state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	override render() {
		if (this.state.failed) {
			return (
				<SceneMessage>
					Your browser couldn’t start the 3D view (it needs WebGL). The journeys, controls
					and challenges still work.
				</SceneMessage>
			);
		}
		return this.props.children;
	}
}
