import { useEffect, useRef, useState, type ReactNode } from 'react';
import { comingSoon, systems } from '@/systems';
import { useApp, useSystem } from '@/store';
import { Button } from './controls';
import { cx } from './cx';
import {
	ChevronIcon,
	CompassIcon,
	CubeIcon,
	ExpandIcon,
	GitHubIcon,
	InfoIcon,
	PauseIcon,
	PlayIcon,
	TopViewIcon,
} from './icons';

export const REPO_URL = 'https://github.com/iamrs77/systemscape';

export function TopBar() {
	const view = useApp((s) => s.view);
	const setView = useApp((s) => s.setView);
	const paused = useApp((s) => s.paused);
	const setPaused = useApp((s) => s.setPaused);
	const openDialog = useApp((s) => s.openDialog);
	const focused = useApp((s) => s.focused);
	const setFocused = useApp((s) => s.setFocused);

	return (
		<header className="flex items-center gap-2 border-b border-white/[0.06] bg-slate-950/80 px-3 py-2 sm:gap-3 sm:px-4">
			<a
				href="./"
				className="flex items-center gap-2 font-semibold tracking-tight text-white"
			>
				<Logo />
				<span className="hidden sm:inline">Systemscape</span>
			</a>
			<span className="hidden h-5 w-px bg-white/10 sm:block" />
			<SystemPicker />
			<nav aria-label="View" className="ml-auto flex items-center gap-1">
				<div
					role="group"
					aria-label="Camera"
					className="hidden rounded-lg border border-white/10 p-0.5 sm:flex"
				>
					<ViewButton
						active={view === '3d'}
						onClick={() => setView('3d')}
						label="3D view"
					>
						<CubeIcon width={15} height={15} />
					</ViewButton>
					<ViewButton
						active={view === 'top'}
						onClick={() => setView('top')}
						label="Top view"
					>
						<TopViewIcon width={15} height={15} />
					</ViewButton>
				</div>
				<Button
					size="sm"
					variant="ghost"
					aria-label={paused ? 'Play the animation' : 'Pause the animation'}
					title={paused ? 'Play the animation' : 'Pause the animation'}
					onClick={() => setPaused(!paused)}
				>
					{paused ? (
						<PlayIcon width={15} height={15} />
					) : (
						<PauseIcon width={15} height={15} />
					)}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="hidden lg:inline-flex"
					aria-pressed={focused}
					aria-label="Focus on the map"
					title={
						focused
							? 'Show the side panels'
							: 'Hide the side panels, to see more of the map'
					}
					onClick={() => setFocused(!focused)}
				>
					<ExpandIcon width={15} height={15} />
				</Button>
				<Button size="sm" variant="ghost" onClick={() => openDialog('tour')}>
					<CompassIcon width={15} height={15} />
					<span className="hidden md:inline">Tour</span>
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
					className="grid size-7 place-items-center rounded-lg text-slate-300 hover:bg-white/[0.07] hover:text-white"
				>
					<GitHubIcon width={15} height={15} />
				</a>
			</nav>
		</header>
	);
}

function ViewButton({
	active,
	onClick,
	label,
	children,
}: {
	active: boolean;
	onClick(): void;
	label: string;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			aria-label={label}
			title={label}
			onClick={onClick}
			className={cx(
				'grid size-7 place-items-center rounded-md transition-colors',
				active ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-white',
			)}
		>
			{children}
		</button>
	);
}

/** Choose a system; the ones still being built are listed as coming soon. */
function SystemPicker() {
	const system = useSystem();
	const selectSystem = useApp((s) => s.selectSystem);
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
				className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-slate-200 hover:bg-white/[0.07]"
			>
				{system.name}
				<ChevronIcon width={14} height={14} className="text-slate-500" />
			</button>
			{open && (
				<div className="absolute top-full left-0 z-40 mt-1.5 w-80 rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl">
					<ul>
						{systems.map((s) => (
							<li key={s.id}>
								<button
									type="button"
									aria-current={s.id === system.id || undefined}
									onClick={() => {
										selectSystem(s.id);
										setOpen(false);
									}}
									className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]"
								>
									<span className="block text-sm font-medium text-white">
										{s.name}
									</span>
									<span className="block text-xs text-slate-400">
										{s.tagline}
									</span>
								</button>
							</li>
						))}
					</ul>
					<p className="mt-1 border-t border-white/[0.06] px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
						Coming soon
					</p>
					<ul>
						{comingSoon.map((s) => (
							<li key={s.name} className="px-3 py-1.5 opacity-60">
								<span className="block text-sm text-slate-300">{s.name}</span>
								<span className="block text-xs text-slate-500">{s.tagline}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

function Logo() {
	return (
		<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
			<path d="M16 3 28 10v12l-12 7-12-7V10z" fill="#0e7490" />
			<path d="M16 3 28 10 16 17 4 10z" fill="#67e8f9" />
			<path d="M16 17v12l12-7V10z" fill="#22d3ee" />
		</svg>
	);
}
