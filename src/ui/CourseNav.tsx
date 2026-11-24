import { useEffect, useRef, useState, type ReactNode } from 'react';
import { lessonsOf } from '@/learn/lessons';
import { exploreHref, lessonHref, type Mode } from '@/route';
import { useApp, useSystem } from '@/store';
import { cx } from './cx';
import { CheckIcon, ChevronIcon, CompassIcon } from './icons';

/** The lessons and the sandbox, with how far you've got. */
export function CourseNav({ mode }: { mode: Mode }) {
	const system = useSystem();
	const lessons = lessonsOf(system);
	const learned = useApp((s) => s.learned);
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
					<span className="block text-[10px] tracking-wider text-slate-500 uppercase">
						Course · {done} of {total} done
					</span>
					<span className="block truncate text-sm font-semibold">{where}</span>
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
						onPick={() => setOpen(false)}
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
				<div className="flex justify-between text-xs">
					<span className="font-semibold tracking-wider uppercase">Progress</span>
					<span className="tabular-nums">
						{done} / {total}
					</span>
				</div>
				<div className="mt-2 h-2 overflow-hidden rounded-full border border-slate-200 bg-card">
					<div
						className="h-full bg-cyan-300 transition-[width] duration-500"
						style={{ width: `${(done / total) * 100}%` }}
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

function Group({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
	return (
		<section className="mb-3 last:mb-0">
			<h2 className="flex justify-between px-2 pt-1 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
				{title}
				{count && <span className="tabular-nums">{count}</span>}
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
						? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-900'
						: 'border-transparent text-slate-700 hover:bg-slate-100',
				)}
			>
				<span
					className={cx(
						'grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-semibold',
						done ? 'bg-cyan-300 text-ink' : 'bg-slate-100 text-slate-500',
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
