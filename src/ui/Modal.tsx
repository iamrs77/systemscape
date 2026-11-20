import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './controls';
import { CrossIcon } from './icons';

type Props = {
	title: string;
	onClose(): void;
	children: ReactNode;
};

/** A dialog over the page: Escape or a click outside closes it, and focus returns where it was. */
export function Modal({ title, onClose, children }: Props) {
	const titleId = useId();
	const panel = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const before = document.activeElement as HTMLElement | null;
		panel.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
			before?.focus();
		};
	}, [onClose]);

	return createPortal(
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
			onMouseDown={onClose}
		>
			<div
				ref={panel}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				tabIndex={-1}
				onMouseDown={(e) => e.stopPropagation()}
				className="flex max-h-[min(88dvh,820px)] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-slate-950 shadow-2xl outline-none"
			>
				<div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
					<h2 id={titleId} className="flex-1 text-base font-semibold text-white">
						{title}
					</h2>
					<Button size="sm" variant="ghost" aria-label="Close" onClick={onClose}>
						<CrossIcon width={15} height={15} />
					</Button>
				</div>
				<div className="overflow-y-auto px-5 py-4">{children}</div>
			</div>
		</div>,
		document.body,
	);
}
