import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import { homeHref, systemHref } from '@/route';
import { allSystems } from '@/systems';
import { useApp, useSystem } from '@/store';
import { Button } from './controls';
import { ArrowIcon, BookIcon, ChevronIcon, GitHubIcon, InfoIcon } from './icons';
import { systemColor } from './palette';

export const REPO_URL = 'https://github.com/iamrs77/systemscape';

export function TopBar() {
	const openDialog = useApp((s) => s.openDialog);

	return (
		<header className="app-bar flex items-center gap-2 px-3 pt-2.5 pb-2 sm:gap-3 sm:px-4">
			<a
				href={homeHref}
				aria-label="Systemscape: all systems"
				title="All systems"
				className="flex items-center gap-2.5 font-display text-[18px] font-bold tracking-tight text-ink"
			>
				<Logo />
				<span className="hidden sm:inline">Systemscape</span>
			</a>
			<span className="text-slate-300" aria-hidden="true">
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

/** Choose a system. */
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
				className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 py-1 pr-2.5 pl-2 text-sm font-semibold text-ink shadow-xs transition hover:border-slate-300 hover:bg-white"
			>
				<ColorDot color={systemColor(system.id)} />
				{system.name}
				<ChevronIcon width={14} height={14} className="text-slate-500" />
			</button>
			{open && (
				<div className="surface absolute top-full left-0 z-40 mt-2 w-80 p-1.5">
					<ul>
						{allSystems.map((s, i) => (
							<li key={s.id}>
								<a
									href={systemHref(s.id)}
									aria-current={s.id === system.id ? 'page' : undefined}
									onClick={() => setOpen(false)}
									className="flex w-full gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-(--tc)/8 aria-[current=page]:bg-(--tc)/10"
									style={{ '--tc': systemColor(s.id, i) } as CSSProperties}
								>
									<span className="mt-1.5">
										<ColorDot color={systemColor(s.id, i)} />
									</span>
									<span className="min-w-0">
										<span className="block font-display text-sm font-semibold text-slate-900">
											{s.name}
										</span>
										<span className="line-clamp-2 text-xs text-slate-500">
											{s.tagline}
										</span>
									</span>
								</a>
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

/** A system's colour, as a small dot with a soft ring. */
function ColorDot({ color }: { color: string }) {
	return (
		<span
			className="block size-2.5 shrink-0 rounded-full"
			style={{ background: color, boxShadow: `0 0 0 3px ${color}26` }}
			aria-hidden="true"
		/>
	);
}

/** The mark: a request winding through a system, on a colourful tile. */
export function Logo({ size = 26 }: { size?: number }) {
	const id = `${useId().replace(/[^\w-]/g, '')}-logo`;
	return (
		<svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="shrink-0">
			<defs>
				<linearGradient
					id={id}
					x1="0"
					y1="0"
					x2="32"
					y2="32"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0" stopColor="#4f46e5" />
					<stop offset="0.55" stopColor="#c026d3" />
					<stop offset="1" stopColor="#f97316" />
				</linearGradient>
			</defs>
			<rect width="32" height="32" rx="9" fill={`url(#${id})`} />
			<path
				d="M9 10h10a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h10"
				fill="none"
				stroke="#fff"
				strokeWidth="2.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="9" cy="10" r="2.6" fill="#fff" />
			<circle cx="23" cy="22" r="2.6" fill="#fff" />
		</svg>
	);
}
