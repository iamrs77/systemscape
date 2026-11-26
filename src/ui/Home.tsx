import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Diagram, type EdgeLook } from '@/diagram/Diagram';
import { edgeKey, journeyComponents } from '@/diagram/layout';
import { lessonsOf, stepInput } from '@/learn/lessons';
import type { System } from '@/model/schema';
import { simulate } from '@/sim/engine';
import { lessonHref, systemHref } from '@/route';
import { startingJourney, useApp } from '@/store';
import { allSystems, basics, systems } from '@/systems';
import { ArrowIcon, CheckIcon, GitHubIcon } from './icons';
import { systemColor, trackColor } from './palette';
import { SystemPoster } from './posters';
import { Logo, REPO_URL } from './TopBar';
import { useMediaQuery } from './useMediaQuery';

const TITLE = 'Systemscape: how big apps are built';

/** The front page: what Systemscape is, and the systems you can learn. */
export function Home() {
	useEffect(() => {
		document.title = TITLE;
	}, []);
	const lessonCount = useMemo(
		() => allSystems.reduce((n, system) => n + lessonsOf(system).length, 0),
		[],
	);

	return (
		<div className="isolate flex min-h-dvh flex-col overflow-x-clip">
			<header className="app-bar">
				<div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pt-3 pb-2.5 sm:px-6">
					<span className="flex items-center gap-2.5 font-display text-[18px] font-bold tracking-tight">
						<Logo />
						Systemscape
					</span>
					<nav
						aria-label="On this page"
						className="ml-auto flex items-center gap-1 text-sm"
					>
						<JumpTo target="fundamentals">Fundamentals</JumpTo>
						<JumpTo target="systems">Systems</JumpTo>
						<a
							href={REPO_URL}
							target="_blank"
							rel="noreferrer"
							className="ml-1 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
						>
							<GitHubIcon width={14} height={14} />
							Source
						</a>
					</nav>
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
				<section className="relative max-w-3xl pt-12 pb-12 sm:pt-20 sm:pb-16">
					<div className="hero-glow" aria-hidden="true" />
					<p className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
						<span
							className="live-dot size-2 rounded-full bg-emerald-500"
							aria-hidden="true"
						/>
						Live simulations · {lessonCount} lessons · {systems.length} systems
					</p>
					<h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
						Learn how <span className="text-shimmer">big apps</span> are built.
					</h1>
					<p className="mt-5 text-base text-pretty text-slate-600 sm:text-lg">
						Pick an app you use every day and look inside its backend, one step at a
						time. See what each part does, how a request moves between them, and what
						breaks when everyone uses the app at once.
					</p>
				</section>

				<section
					id="fundamentals"
					aria-labelledby="fundamentals-title"
					className="mb-16 scroll-mt-24"
				>
					<Heading id="fundamentals-title" eyebrow="Start here">
						The fundamentals
					</Heading>
					<p className="mt-1.5 max-w-2xl text-sm text-slate-600">
						The ideas every system below is built from, one at a time, on a small shop
						app.
					</p>
					<FundamentalsPath />
				</section>

				<section id="systems" aria-labelledby="systems-title" className="scroll-mt-24">
					<Heading id="systems-title" eyebrow="Then look inside">
						Systems
					</Heading>
					<p className="mt-1.5 max-w-2xl text-sm text-slate-600">
						Apps you know, opened up: watch requests flow, push the traffic, break
						things.
					</p>
					<ul className="mt-6 grid gap-6 sm:grid-cols-2">
						{systems.map((system, i) => (
							<li key={system.id}>
								<SystemCard system={system} color={systemColor(system.id, i)} />
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

/** A link in the header that scrolls down to a section of the page. */
function JumpTo({ target, children }: { target: string; children: ReactNode }) {
	return (
		<button
			type="button"
			onClick={() =>
				document.getElementById(target)?.scrollIntoView({
					behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
						? 'auto'
						: 'smooth',
				})
			}
			className="hidden rounded-lg px-2.5 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink sm:block"
		>
			{children}
		</button>
	);
}

/** A section heading with a small coloured line above it. */
function Heading({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
	return (
		<>
			<p className="text-xs font-semibold tracking-[0.14em] text-cyan-700 uppercase">
				{eyebrow}
			</p>
			<h2 id={id} className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
				{children}
			</h2>
		</>
	);
}

type Box = { x: number; y: number; w: number; h: number };

/**
 * The line from one step to the next. Steps in a row are joined straight;
 * at the end of a row it bends out past the card and back into the next row.
 */
function link(a: Box, b: Box, turn: 'left' | 'right' | null) {
	const ax = a.x + a.w / 2;
	const ay = a.y + a.h / 2;
	const bx = b.x + b.w / 2;
	const by = b.y + b.h / 2;
	if (!turn) return `M${ax} ${ay}L${bx} ${by}`;
	const out = 14;
	const x = turn === 'right' ? Math.max(a.x + a.w, b.x + b.w) + out : Math.min(a.x, b.x) - out;
	const back = turn === 'right' ? -1 : 1;
	const r = Math.min(20, (by - ay) / 2);
	return `M${ax} ${ay}H${x + back * r}Q${x} ${ay} ${x} ${ay + r}V${by - r}Q${x} ${by} ${x + back * r} ${by}H${bx}`;
}

/**
 * The fundamentals as a winding path: each row runs the other way from the
 * one above, and a dotted line carries you from one track to the next.
 */
function FundamentalsPath() {
	const tracks = basics.course ?? [];
	const wide = useMediaQuery('(min-width: 1024px)');
	const mid = useMediaQuery('(min-width: 640px)');
	const cols = wide ? 4 : mid ? 2 : 1;
	const listRef = useRef<HTMLOListElement>(null);
	const [boxes, setBoxes] = useState<Box[]>([]);
	const uid = useId().replace(/[^\w-]/g, '');

	useLayoutEffect(() => {
		const list = listRef.current;
		if (!list) return;
		const items = [...list.children] as HTMLElement[];
		const measure = () => {
			const base = list.getBoundingClientRect();
			setBoxes(
				items.map((el) => {
					const r = el.getBoundingClientRect();
					return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
				}),
			);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(list);
		items.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [cols, tracks.length]);

	const place = (i: number) => {
		const row = Math.floor(i / cols);
		const pos = i % cols;
		return { row, col: row % 2 === 0 ? pos : cols - 1 - pos };
	};

	const links =
		boxes.length === tracks.length
			? boxes.slice(0, -1).map((a, i) => {
					const b = boxes[i + 1]!;
					const row = place(i).row;
					const turn = row === place(i + 1).row ? null : row % 2 === 0 ? 'right' : 'left';
					return {
						d: link(a, b, turn),
						from: { x: a.x + a.w / 2, y: a.y + a.h / 2 },
						to: { x: b.x + b.w / 2, y: b.y + b.h / 2 },
					};
				})
			: [];

	return (
		<div className="relative mt-6">
			<svg
				className="pointer-events-none absolute inset-0 size-full overflow-visible"
				aria-hidden="true"
			>
				<defs>
					{links.map((l, i) => (
						<linearGradient
							key={i}
							id={`${uid}-${i}`}
							gradientUnits="userSpaceOnUse"
							x1={l.from.x}
							y1={l.from.y}
							x2={l.to.x}
							y2={l.to.y}
						>
							<stop offset="0" stopColor={trackColor(i)} />
							<stop offset="1" stopColor={trackColor(i + 1)} />
						</linearGradient>
					))}
				</defs>
				{links.map((l, i) => (
					<g key={i} fill="none" strokeLinecap="round" stroke={`url(#${uid}-${i})`}>
						<path d={l.d} strokeWidth={10} strokeOpacity={0.16} />
						<path
							d={l.d}
							strokeWidth={4}
							strokeDasharray="0 14"
							className="snake-flow"
						/>
					</g>
				))}
			</svg>
			<ol
				ref={listRef}
				className="relative grid gap-x-10 gap-y-8 px-6"
				// every row as tall as the tallest, so all the steps are one size
				style={{
					gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
					gridAutoRows: '1fr',
				}}
			>
				{tracks.map((track, i) => {
					const { row, col } = place(i);
					return (
						<li key={track.id} style={{ gridRow: row + 1, gridColumn: col + 1 }}>
							<TrackStep
								number={i + 1}
								id={track.id}
								name={track.name}
								color={trackColor(i)}
							/>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

/** One track on the path: its number, its name, and how far you've got. */
function TrackStep({
	number,
	id,
	name,
	color,
}: {
	number: number;
	id: string;
	name: string;
	color: string;
}) {
	const lessons = lessonsOf(basics).filter((l) => l.track?.id === id);
	const learned = useApp(
		(s) => lessons.filter((l) => s.learned.includes(`${basics.id}/${l.id}`)).length,
	);
	const started = learned > 0;
	const done = lessons.length > 0 && learned === lessons.length;
	return (
		<article
			className="track-card group relative flex h-full items-center gap-3.5 p-4"
			style={{ '--tc': color } as CSSProperties}
		>
			<span
				className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-(--tc) font-display text-lg font-bold text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-6"
				aria-hidden="true"
			>
				{done ? <CheckIcon width={18} height={18} /> : number}
			</span>
			<div className="min-w-0 flex-1">
				<h3 className="text-[15px] leading-snug font-semibold">
					{/* the whole card is the link: this stretches it over the card */}
					<a
						href={lessonHref(basics.id, lessons[0]!.id)}
						className="after:absolute after:inset-0 after:rounded-[18px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-cyan-600"
					>
						{name}
					</a>
				</h3>
				<p className="mt-0.5 text-xs text-slate-500">
					{started ? `${learned} of ${lessons.length} done` : `${lessons.length} lessons`}
				</p>
				{started && !done && (
					<div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200/70">
						<div
							className="h-full rounded-full bg-(--tc)"
							style={{ width: `${(learned / lessons.length) * 100}%` }}
						/>
					</div>
				)}
			</div>
			<ArrowIcon
				width={14}
				height={14}
				aria-hidden="true"
				className="shrink-0 text-(--tc) opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
			/>
		</article>
	);
}

/** A system: a big live drawing of it, its name, and how far you've got. */
function SystemCard({ system, color }: { system: System; color: string }) {
	const lessons = lessonsOf(system);
	const learned = useApp(
		(s) => s.learned.filter((key) => key.startsWith(`${system.id}/`)).length,
	);
	const started = learned > 0;

	return (
		<article
			className="system-card group relative flex h-full flex-col overflow-hidden"
			style={{ '--tc': color } as CSSProperties}
		>
			<div className="relative h-44 overflow-hidden border-b border-(--tc)/15 sm:h-52">
				<div className="size-full transition-transform duration-500 group-hover:scale-[1.04]">
					<SystemPoster id={system.id} fallback={<DiagramPreview system={system} />} />
				</div>
				{system.basis === 'real' && (
					<span className="absolute top-3 left-3 rounded-full bg-(--tc) px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
						Real design
					</span>
				)}
			</div>
			<div className="flex flex-1 flex-col p-5">
				<h3 className="text-xl font-bold tracking-tight">
					{/* the whole card is the link: this stretches it over the card */}
					<a
						href={systemHref(system.id)}
						className="after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-cyan-600"
					>
						{system.name}
					</a>
				</h3>
				<p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{system.tagline}</p>
				<div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
					<span className="rounded-full bg-(--tc)/10 px-2.5 py-1 font-semibold text-(--tc-ink)">
						{lessons.length} lessons
					</span>
					<span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
						{system.components.length} parts
					</span>
					<span
						className="ml-auto inline-flex items-center gap-1 font-semibold text-(--tc-ink)"
						aria-hidden="true"
					>
						{started ? 'Continue' : 'Start learning'}
						<ArrowIcon
							width={12}
							height={12}
							className="transition-transform group-hover:translate-x-0.5"
						/>
					</span>
				</div>
				{started && (
					<div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
						<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/70">
							<div
								className="h-full rounded-full bg-(--tc)"
								style={{ width: `${(learned / lessons.length) * 100}%` }}
							/>
						</div>
						{learned} of {lessons.length} done
					</div>
				)}
			</div>
		</article>
	);
}

/** A small live drawing of a system, for one without a poster. */
function DiagramPreview({ system }: { system: System }) {
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
		<div className="system-stage size-full p-3">
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
	);
}
