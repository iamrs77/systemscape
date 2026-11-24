import { Fragment, useEffect, useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { termById, type Piece } from '@/learn/glossary';
import { useApp } from '@/store';
import { floatingRoot } from './fullScreen';

/** Which word's meaning is open, and the word it's beside. One at a time. */
type Open = { key: string; id: string; anchor: HTMLElement };
const useTerm = create<{ open: Open | null; show(open: Open | null): void }>()((set) => ({
	open: null,
	show: (open) => set({ open }),
}));

/** Text with its glossary words underlined: tap one to see what it means. */
export function Explained({ pieces }: { pieces: Piece[] }) {
	return (
		<>
			{pieces.map((piece, i) => {
				const content =
					piece.kind === 'term' ? <Word id={piece.id} text={piece.text} /> : piece.text;
				return piece.strong ? (
					<strong key={i} className="font-semibold text-ink">
						{content}
					</strong>
				) : (
					<Fragment key={i}>{content}</Fragment>
				);
			})}
		</>
	);
}

function Word({ id, text }: { id: string; text: string }) {
	const key = useId();
	const open = useTerm((s) => s.open?.key === key);
	const show = useTerm((s) => s.show);

	// a word that goes (the step changed) takes its meaning with it
	useEffect(
		() => () => {
			if (useTerm.getState().open?.key === key) useTerm.getState().show(null);
		},
		[key],
	);

	return (
		<button
			type="button"
			aria-expanded={open}
			aria-controls={open ? 'term-meaning' : undefined}
			title="What’s this?"
			onClick={(event) => show(open ? null : { key, id, anchor: event.currentTarget })}
			className="cursor-help rounded-sm underline decoration-cyan-400 decoration-dotted decoration-2 underline-offset-[3px] hover:bg-cyan-50 hover:text-cyan-800 aria-expanded:bg-cyan-50 aria-expanded:text-cyan-800"
		>
			{text}
		</button>
	);
}

/** The meaning of the word that's open, in a card beside it. */
export function WordMeaning() {
	const open = useTerm((s) => s.open);
	const show = useTerm((s) => s.show);
	const openDialog = useApp((s) => s.openDialog);
	const card = useRef<HTMLDivElement>(null);

	// below the word if it fits, otherwise above; never off the side of the screen
	useLayoutEffect(() => {
		const element = card.current;
		if (open && element) place(element, open.anchor);
	}, [open]);

	// Escape or a click elsewhere closes it; when the page scrolls or resizes, it follows the word
	useEffect(() => {
		if (!open) return;
		const follow = () => {
			if (card.current) place(card.current, open.anchor);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			show(null);
			open.anchor.focus();
		};
		const onDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (card.current?.contains(target) || open.anchor.contains(target)) return;
			show(null);
		};
		document.addEventListener('keydown', onKey);
		document.addEventListener('pointerdown', onDown);
		window.addEventListener('resize', follow);
		window.addEventListener('scroll', follow, true);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onDown);
			window.removeEventListener('resize', follow);
			window.removeEventListener('scroll', follow, true);
		};
	}, [open, show]);

	const term = open && termById.get(open.id);
	if (!term) return null;
	return createPortal(
		<div
			ref={card}
			id="term-meaning"
			role="dialog"
			aria-label={`What “${term.term}” means`}
			style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
			className="z-50 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl"
		>
			<p className="text-sm font-semibold text-ink">{term.term}</p>
			<p className="mt-1 text-sm leading-relaxed text-slate-700">{term.meaning}</p>
			{term.like && (
				<p className="mt-2.5 rounded-lg bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
					<span className="block text-[11px] font-semibold tracking-wider text-cyan-700 uppercase">
						Like
					</span>
					{term.like}
				</p>
			)}
			<button
				type="button"
				onClick={() => {
					show(null);
					openDialog('glossary');
				}}
				className="mt-3 text-xs font-medium text-cyan-700 hover:underline"
			>
				All the words →
			</button>
		</div>,
		floatingRoot(),
	);
}

/** Puts the card below the word if it fits, otherwise above, and never off the side of the screen. */
function place(element: HTMLElement, anchor: HTMLElement) {
	const word = anchor.getBoundingClientRect();
	const width = Math.min(320, window.innerWidth - 24);
	const left = Math.min(
		window.innerWidth - width - 12,
		Math.max(12, word.left + word.width / 2 - width / 2),
	);
	element.style.width = `${width}px`;
	const height = element.offsetHeight;
	const below = word.bottom + 8 + height <= window.innerHeight;
	element.style.left = `${left}px`;
	element.style.top = `${below ? word.bottom + 8 : Math.max(12, word.top - 8 - height)}px`;
	element.style.visibility = 'visible';
}
