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

/** One system: the course beside it, and a lesson, a challenge or the sandbox. */
function Explorer({ systemId, mode }: { systemId: string; mode: Mode }) {
	const system = useSystem();
	const selectSystem = useApp((s) => s.selectSystem);
	const challengeId = useApp((s) => s.challengeId);
	const startChallenge = useApp((s) => s.startChallenge);
	const leaveChallenge = useApp((s) => s.leaveChallenge);
	const wantedChallenge = mode.kind === 'practice' ? mode.challengeId : null;
	const ready = system.id === systemId && challengeId === wantedChallenge;

	// the URL says which system and which challenge; the app's state follows it
	useLayoutEffect(() => {
		if (system.id !== systemId) selectSystem(systemId);
		else if (wantedChallenge && challengeId !== wantedChallenge)
			startChallenge(wantedChallenge);
		else if (!wantedChallenge && challengeId) leaveChallenge();
	}, [
		system.id,
		systemId,
		wantedChallenge,
		challengeId,
		selectSystem,
		startChallenge,
		leaveChallenge,
	]);

	useEffect(() => {
		document.title = `${system.name} · Systemscape`;
	}, [system.name]);

	return (
		<div className="flex min-h-dvh flex-col lg:h-dvh">
			<TopBar />
			{ready && (
				<div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[240px_minmax(0,1fr)_340px] xl:grid-cols-[260px_minmax(0,1fr)_380px]">
					<CourseNav mode={mode} />
					{mode.kind === 'learn' ? (
						<LessonView key={mode.lessonId} lessonId={mode.lessonId} step={mode.step} />
					) : (
						<SandboxView />
					)}
				</div>
			)}
			<AboutDialog />
			<GlossaryDialog />
			<WordMeaning />
		</div>
	);
}
