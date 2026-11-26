import { useEffect, useRef, useState, type ReactNode } from 'react';
import { lessonsOf } from '@/learn/lessons';
import { exploreHref, lessonHref, type Mode } from '@/route';
import { startingJourney, useApp, useSystem } from '@/store';
import { cx } from './cx';
import { CheckIcon, ChevronIcon, CompassIcon } from './icons';

/** The lessons and the sandbox, with how far you've got. */
export function CourseNav({ mode }: { mode: Mode }) {
	const system = useSystem();
	const lessons = lessonsOf(system);
	const learned = useApp((s) => s.learned);
	const setUp = useApp((s) => s.setUp);
	const [open, setOpen] = useState(false);

	const isLearned = (id: string) => learned.includes(`${system.id}/${id}`);
	// a hand-written course comes in tracks; a system's own lessons are one list
	const groups: { title: string; lessons: typeof lessons }[] = [];
	for (const lesson of lessons) {
		const title = lesson.track?.name ?? 'Lessons';
		const group = groups.find((g) => g.title === title);
		if (group) group.lessons.push(lesson);
		else groups.push({ title, lessons: [lesson] });
	}
	const lessonsDone = lessons.filter((l) => isLearned(l.id)).length;
	const total = lessons.length;
	const done = lessonsDone;
	const share = total > 0 ? (done / total) * 100 : 0;

	const where =
		mode.kind === 'learn'
			? `Lesson ${lessons.findIndex((l) => l.id === mode.lessonId) + 1}: ${lessons.find((l) => l.id === mode.lessonId)?.title}`
			: 'Explore freely';

	return (
		<nav aria-label="Course" className="surface flex min-h-0 flex-col overflow-hidden">
			{/* on a phone, the course folds away behind one button */}
			<button
				type="button"
				aria-expanded={open}
				onClick={() => setOpen(!open)}
				className="flex items-center gap-2 px-4 py-3 text-left lg:hidden"
			>
				<span className="min-w-0 flex-1">
					<span className="block text-[10px] font-semibold tracking-wider text-(--tc-ink) uppercase">
						Course · {done} of {total} done
					</span>
					<span className="block truncate font-display text-sm font-semibold">
						{where}
					</span>
				</span>
				<ChevronIcon
					width={16}
					height={16}
					className={cx('transition-transform', !open && 'rotate-180')}
				/>
			</button>

			<div
				className={cx(
					'min-h-0 flex-1 overflow-y-auto border-t border-slate-200 p-2.5 lg:block lg:border-t-0',
					open ? 'block' : 'hidden',
				)}
			>
				{groups.map((group) => (
					<Group
						key={group.title}
						title={group.title}
						count={`${group.lessons.filter((l) => isLearned(l.id)).length}/${group.lessons.length}`}
					>
						{group.lessons.map((lesson) => (
							<Item
								key={lesson.id}
								href={lessonHref(system.id, lesson.id)}
								current={mode.kind === 'learn' && mode.lessonId === lesson.id}
								done={isLearned(lesson.id)}
								mark={String(lessons.indexOf(lesson) + 1).padStart(2, '0')}
								onPick={() => setOpen(false)}
							>
								{lesson.title}
							</Item>
						))}
					</Group>
				))}
				<Group title="Practice">
					<Item
						href={exploreHref(system.id)}
						current={mode.kind === 'explore'}
						done={false}
						mark={<CompassIcon width={12} height={12} />}
						onPick={() => {
							setOpen(false);
							// from a lesson, it starts on an ordinary day, not on whatever a
							// lesson's “try it” last set up; already in it, nothing changes
							if (mode.kind !== 'explore') setUp(null, startingJourney(system).id);
						}}
					>
						Explore freely
					</Item>
				</Group>
			</div>

			<div
				className={cx(
					'border-t border-slate-200 px-4 py-3 lg:block',
					open ? 'block' : 'hidden',
				)}
			>
				<div className="flex items-baseline justify-between">
					<span className="font-display text-sm font-semibold">Your progress</span>
					<span className="text-xs font-semibold text-slate-600 tabular-nums">
						{done} / {total}
					</span>
				</div>
				<div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
					<div
						className="h-full rounded-full bg-(--tc) transition-[width] duration-500"
						style={{ width: `${share}%` }}
					/>
				</div>
				<p className="mt-2 text-[11px] text-slate-500">
					A lesson gets a tick when you reach its last step.
				</p>
				{done > 0 && <ResetProgress />}
			</div>
		</nav>
	);
}

/** Clears the ticks, after asking: there's no undo. */
function ResetProgress() {
	const reset = useApp((s) => s.resetProgress);
	const [asking, setAsking] = useState(false);
	if (!asking) {
		return (
			<button
				type="button"
				onClick={() => setAsking(true)}
				className="mt-1.5 text-xs font-medium text-cyan-700 hover:underline"
			>
				Reset progress
			</button>
		);
	}
	return (
		<p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs">
			<span className="text-slate-700">Remove all ticks?</span>
			<button
				type="button"
				onClick={() => {
					reset();
					setAsking(false);
				}}
				className="font-semibold text-red-700 hover:underline"
			>
				Yes, reset
			</button>
			<button
				type="button"
				onClick={() => setAsking(false)}
				className="text-slate-600 hover:underline"
			>
				Cancel
			</button>
		</p>
	);
}

/** A track of lessons, or Practice. */
function Group({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
	return (
		<section className="mb-3 last:mb-0">
			<h2 className="flex items-center gap-2 px-2 pt-1.5 pb-1.5">
				<span
					className="size-2.5 shrink-0 rounded-full bg-(--tc) ring-3 ring-(--tc)/15"
					aria-hidden="true"
				/>
				<span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">
					{title}
				</span>
				{count && (
					<span className="rounded-full bg-(--tc)/10 px-1.5 py-px text-[10px] font-semibold text-(--tc-ink) tabular-nums">
						{count}
					</span>
				)}
			</h2>
			<ul className="space-y-0.5">{children}</ul>
		</section>
	);
}

function Item({
	href,
	current,
	done,
	mark,
	onPick,
	children,
}: {
	href: string;
	current: boolean;
	done: boolean;
	mark: ReactNode;
	onPick(): void;
	children: string;
}) {
	// the lesson you're on stays in view, however long the list
	const link = useRef<HTMLAnchorElement>(null);
	useEffect(() => {
		if (current) link.current?.scrollIntoView?.({ block: 'nearest' });
	}, [current]);
	return (
		<li>
			<a
				ref={link}
				href={href}
				aria-current={current ? 'page' : undefined}
				onClick={onPick}
				className={cx(
					'flex items-center gap-2.5 rounded-lg border px-2 py-1.5 text-sm transition-colors',
					current
						? 'border-(--tc)/25 bg-(--tc)/10 font-semibold text-(--tc-ink)'
						: 'border-transparent text-slate-700 hover:bg-(--tc)/6',
				)}
			>
				<span
					className={cx(
						'grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-semibold transition-colors',
						done || current ? 'bg-(--tc) text-white' : 'bg-(--tc)/10 text-(--tc-ink)',
					)}
				>
					{done ? <CheckIcon width={12} height={12} /> : mark}
				</span>
				<span className="min-w-0 flex-1 truncate">{children}</span>
				{done && <span className="sr-only">(done)</span>}
			</a>
		</li>
	);
}
