import { useCallback } from 'react';
import { glossary } from '@/learn/glossary';
import { useApp } from '@/store';
import { Modal } from './Modal';

const words = [...glossary].sort((a, b) => a.term.localeCompare(b.term));

/** Every word in the glossary, A to Z, with what it means. */
export function GlossaryDialog() {
	const open = useApp((s) => s.dialog === 'glossary');
	const openDialog = useApp((s) => s.openDialog);
	const close = useCallback(() => openDialog(null), [openDialog]);
	if (!open) return null;

	return (
		<Modal title="Words, explained" onClose={close}>
			<p className="text-sm text-slate-600">
				The words system design uses, in plain English. In the lessons, tap any underlined
				word to see its meaning where you are.
			</p>
			<dl className="mt-4 divide-y divide-slate-100">
				{words.map((word) => (
					<div key={word.id} className="py-3">
						<dt className="text-sm font-semibold text-ink">{word.term}</dt>
						<dd className="mt-0.5 text-sm text-slate-700">{word.meaning}</dd>
						{word.like && (
							<dd className="mt-1 text-sm text-slate-500">Like: {word.like}</dd>
						)}
					</div>
				))}
			</dl>
		</Modal>
	);
}
