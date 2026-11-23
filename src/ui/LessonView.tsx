import { useEffect } from 'react';
import { Diagram } from '@/diagram/Diagram';
import { annotate, namesOf } from '@/learn/glossary';
import { lessonsOf, stepResult, type LessonStep, type Tone } from '@/learn/lessons';
import type { SimResult } from '@/sim/engine';
import { formatMs } from '@/sim/format';
import { exploreHref, lessonHref, practiceHref, replaceRoute } from '@/route';
import { useApp, useSystem } from '@/store';
import { kindLabel } from '@/theme';
import { Callout, DiagramFrame, Facts } from './bits';
import { Explained } from './Explained';
import { buttonSizes, buttonVariants } from './buttonStyles';
import { Button } from './controls';
import { cx } from './cx';
import { ArrowIcon } from './icons';

/** A lesson: the diagram and its numbers in the middle, the step explained beside it. */
export function LessonView({ lessonId, step: asked }: { lessonId: string; step: number }) {
	const system = useSystem();
	const lessons = lessonsOf(system);
	const index = Math.max(
		0,
		lessons.findIndex((l) => l.id === lessonId),
	);
	const lesson = lessons[index]!;
	const step = Math.min(asked, lesson.steps.length - 1);
	const current = lesson.steps[step]!;
	const last = step === lesson.steps.length - 1;
	const nextLesson = lessons[index + 1];
	const selected = useApp((s) => s.selected);
	const select = useApp((s) => s.select);
	const paused = useApp((s) => s.paused);
	const markLearned = useApp((s) => s.markLearned);

	// the diagram runs an ordinary day, or the step's scenario
	const result = stepResult(system, current.presetId);
	const edges = new Map(current.edges);
	const focus = current.focus ? new Set(current.focus) : null;

	const go = (to: number) => replaceRoute(lessonHref(system.id, lesson.id, to));
	const nextHref = nextLesson ? lessonHref(system.id, nextLesson.id) : exploreHref(system.id);

	// reaching the last step finishes the lesson
	useEffect(() => {
		if (last) markLearned(lesson.id);
	}, [last, lesson.id, markLearned]);

	// each step starts with nothing selected
	useEffect(() => {
		select(null);
	}, [lesson.id, step, select]);

	// the arrow keys move between steps
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
			if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
			if (event.key === 'ArrowRight') {
				if (last) window.location.hash = nextHref;
				else replaceRoute(lessonHref(system.id, lesson.id, step + 1));
			} else if (event.key === 'ArrowLeft' && step > 0) {
				replaceRoute(lessonHref(system.id, lesson.id, step - 1));
			}
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [system.id, lesson.id, step, last, nextHref]);

	return (
		<>
			<main className="flex min-h-0 flex-col gap-3" aria-labelledby="lesson-title">
				<header className="flex flex-wrap items-end gap-x-4 gap-y-2 px-1">
					<div className="min-w-0 flex-1">
						<p className="text-xs text-slate-500">
							Lesson {index + 1} of {lessons.length}
						</p>
						<h1
							id="lesson-title"
							className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl"
						>
							{lesson.title}
						</h1>
						<p className="mt-1 text-sm text-slate-600">{lesson.summary}</p>
					</div>
					<span className="rounded-full border border-slate-200 bg-card px-2.5 py-0.5 text-xs">
						{lesson.steps.length} steps
					</span>
				</header>

				<DiagramFrame over={<Facts facts={current.facts} />}>
					<Diagram
						system={system}
						result={result}
						edges={edges}
						journeyId={current.journeyId}
						focus={focus}
						zoom={focus}
						selected={selected}
						onSelect={select}
						detail={current.presetId ? 'load' : 'none'}
						badges={current.showCopies ?? false}
						paused={paused}
						title={`${system.name}: ${current.title}. Every part is a button.`}
					/>
				</DiagramFrame>
			</main>

			<aside className="flex min-h-0 flex-col gap-3" aria-label="This step">
				{selected ? (
					<PartAbout id={selected} result={result} onBack={() => select(null)} />
				) : (
					<StepCard
						step={current}
						number={step}
						count={lesson.steps.length}
						result={result}
						onBack={() => go(step - 1)}
						onNext={() => go(step + 1)}
						nextHref={last ? nextHref : null}
						nextLabel={
							nextLesson ? `Next lesson: ${nextLesson.title}` : 'Explore freely'
						}
						onAbout={select}
					/>
				)}
			</aside>
		</>
	);
}

