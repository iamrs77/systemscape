import { useEffect, useMemo } from 'react';
import { Diagram, type EdgeLook } from '@/diagram/Diagram';
import { project, toPoints } from '@/diagram/geometry';
import { edgeKey, journeyComponents } from '@/diagram/layout';
import { lessonsOf, stepInput } from '@/learn/lessons';
import type { System } from '@/model/schema';
import { simulate } from '@/sim/engine';
import { systemHref } from '@/route';
import { startingJourney, useApp } from '@/store';
import { comingSoon, systems } from '@/systems';
import { SectionTitle } from './controls';
import { ArrowIcon, GitHubIcon } from './icons';
import { Logo, REPO_URL } from './TopBar';

const TITLE = 'Systemscape: how big apps are built';

const how = [
	{
		title: 'Learn',
		text: 'First, see what each part does, one row at a time. Then follow what people do in the app, step by step, and see where the time goes.',
	},
	{
		title: 'See it break',
		text: 'Each lesson ends on a busy night. See what slows down, what fails, and how one failure spreads to other parts.',
	},
	{
		title: 'Fix it yourself',
		text: 'In Explore freely, turn the traffic up and switch safety features on and off. When something breaks, the app tells you why and offers a fix to try.',
	},
];

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

				<section aria-labelledby="coming-title" className="mt-12">
					<SectionTitle id="coming-title">Coming soon</SectionTitle>
					<ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{comingSoon.map((s) => (
							<li
								key={s.name}
								className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-400 p-4 sm:block"
							>
								<EmptyPlot />
								<div>
									<p className="text-sm font-semibold sm:mt-3">{s.name}</p>
									<p className="mt-0.5 text-sm text-slate-600">{s.tagline}</p>
								</div>
							</li>
						))}
					</ul>
				</section>

				<section aria-labelledby="how-title" className="mt-14">
					<SectionTitle id="how-title">How it works</SectionTitle>
					<ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{how.map((step, i) => (
							<li key={step.title} className="surface p-4">
								<span
									className="grid size-7 place-items-center rounded-full border border-slate-200 bg-cyan-200 text-xs font-semibold"
									aria-hidden="true"
								>
									{i + 1}
								</span>
								<h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
								<p className="mt-1 text-sm text-slate-600">{step.text}</p>
							</li>
						))}
					</ol>
				</section>
			</main>

			<footer className="border-t border-slate-200">
				<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-5 text-xs text-slate-500 sm:px-6">
					<p>
						These are simplified designs, based on public talks and engineers’ blog
						posts. They are not any company’s real system.
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
 * A system you can learn, the same size as one still to come: a small
 * drawing of it, what it is, what's in the course, and how far you've got.
 */
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
							: `${lessons.length} lessons · ${system.components.length} parts`}
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

/** For a system still being built: an empty plot, its lots marked out. */
function EmptyPlot() {
	const corner = (x: number, z: number) => project(x, z);
	const plot = [corner(-6, -4), corner(6, -4), corner(6, 4), corner(-6, 4)];
	const lots = [-3.5, 0, 3.5].flatMap((x) => [-1.7, 1.7].map((z) => [x, z] as const));
	return (
		<svg
			viewBox="-7.6 -4.6 15.2 8.2"
			className="h-14 w-24 shrink-0 sm:h-20 sm:w-full"
			aria-hidden="true"
		>
			<polygon
				points={toPoints(plot)}
				fill="#eef1f7"
				stroke="#a3acbf"
				strokeWidth="0.1"
				strokeDasharray="0.4 0.3"
			/>
			{lots.map(([x, z]) => (
				<polygon
					key={`${x},${z}`}
					points={toPoints([
						corner(x - 1.2, z - 1.1),
						corner(x + 1.2, z - 1.1),
						corner(x + 1.2, z + 1.1),
						corner(x - 1.2, z + 1.1),
					])}
					fill="#f8fafc"
					stroke="#b8c0d0"
					strokeWidth="0.08"
					strokeDasharray="0.3 0.25"
				/>
			))}
		</svg>
	);
}
