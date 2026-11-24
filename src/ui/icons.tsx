import type { SVGProps } from 'react';

/** A small set of line icons, drawn on a 24px grid. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="16"
			height="16"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	);
}

type P = SVGProps<SVGSVGElement>;

export const PlayIcon = (p: P) => (
	<Icon {...p}>
		<path d="M7 5v14l11-7z" />
	</Icon>
);
export const PauseIcon = (p: P) => (
	<Icon {...p}>
		<path d="M8 5v14M16 5v14" />
	</Icon>
);
export const CubeIcon = (p: P) => (
	<Icon {...p}>
		<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
		<path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
	</Icon>
);
export const TopViewIcon = (p: P) => (
	<Icon {...p}>
		<rect x="4" y="4" width="16" height="16" rx="2" />
		<path d="M4 12h16M12 4v16" />
	</Icon>
);
export const InfoIcon = (p: P) => (
	<Icon {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 8h.01" />
	</Icon>
);
export const CompassIcon = (p: P) => (
	<Icon {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="m15.5 8.5-2 5-5 2 2-5z" />
	</Icon>
);
export const GitHubIcon = (p: P) => (
	<Icon {...p}>
		<path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
	</Icon>
);
export const CheckIcon = (p: P) => (
	<Icon {...p}>
		<path d="m5 12 5 5 9-10" />
	</Icon>
);
export const CrossIcon = (p: P) => (
	<Icon {...p}>
		<path d="M6 6l12 12M18 6 6 18" />
	</Icon>
);
export const ChevronIcon = (p: P) => (
	<Icon {...p}>
		<path d="m6 9 6 6 6-6" />
	</Icon>
);
export const ResetIcon = (p: P) => (
	<Icon {...p}>
		<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" />
		<path d="M4 4v4.5h4.5" />
	</Icon>
);
export const PlusIcon = (p: P) => (
	<Icon {...p}>
		<path d="M12 5v14M5 12h14" />
	</Icon>
);
export const MinusIcon = (p: P) => (
	<Icon {...p}>
		<path d="M5 12h14" />
	</Icon>
);
export const FlagIcon = (p: P) => (
	<Icon {...p}>
		<path d="M5 21V4m0 0h11l-2 4 2 4H5" />
	</Icon>
);
export const PowerIcon = (p: P) => (
	<Icon {...p}>
		<path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0" />
	</Icon>
);
export const ArrowIcon = (p: P) => (
	<Icon {...p}>
		<path d="M5 12h14m-5-5 5 5-5 5" />
	</Icon>
);
export const BoltIcon = (p: P) => (
	<Icon {...p}>
		<path d="M13 2 4 14h7l-1 8 9-12h-7z" />
	</Icon>
);
export const ExpandIcon = (p: P) => (
	<Icon {...p}>
		<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
	</Icon>
);
export const ShrinkIcon = (p: P) => (
	<Icon {...p}>
		<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
	</Icon>
);
export const PanelIcon = (p: P) => (
	<Icon {...p}>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<path d="M15 4v16" />
	</Icon>
);
export const BookIcon = (p: P) => (
	<Icon {...p}>
		<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2.5 2 2 0 0 0 2 1.5h14" />
	</Icon>
);