const toneClass: Record<Tone, string> = {
	plain: 'border-slate-300 bg-card text-slate-700',
	wait: 'border-orange-300 bg-orange-50 text-orange-900',
	background: 'border-violet-300 bg-violet-50 text-violet-900',
	warn: 'border-red-300 bg-red-50 text-red-900',
};

function StepCard({
	step,
	number,
	count,
	result,
	onBack,
	onNext,
	nextHref,
	nextLabel,
	onAbout,
}: {
	step: LessonStep;
	number: number;
	count: number;
	result: SimResult;
	onBack(): void;
	onNext(): void;
	/** On the last step: where Next goes. */
	nextHref: string | null;
	nextLabel: string;
	onAbout(id: string): void;
}) {
	const system = useSystem();
	const about = system.components.find((c) => c.id === step.about);
	const action = step.action;
	// the step's words that need explaining, underlined the first time each appears
	const annotated = annotate(
		[...step.body, step.goodToKnow?.text ?? '', step.whenItFails ?? ''],
		namesOf(system),
	);
	const body = annotated.slice(0, step.body.length);
	const [goodToKnow, whenItFails] = annotated.slice(step.body.length);

	return (
		<section
			aria-labelledby="step-title"
			className="surface flex flex-col overflow-hidden lg:min-h-0 lg:flex-1"
		>
			{/* the explanation scrolls; Back and Next stay where they are */}
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 pb-2">
				<p className="text-xs tracking-wider text-slate-500 uppercase">
					Step {number + 1} of {count}
				</p>
				<div
					className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"
					role="progressbar"
					aria-label="Progress through the lesson"
					aria-valuemin={1}
					aria-valuemax={count}
					aria-valuenow={number + 1}
				>
					<div
						className="h-full rounded-full bg-cyan-500 transition-[width] duration-300"
						style={{ width: `${((number + 1) / count) * 100}%` }}
					/>
				</div>
				<h2 id="step-title" className="mt-1 text-lg font-semibold tracking-tight">
					{step.title}
				</h2>
				{step.tags.length > 0 && (
					<ul className="mt-2.5 flex flex-wrap gap-1.5">
						{step.tags.map((tag) => (
							<li
								key={tag.text}
								className={cx(
									'rounded-full border px-2 py-0.5 text-[11px]',
									toneClass[tag.tone],
								)}
							>
								{tag.text}
							</li>
						))}
					</ul>
				)}
				<div className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-slate-700">
					{body.map((pieces, i) => (
						<p key={step.body[i]}>
							<Explained pieces={pieces} />
						</p>
					))}
				</div>
				{step.example && <Sent example={step.example} />}
				{step.timeline && step.journeyId && (
					<Timeline journeyId={step.journeyId} result={result} />
				)}
				<div className="mt-4 space-y-2.5">
					{step.goodToKnow && (
						<Callout tone="good" title={step.goodToKnow.title}>
							<Explained pieces={goodToKnow!} />
						</Callout>
					)}
					{step.whenItFails && (
						<Callout tone="warn" title="When it fails">
							<Explained pieces={whenItFails!} />
						</Callout>
					)}
				</div>
				{about && (
					<button
						type="button"
						onClick={() => onAbout(about.id)}
						className="mt-3 self-start text-xs text-cyan-700 hover:underline"
					>
						More about {about.name} →
					</button>
				)}
				{action && (
					<a
						href={
							action.kind === 'challenge'
								? practiceHref(system.id, action.id)
								: exploreHref(system.id)
						}
						className={cx(
							'mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg',
							buttonSizes.md,
							buttonVariants.primary,
						)}
					>
						{action.label}
						<ArrowIcon width={14} height={14} />
					</a>
				)}
			</div>

			<div className="border-t border-slate-100 px-5 pt-3 pb-4">
				<div className="flex items-center gap-2">
					<Button disabled={number === 0} onClick={onBack}>
						← Back
					</Button>
					{nextHref ? (
						<a
							href={nextHref}
							className={cx(
								'inline-flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg',
								buttonSizes.md,
								action ? buttonVariants.plain : buttonVariants.primary,
							)}
						>
							<span className="truncate">{nextLabel}</span>
							<ArrowIcon width={14} height={14} className="shrink-0" />
						</a>
					) : (
						<Button
							variant="primary"
							className="flex-1 justify-between"
							onClick={onNext}
						>
							Next
							<ArrowIcon width={14} height={14} />
						</Button>
					)}
				</div>
				<p className="mt-2 hidden text-[11px] text-slate-500 lg:block">
					<kbd className="rounded border border-slate-300 bg-card px-1">←</kbd>{' '}
					<kbd className="rounded border border-slate-300 bg-card px-1">→</kbd> to move
					between steps
				</p>
			</div>
		</section>
	);
}

