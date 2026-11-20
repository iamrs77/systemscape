import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/store';
import { Button } from './controls';
import { markToured } from './toured';

const steps = [
	{
		target: 'scene',
		title: 'The system, in 3D',
		text: 'Each shape is one part of the app’s backend, and the ring around it shows how busy it is. The moving dots are requests: red ones fail. Drag to turn the view, scroll to zoom, and click any part to see what it does.',
	},
	{
		target: 'journeys',
		title: 'Follow a journey',
		text: 'These are the things people do in the app. Pick one to see only its requests, the steps they take, and where the time goes.',
	},
	{
		target: 'controls',
		title: 'Push it',
		text: 'Switch scenarios or drag the traffic up, and turn autoscaling, retries and circuit breakers on and off. Everything updates straight away.',
	},
	{
		target: 'inspector',
		title: 'What’s happening, and why',
		text: 'This panel explains what’s going on in plain words. When you select a part, it shows why it’s there and what happens when it fails, and lets you add instances or take it down.',
	},
	{
		target: 'challenges',
		title: 'Ready for a challenge?',
		text: 'Each challenge breaks something, the way it happens in real life. Use what you’ve learned to keep the app running.',
	},
] as const;

const CARD_WIDTH = 340;
const GAP = 14;

/** Places the card beside the highlighted area, or inside it when it fills the screen. */
function cardPosition(rect: DOMRect | null): CSSProperties {
	const width = Math.min(CARD_WIDTH, window.innerWidth - 32);
	if (!rect || window.innerWidth < 640) {
		return { width, left: 16, right: 16, bottom: 16, margin: '0 auto' };
	}
	const top = Math.min(Math.max(16, rect.top), window.innerHeight - 260);
	if (rect.right + GAP + width < window.innerWidth) return { width, top, left: rect.right + GAP };
	if (rect.left - GAP - width > 0) return { width, top, left: rect.left - GAP - width };
	// a wide area: inside it, near the bottom
	return {
		width,
		left: rect.left + (rect.width - width) / 2,
		top: Math.max(16, Math.min(rect.bottom - 240, window.innerHeight - 260)),
	};
}

/** A short guided tour, shown on the first visit and from the Tour button. */
export function Tour() {
	const open = useApp((s) => s.dialog === 'tour');
	const openDialog = useApp((s) => s.openDialog);
	const [step, setStep] = useState(0);
	const [rect, setRect] = useState<DOMRect | null>(null);
	const current = steps[step]!;
	const last = step === steps.length - 1;

	const finish = useCallback(() => {
		markToured();
		setStep(0);
		openDialog(null);
	}, [openDialog]);

	useLayoutEffect(() => {
		if (!open) return;
		const measure = () => {
			const target = document.querySelector(`[data-tour="${current.target}"]`);
			setRect(target ? target.getBoundingClientRect() : null);
		};
		document
			.querySelector(`[data-tour="${current.target}"]`)
			?.scrollIntoView({ block: 'nearest' });
		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, [open, current.target]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') finish();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, finish]);

	if (!open) return null;

	return createPortal(
		<div className="fixed inset-0 z-50">
			{rect ? (
				<div
					className="pointer-events-none absolute rounded-xl ring-2 ring-cyan-300 transition-all duration-300"
					style={{
						left: rect.left - 4,
						top: rect.top - 4,
						width: rect.width + 8,
						height: rect.height + 8,
						boxShadow: '0 0 0 9999px rgb(2 6 23 / 0.66)',
					}}
				/>
			) : (
				<div className="absolute inset-0 bg-slate-950/65" />
			)}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="tour-title"
				className="absolute rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl"
				style={cardPosition(rect)}
			>
				<p className="text-[11px] font-semibold tracking-[0.12em] text-cyan-300 uppercase">
					{step + 1} of {steps.length}
				</p>
				<h2 id="tour-title" className="mt-1 text-base font-semibold text-white">
					{current.title}
				</h2>
				<p className="mt-1.5 text-sm text-slate-300">{current.text}</p>
				<div className="mt-4 flex items-center gap-2">
					<Button size="sm" variant="ghost" onClick={finish}>
						{last ? 'Close' : 'Skip the tour'}
					</Button>
					<span className="flex-1" />
					{step > 0 && (
						<Button size="sm" onClick={() => setStep(step - 1)}>
							Back
						</Button>
					)}
					<Button
						size="sm"
						variant="primary"
						autoFocus
						onClick={() => (last ? finish() : setStep(step + 1))}
					>
						{last ? 'Start exploring' : 'Next'}
					</Button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
