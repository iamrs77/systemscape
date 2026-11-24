import { useEffect, useRef, useState } from 'react';
import { homeHref, systemHref } from '@/route';
import { allSystems, comingSoon } from '@/systems';
import { useApp, useSystem } from '@/store';
import { Button } from './controls';
import { ArrowIcon, BookIcon, ChevronIcon, GitHubIcon, InfoIcon } from './icons';

export const REPO_URL = 'https://github.com/iamrs77/systemscape';

export function TopBar() {
	const openDialog = useApp((s) => s.openDialog);

	return (
		<header className="flex items-center gap-2 border-b border-slate-200 bg-card px-3 py-2 sm:gap-3 sm:px-4">
			<a
				href={homeHref}
				aria-label="Systemscape: all systems"
				title="All systems"
				className="flex items-center gap-2 font-semibold tracking-tight text-ink"
			>
				<Logo />
				<span className="hidden sm:inline">Systemscape</span>
			</a>
			<span className="text-slate-400" aria-hidden="true">
				/
			</span>
			<SystemPicker />
			<nav aria-label="Help" className="ml-auto flex items-center gap-1">
				<Button size="sm" variant="ghost" onClick={() => openDialog('glossary')}>
					<BookIcon width={15} height={15} />
					<span className="hidden md:inline">Glossary</span>
				</Button>
				<Button size="sm" variant="ghost" onClick={() => openDialog('about')}>
					<InfoIcon width={15} height={15} />
					<span className="hidden md:inline">About this design</span>
				</Button>
				<a
					href={REPO_URL}
					target="_blank"
					rel="noreferrer"
					aria-label="Source code on GitHub"
					className="grid size-7 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
				>
					<GitHubIcon width={15} height={15} />
				</a>
			</nav>
		</header>
	);
}

/** Choose a system; the ones still being built are listed as coming soon. */
function SystemPicker() {
	const system = useSystem();
	const [open, setOpen] = useState(false);
	const root = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (!root.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	return (
		<div ref={root} className="relative">
			<button
				type="button"
				aria-expanded={open}
				aria-haspopup="true"
				onClick={() => setOpen(!open)}
				className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-ink hover:bg-slate-100"
			>
				{system.name}
				<ChevronIcon width={14} height={14} className="text-slate-500" />
			</button>
			{open && (
				<div className="surface absolute top-full left-0 z-40 mt-2 w-80 p-1.5">
					<ul>
						{allSystems.map((s) => (
							<li key={s.id}>
								<a
									href={systemHref(s.id)}
									aria-current={s.id === system.id ? 'page' : undefined}
									onClick={() => setOpen(false)}
									className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
								>
									<span className="block text-sm font-medium text-slate-900">
										{s.name}
									</span>
									<span className="block text-xs text-slate-500">
										{s.tagline}
									</span>
								</a>
							</li>
						))}
					</ul>
					<p className="mt-1 border-t border-slate-200 px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
						Coming soon
					</p>
					<ul>
						{comingSoon.map((s) => (
							<li key={s.name} className="px-3 py-1.5 opacity-60">
								<span className="block text-sm text-slate-600">{s.name}</span>
								<span className="block text-xs text-slate-500">{s.tagline}</span>
							</li>
						))}
					</ul>
					<a
						href={homeHref}
						onClick={() => setOpen(false)}
						className="mt-1 flex items-center gap-1.5 rounded-lg border-t border-slate-200 px-3 pt-2.5 pb-1.5 text-xs font-medium text-cyan-700 hover:underline"
					>
						All systems
						<ArrowIcon width={12} height={12} />
					</a>
				</div>
			)}
		</div>
	);
}

export function Logo() {
	return (
		<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
			<path d="M16 3 28 10v12l-12 7-12-7V10z" fill="#0e7490" />
			<path d="M16 3 28 10 16 17 4 10z" fill="#67e8f9" />
			<path d="M16 17v12l12-7V10z" fill="#22d3ee" />
		</svg>
	);
}
