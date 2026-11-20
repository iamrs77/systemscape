import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'plain' | 'primary' | 'ghost' | 'danger';
	size?: 'sm' | 'md';
};

const variants = {
	plain: 'border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.09] hover:border-white/20',
	primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-semibold',
	ghost: 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
	danger: 'border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20',
};

export function Button({ variant = 'plain', size = 'md', className, ...props }: ButtonProps) {
	return (
		<button
			type="button"
			className={cx(
				'inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40',
				size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm',
				variants[variant],
				className,
			)}
			{...props}
		/>
	);
}

type ToggleProps = {
	label: string;
	/** What it does, for the tooltip and screen readers. */
	description: string;
	checked: boolean;
	disabled?: boolean;
	onChange(checked: boolean): void;
};

export function Toggle({ label, description, checked, disabled, onChange }: ToggleProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-description={description}
			title={description}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-300 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
		>
			<span
				className={cx(
					'relative h-4 w-7 shrink-0 rounded-full transition-colors',
					checked ? 'bg-cyan-400' : 'bg-slate-700',
				)}
			>
				<span
					className={cx(
						'absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow transition-transform',
						checked && 'translate-x-3',
					)}
				/>
			</span>
			{label}
		</button>
	);
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
	return (
		<span
			className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300"
			style={
				color ? { color, borderColor: `${color}55`, background: `${color}14` } : undefined
			}
		>
			{children}
		</span>
	);
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
	return (
		<h2
			id={id}
			className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase"
		>
			{children}
		</h2>
	);
}

/** A thin bar for a share, e.g. how busy something is. */
export function Meter({ share, color }: { share: number; color: string }) {
	return (
		<div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
			<div
				className="h-full rounded-full transition-[width] duration-300"
				style={{ width: `${Math.min(100, Math.max(0, share * 100))}%`, background: color }}
			/>
		</div>
	);
}
