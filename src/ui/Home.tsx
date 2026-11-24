import { useEffect, useMemo } from 'react';
import { Diagram, type EdgeLook } from '@/diagram/Diagram';
import { edgeKey, journeyComponents } from '@/diagram/layout';
import { lessonsOf, stepInput } from '@/learn/lessons';
import type { System } from '@/model/schema';
import { simulate } from '@/sim/engine';
import { lessonHref, systemHref } from '@/route';
import { startingJourney, useApp } from '@/store';
import { basics, systems } from '@/systems';
import { SectionTitle } from './controls';
import { ArrowIcon, GitHubIcon } from './icons';
import { Logo, REPO_URL } from './TopBar';

const TITLE = 'Systemscape: how big apps are built';

/** The front page: what Systemscape is, and the systems you can learn. */
export function Home() {
	useEffect(() => {
		document.title = TITLE;
	}, []);

	return (
		<div className="flex min-h-dvh flex-col">
			<header className="border-b border-slate-200 bg-card">
				<div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
					<span className="flex items-center gap-2 font-semibold tracking-tight">
						<Logo />
						Systemscape
					</span>
					<a
						href={REPO_URL}
						target="_blank"
						rel="noreferrer"
						className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 hover:text-ink"
					>
						<GitHubIcon width={15} height={15} />
						Source
					</a>
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
				<section className="max-w-3xl pt-10 pb-10 sm:pt-16 sm:pb-12">
					<h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
						Learn how big apps are built.
					</h1>
					<p className="mt-5 text-base text-pretty text-slate-600 sm:text-lg">
						Pick an app you use every day and look inside its backend, one step at a
						time. See what each part does, how a request moves between them, and what
						breaks when everyone uses the app at once.
					</p>
				</section>

				<section aria-labelledby="basics-title" className="mb-12">
					<SectionTitle id="basics-title">Start here: the basics</SectionTitle>
					<p className="mt-1 max-w-2xl text-sm text-slate-600">
						The ideas every system below is built from, one at a time, on a small shop
						app.
					</p>
					<ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{(basics.course ?? []).map((track, i) => (
							<li key={track.id}>
								<TrackCard
									number={i + 1}
									id={track.id}
									name={track.name}
									tagline={track.tagline}
								/>
							</li>
						))}
					</ul>
				</section>

				<section aria-labelledby="systems-title">
					<SectionTitle id="systems-title">Systems</SectionTitle>
					<ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{systems.map((system) => (
							<li key={system.id}>
								<SystemCard system={system} />
							</li>
						))}
					</ul>
				</section>
			</main>

			<footer className="border-t border-slate-200">
				<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-5 text-xs text-slate-500 sm:px-6">
					<p>
						Most of these are simplified designs, based on public talks and engineers’
						blog posts, not any company’s real system. Stockroom is the real design of
						my own app.
					</p>
					<a
						href={REPO_URL}
						target="_blank"
						rel="noreferrer"
						className="hover:text-ink sm:ml-auto"
					>
						Source on GitHub · MIT licence
					</a>
				</div>
			</footer>
		</div>
	);
}

/**
 * A track of the basics: a small
 * drawing of it, what it is, what's in the course, and how far you've got.
 */
function TrackCard({
	number,
	id,
	name,
	tagline,
}: {
	number: number;
	id: string;
	name: string;
	tagline: string;
}) {
	const lessons = lessonsOf(basics).filter((l) => l.track?.id === id);
	const learned = useApp(
		(s) => lessons.filter((l) => s.learned.includes(`${basics.id}/${l.id}`)).length,
	);
	const started = learned > 0;
	return (
		<article className="surface group relative flex h-full flex-col p-4 transition-shadow hover:shadow-md">
			<span
				className="grid size-7 place-items-center rounded-full border border-slate-200 bg-cyan-200 text-xs font-semibold"
				aria-hidden="true"
			>
				{number}
			</span>
			<h3 className="mt-3 text-sm font-semibold">
				{/* the whole card is the link: this stretches it over the card */}
				<a
					href={lessonHref(basics.id, lessons[0]!.id)}
					className="after:absolute after:inset-0 after:rounded-[16px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-cyan-600"
				>
					{name}
				</a>
			</h3>
			<p className="mt-0.5 flex-1 text-sm text-slate-600">{tagline}</p>
			<p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
				<span>
					{started
						? `${learned} of ${lessons.length} lessons done`
						: `${lessons.length} lessons`}
				</span>
				<span
					className="ml-auto inline-flex items-center gap-1 font-medium text-cyan-700"
					aria-hidden="true"
				>
					{started ? 'Continue' : 'Start'}
					<ArrowIcon
						width={12}
						height={12}
						className="transition-transform group-hover:translate-x-0.5"
					/>
				</span>
			</p>
		</article>
	);
}

function SystemCard({ system }: { system: System }) {
	const lessons = lessonsOf(system);
	const learned = useApp(
		(s) => s.learned.filter((key) => key.startsWith(`${system.id}/`)).length,
	);
	const started = learned > 0;

	const preview = useMemo(() => {
		const journey = startingJourney(system);
		return {
			result: simulate(system, stepInput(system, undefined)),
			journeyId: journey.id,
			focus: journeyComponents(system, journey.id),
			edges: new Map<string, EdgeLook>(
				journey.hops.map((h) => [edgeKey(h.from, h.to), 'flow']),
			),
		};
	}, [system]);

	return (
		<article className="surface group relative flex h-full items-center gap-4 p-4 transition-shadow hover:shadow-md sm:block">
			<div className="diagram-bg h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-100 p-1 sm:h-24 sm:w-full">
				<Diagram
					system={system}
					result={preview.result}
					edges={preview.edges}
					journeyId={preview.journeyId}
					focus={preview.focus}
					bare
					title={`${system.name}, drawn as a diagram`}
				/>
			</div>
			<div className="min-w-0 sm:mt-3">
				<h3 className="text-sm font-semibold">
					{/* the whole card is the link: this stretches it over the card */}
					<a
						href={systemHref(system.id)}
						className="after:absolute after:inset-0 after:rounded-[16px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-cyan-600"
					>
						{system.name}
					</a>
				</h3>
				<p className="mt-0.5 text-sm text-slate-600">{system.tagline}</p>
				<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
					<span>
						{started
							? `${learned} of ${lessons.length} lessons done`
							: `${lessons.length} lessons · ${system.components.length} parts${system.basis === 'real' ? ' · real design' : ''}`}
					</span>
					<span
						className="ml-auto inline-flex items-center gap-1 font-medium text-cyan-700"
						aria-hidden="true"
					>
						{started ? 'Continue' : 'Start learning'}
						<ArrowIcon
							width={12}
							height={12}
							className="transition-transform group-hover:translate-x-0.5"
						/>
					</span>
				</p>
			</div>
		</article>
	);
}
