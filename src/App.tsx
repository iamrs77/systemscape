import { useEffect, useLayoutEffect } from 'react';
import { useRoute, type Mode } from '@/route';
import { useApp, useSystem } from '@/store';
import { AboutDialog } from '@/ui/AboutDialog';
import { CourseNav } from '@/ui/CourseNav';
import { WordMeaning } from '@/ui/Explained';
import { GlossaryDialog } from '@/ui/GlossaryDialog';
import { Home } from '@/ui/Home';
import { LessonView } from '@/ui/LessonView';
import { SandboxView } from '@/ui/SandboxView';
import { TopBar } from '@/ui/TopBar';
import { cx } from '@/ui/cx';
import { ChevronIcon } from '@/ui/icons';

/** The home page, or the system the URL names. */
export function App() {
	const route = useRoute();
	const page = route.page === 'system' ? `${route.systemId}/${route.mode.kind}` : 'home';

	// a new page starts at its top, not wherever the last one was scrolled to
	useLayoutEffect(() => {
		window.scrollTo(0, 0);
	}, [page]);

	return route.page === 'system' ? (
		<Explorer systemId={route.systemId} mode={route.mode} />
	) : (
		<Home />
	);
}

/** One system: the course beside it, and a lesson or the sandbox. */
function Explorer({ systemId, mode }: { systemId: string; mode: Mode }) {
	const system = useSystem();
	const selectSystem = useApp((s) => s.selectSystem);
	const wide = useApp((s) => s.wide);
	const toggleWide = useApp((s) => s.toggleWide);
	const ready = system.id === systemId;

	// the URL says which system; the app's state follows it
	useLayoutEffect(() => {
		if (!ready) selectSystem(systemId);
	}, [ready, systemId, selectSystem]);

	useEffect(() => {
		document.title = `${system.name} · Systemscape`;
	}, [system.name]);

	return (
		<div className="flex min-h-dvh flex-col lg:h-dvh">
			<TopBar />
			{ready && (
				<div
					className={cx(
						'relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[var(--left)_minmax(0,1fr)_var(--right)]',
						// the side panels as they start, or widened
						wide.left
							? '[--left:340px] xl:[--left:400px]'
							: '[--left:240px] xl:[--left:260px]',
						wide.right
							? '[--right:520px] xl:[--right:600px]'
							: '[--right:340px] xl:[--right:380px]',
					)}
				>
					<CourseNav mode={mode} />
					{mode.kind === 'learn' ? (
						<LessonView key={mode.lessonId} lessonId={mode.lessonId} step={mode.step} />
					) : (
						<SandboxView />
					)}
					<PanelHandle side="left" wide={wide.left} onToggle={() => toggleWide('left')} />
					<PanelHandle
						side="right"
						wide={wide.right}
						onToggle={() => toggleWide('right')}
					/>
				</div>
			)}
			<AboutDialog />
			<GlossaryDialog />
			<WordMeaning />
		</div>
	);
}

/**
 * A small button in the gap beside a side panel, on wide screens: it widens
 * the panel, and puts it back. The chevron points the way the edge will move.
 */
function PanelHandle({
	side,
	wide,
	onToggle,
}: {
	side: 'left' | 'right';
	wide: boolean;
	onToggle(): void;
}) {
	const panel = side === 'left' ? 'the course list' : 'the side panel';
	// the left panel grows rightwards, the right one leftwards
	const pointsRight = side === 'left' ? !wide : wide;
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-pressed={wide}
			aria-label={wide ? `Narrow ${panel}` : `Widen ${panel}`}
			title={wide ? `Narrow ${panel}` : `Widen ${panel}`}
			style={
				side === 'left'
					? { left: 'calc(var(--left) + 24px)' }
					: { right: 'calc(var(--right) + 24px)' }
			}
			className={cx(
				'absolute top-1/2 z-20 hidden h-10 w-5 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-ink lg:grid',
				side === 'left' ? '-translate-x-1/2' : 'translate-x-1/2',
			)}
		>
			<ChevronIcon
				width={14}
				height={14}
				className={pointsRight ? '-rotate-90' : 'rotate-90'}
			/>
		</button>
	);
}