/** Every call in the journey, and how long each one makes the user wait. */
function Timeline({ journeyId, result }: { journeyId: string; result: SimResult }) {
	const system = useSystem();
	const journey = system.journeys.find((j) => j.id === journeyId)!;
	const state = result.journeys[journeyId]!;
	const longest = Math.max(1, ...state.hops.map((h) => h.waitMs));
	return (
		<ol className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
			{journey.hops.map((hop, i) => {
				const wait = state.hops[i]!.waitMs;
				return (
					<li key={`${hop.from}-${hop.to}-${i}`} className="text-xs">
						<div className="flex gap-2">
							<span className="w-4 shrink-0 text-slate-400 tabular-nums">
								{i + 1}
							</span>
							<span className="min-w-0 flex-1 truncate">{hop.label}</span>
							<span className="shrink-0 text-slate-500 tabular-nums">
								{hop.mode === 'async' ? 'later' : formatMs(wait)}
							</span>
						</div>
						{hop.mode === 'sync' && (
							<div className="mt-1 ml-6 h-1.5 overflow-hidden rounded-full bg-slate-200">
								<div
									className="h-full rounded-full bg-orange-400"
									style={{ width: `${Math.max(2, (wait / longest) * 100)}%` }}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}

/** A part, read about from inside a lesson: what it is, why it's here, and what happens when it fails. */
function PartAbout({ id, result, onBack }: { id: string; result: SimResult; onBack(): void }) {
	const system = useSystem();
	const component = system.components.find((c) => c.id === id);
	if (!component) return null;
	const copies = result.components[id]?.instances ?? component.instances;
	const rows = [
		['Why it’s here', component.why],
		...(component.kind === 'client' ? [] : [['When it fails', component.onFailure]]),
		['How it grows', component.scaling],
	] as const;
	const [summary, ...explained] = annotate(
		[component.summary, ...rows.map(([, text]) => text)],
		namesOf(system),
	);
	return (
		<section aria-labelledby="part-title" className="surface p-5">
			<button
				type="button"
				onClick={onBack}
				className="text-xs text-cyan-700 hover:underline"
			>
				← Back to the step
			</button>
			<p className="mt-3 text-xs tracking-wider text-slate-500 uppercase">
				{kindLabel[component.kind]}
				{component.kind !== 'client' && component.kind !== 'external'
					? ` · ${copies} ${copies === 1 ? 'copy' : 'copies'}`
					: ''}
			</p>
			<h2 id="part-title" className="mt-1 text-lg font-semibold">
				{component.name}
			</h2>
			<p className="mt-2 text-[15px] leading-relaxed text-slate-700">
				<Explained pieces={summary!} />
			</p>
			<dl className="mt-4 space-y-3 text-sm">
				{rows.map(([label], i) => (
					<div key={label}>
						<dt className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
							{label}
						</dt>
						<dd className="mt-0.5 text-slate-700">
							<Explained pieces={explained[i]!} />
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

/** What one real request sends at this step, and what comes back: Rohit's booking, a trip number. */
function Sent({ example }: { example: NonNullable<LessonStep['example']> }) {
	const sent = example.data.filter(([key]) => key !== 'answer');
	const answer = example.data.find(([key]) => key === 'answer')?.[1];
	return (
		<figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
			<figcaption className="px-3.5 pt-3 text-sm text-slate-700">
				<span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
					What’s sent
				</span>
				{example.says}
			</figcaption>
			{sent.length > 0 && (
				<dl className="mx-3.5 mt-2.5 mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs">
					{sent.map(([key, value]) => (
						<div key={key} className="contents">
							<dt className="text-slate-500">{key}</dt>
							<dd className="text-ink">{value}</dd>
						</div>
					))}
				</dl>
			)}
			{answer && (
				<p className="flex gap-2 border-t border-slate-200 bg-white px-3.5 py-2 text-xs">
					<span className="font-semibold text-cyan-700">↩ Answer</span>
					<span className="font-mono text-ink">{answer}</span>
				</p>
			)}
		</figure>
	);
}
