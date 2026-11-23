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
import { basisLabel } from '@/theme';
import { Facts } from './bits';
import { buttonSizes, buttonVariants } from './buttonStyles';
import { Badge, SectionTitle } from './controls';
import { cx } from './cx';
import { ArrowIcon, GitHubIcon } from './icons';
import { Logo, REPO_URL } from './TopBar';

const TITLE = 'Systemscape: how big apps are built';

const how = [
	{
		title: 'Learn',
		text: 'Start with the big picture: what each part is for, a row at a time. Then follow what people do in the app, one call at a time, and see where the time goes.',
	},
	{
		title: 'Push it',
		text: 'Each lesson ends on a busy night: see what slows down, what fails, and how the failure spreads from part to part.',
	},
	{
		title: 'Fix it',
		text: 'Challenges break something the way it happens in real life. Add copies, switch on circuit breakers, and the goal is checked as you go.',
	},
	{
		title: 'Explore',
		text: 'In the sandbox, change anything: traffic, copies, retries, which parts are up. Every number is worked out as you change it.',
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
						Pick an app you use every day and take its backend apart, one step at a
						time: what each part does, how a request travels through them, and what
						breaks when everyone shows up at once.
					</p>
				</section>

				<section aria-labelledby="systems-title">
					<SectionTitle id="systems-title">Systems</SectionTitle>
					<ul className="mt-3 space-y-5">
						{systems.map((system) => (
							<li key={system.id}>
								<SystemCard system={system} />
							</li>
						))}
					</ul>
				</section>

				<section aria-labelledby="coming-title" className="mt-12">
					<SectionTitle id="coming-title">Coming soon</SectionTitle>
					<ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
					<ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
						Simplified designs, based on public talks and engineering posts: not any
						company’s actual system.
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

/** A system you can learn: a drawing of it, what it is, what's in the course, and how far you've got. */
function SystemCard({ system }: { system: System }) {
	const lessons = lessonsOf(system);
	const learned = useApp(
		(s) => s.learned.filter((key) => key.startsWith(`${system.id}/`)).length,
	);
	const solved = useApp((s) => s.solved.filter((key) => key.startsWith(`${system.id}/`)).length);
	const started = learned + solved > 0;

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
		<article className="surface group relative grid overflow-hidden lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
			<div className="diagram-bg aspect-[16/11] border-b border-slate-200 p-3 lg:aspect-auto lg:min-h-96 lg:border-r lg:border-b-0">
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
			<div className="flex flex-col p-5 sm:p-7">
				<div>
					<Badge>{basisLabel[system.basis]}</Badge>
				</div>
				<h3 className="mt-3 text-2xl font-semibold tracking-tight">
					{/* the whole card is the link: this stretches it over the card */}
					<a
						href={systemHref(system.id)}
						className="after:absolute after:inset-0 after:rounded-[14px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-cyan-600"
					>
						{system.name}
					</a>
				</h3>
				<p className="mt-2 text-slate-600">{system.tagline}</p>
				<div className="mt-5">
					<Facts
						facts={[
							{ label: 'Lessons', value: String(lessons.length) },
							{ label: 'Challenges', value: String(system.challenges.length) },
							{ label: 'Parts', value: String(system.components.length) },
						]}
					/>
				</div>
				<ol className="mt-5 space-y-1 text-sm text-slate-600">
					{lessons.slice(0, 4).map((lesson, i) => (
						<li key={lesson.id} className="flex gap-2">
							<span className="text-slate-400">{String(i + 1).padStart(2, '0')}</span>
							{lesson.title}
						</li>
					))}
					{lessons.length > 4 && (
						<li className="pl-7 text-slate-400">and {lessons.length - 4} more</li>
					)}
				</ol>
				{started && (
					<p className="mt-4 text-xs text-cyan-700">
						{learned} of {lessons.length} lessons, {solved} of{' '}
						{system.challenges.length} challenges done
					</p>
				)}
				<span
					className={cx(
						'mt-auto inline-flex items-center gap-1.5 self-start rounded-lg pt-0',
						buttonSizes.md,
						buttonVariants.primary,
						'mt-6',
					)}
					aria-hidden="true"
				>
					{started ? 'Carry on' : 'Start learning'}
					<ArrowIcon
						width={14}
						height={14}
						className="transition-transform group-hover:translate-x-0.5"
					/>
				</span>
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
