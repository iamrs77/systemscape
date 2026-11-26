import { type ReactNode, useId } from 'react';
import { useMediaQuery } from './useMediaQuery';

/**
 * Drawn posters for the systems on the front page. Each is drawn on a 400 by
 * 200 board; the background runs well past it, so the poster fills a card of
 * any shape without cropping what matters.
 */

type PosterProps = { uid: string; still: boolean };

/** A system's poster, or the fallback for a system without one. */
export function SystemPoster({ id, fallback }: { id: string; fallback: ReactNode }) {
	const uid = useId().replace(/[^\w-]/g, '');
	const still = useMediaQuery('(prefers-reduced-motion: reduce)');
	const Poster = POSTERS[id];
	if (!Poster) return fallback;
	return (
		<svg viewBox="0 0 400 200" className="size-full" aria-hidden="true">
			<Poster uid={uid} still={still} />
		</svg>
	);
}

/** The background: a diagonal wash from one colour to another. */
function Backdrop({ uid, from, to }: { uid: string; from: string; to: string }) {
	return (
		<>
			<defs>
				<linearGradient
					id={`${uid}-bg`}
					x1="0"
					y1="0"
					x2="400"
					y2="200"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0" stopColor={from} />
					<stop offset="1" stopColor={to} />
				</linearGradient>
			</defs>
			<rect x={-400} y={-200} width={1200} height={600} fill={`url(#${uid}-bg)`} />
		</>
	);
}

/** A dotted line with dots moving along it, over a soft wide one. */
function Trail({ d, width = 8 }: { d: string; width?: number }) {
	return (
		<g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
			<path d={d} strokeOpacity={0.3} strokeWidth={width} />
			<path d={d} strokeWidth={3} strokeDasharray="0 14" className="snake-flow" />
		</g>
	);
}

/** A car seen from above, pointing right. */
function Car({ x = 0, y = 0, angle = 0, ghost = false }) {
	return (
		<g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={ghost ? 0.5 : 1}>
			<rect x={-12} y={-7} width={24} height={14} rx={4} fill="#fff" />
			<rect x={3} y={-5} width={5} height={10} rx={1.5} fill="#9a3412" fillOpacity={0.75} />
			<rect x={-9} y={-5} width={3} height={10} rx={1} fill="#9a3412" fillOpacity={0.5} />
		</g>
	);
}

/** A city from above: a car drives along the streets to a rider waiting at a pin. */
function RidePoster({ uid, still }: PosterProps) {
	const route = 'M105 165V105H245V45H315';
	const blocks: ReactNode[] = [];
	for (let k = -6; k < 11; k++) {
		for (let j = -3; j < 7; j++) {
			blocks.push(
				<rect
					key={`${k}:${j}`}
					x={70 * k + 43}
					y={60 * j - 7}
					width={54}
					height={44}
					rx={8}
				/>,
			);
		}
	}
	return (
		<>
			<Backdrop uid={uid} from="#fb923c" to="#c2410c" />
			<g fill="#fff" fillOpacity={0.13}>
				{blocks}
			</g>
			<rect x={183} y={113} width={54} height={44} rx={8} fill="#bbf7d0" fillOpacity={0.35} />
			<Car x={35} y={75} angle={90} ghost />
			<Car x={385} y={75} angle={90} ghost />
			<Car x={175} y={165} ghost />
			<Car x={140} y={45} angle={180} ghost />
			<Trail d={route} />
			{[0, 1].map((n) => (
				<circle
					key={n}
					cx={315}
					cy={45}
					r={14}
					fill="none"
					stroke="#fff"
					strokeWidth={2}
					opacity={still ? 0.4 : 0}
				>
					{!still && (
						<>
							<animate
								attributeName="r"
								values="8;32"
								dur="2.4s"
								begin={`${n * 1.2}s`}
								repeatCount="indefinite"
							/>
							<animate
								attributeName="opacity"
								values="0.7;0"
								dur="2.4s"
								begin={`${n * 1.2}s`}
								repeatCount="indefinite"
							/>
						</>
					)}
				</circle>
			))}
			<path d="M315 45c-8-9-13-15-13-21a13 13 0 0 1 26 0c0 6-5 12-13 21z" fill="#fff" />
			<circle cx={315} cy={24} r={5} fill="#ea580c" />
			<g transform={still ? 'translate(175 105)' : undefined}>
				<Car />
				{!still && (
					<animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path={route} />
				)}
			</g>
			<g transform="translate(256 132)">
				<rect width={134} height={42} rx={12} fill="#fff" />
				<circle cx={21} cy={21} r={12} fill="#ffedd5" />
				<rect x={14} y={16} width={14} height={10} rx={3} fill="#ea580c" />
				<text x={40} y={18} fontSize={11} fontWeight={700} fill="#1d2433">
					Driver found
				</text>
				<text x={40} y={32} fontSize={9.5} fill="#64748b">
					Arriving in 2 min
				</text>
			</g>
		</>
	);
}

/** A film playing live on a TV, sent out to a phone and a tablet too. */
function VideoPoster({ uid, still }: PosterProps) {
	const dark = '#3b0a24';
	const screen = `url(#${uid}-screen)`;
	return (
		<>
			<Backdrop uid={uid} from="#f472b6" to="#9d174d" />
			<defs>
				<linearGradient id={`${uid}-screen`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#be185d" />
					<stop offset="1" stopColor="#4c0519" />
				</linearGradient>
				<clipPath id={`${uid}-clip`}>
					<rect x={118} y={36} width={164} height={96} rx={7} />
				</clipPath>
			</defs>
			{[110, 150, 190, 230].map((r) => (
				<circle
					key={r}
					cx={200}
					cy={88}
					r={r}
					fill="none"
					stroke="#fff"
					strokeOpacity={0.08}
					strokeWidth={2}
				/>
			))}
			<Trail d="M108 104Q90 94 72 104" width={6} />
			<Trail d="M292 100Q308 90 324 100" width={6} />

			<rect
				x={110}
				y={28}
				width={180}
				height={112}
				rx={12}
				fill={dark}
				stroke="#fff"
				strokeOpacity={0.2}
			/>
			<g clipPath={`url(#${uid}-clip)`}>
				<rect x={118} y={36} width={164} height={96} fill={screen} />
				<circle cx={252} cy={62} r={12} fill="#fbcfe8" fillOpacity={0.5} />
				<path
					d="M118 132L160 92L188 114L222 80L282 132Z"
					fill="#f9a8d4"
					fillOpacity={0.3}
				/>
			</g>
			<rect x={124} y={42} width={30} height={14} rx={4} fill="#ef4444" />
			<text x={139} y={52} textAnchor="middle" fontSize={8} fontWeight={800} fill="#fff">
				LIVE
			</text>
			<text x={274} y={52} textAnchor="end" fontSize={8.5} fill="#fff" fillOpacity={0.85}>
				1.2M watching
			</text>
			<circle cx={200} cy={84} r={20} fill="#fff" />
			<path d="M194 74.5L211 84L194 93.5Z" fill="#db2777" />
			<rect x={128} y={120} width={144} height={4} rx={2} fill="#fff" fillOpacity={0.25} />
			<rect x={128} y={120} width={104} height={4} rx={2} fill="#fff" fillOpacity={0.3} />
			<rect x={128} y={120} width={still ? 72 : 0} height={4} rx={2} fill="#fff">
				{!still && (
					<animate
						attributeName="width"
						values="0;144"
						dur="12s"
						repeatCount="indefinite"
					/>
				)}
			</rect>
			<rect x={190} y={140} width={20} height={8} fill={dark} />
			<rect x={170} y={148} width={60} height={5} rx={2.5} fill={dark} />

			<rect
				x={28}
				y={84}
				width={40}
				height={70}
				rx={8}
				fill={dark}
				stroke="#fff"
				strokeOpacity={0.2}
			/>
			<rect x={32} y={92} width={32} height={52} rx={4} fill={screen} />
			<path d="M44 112L54 118L44 124Z" fill="#fff" fillOpacity={0.9} />

			<rect
				x={326}
				y={66}
				width={58}
				height={82}
				rx={8}
				fill={dark}
				stroke="#fff"
				strokeOpacity={0.2}
			/>
			<rect x={331} y={73} width={48} height={66} rx={4} fill={screen} />
			<path d="M350 100L362 106L350 112Z" fill="#fff" fillOpacity={0.9} />
		</>
	);
}

/** Money leaves one phone, passes through the bank, and lands on another. */
function UpiPoster({ uid, still }: PosterProps) {
	const route = 'M126 118C170 118 170 92 200 92C230 92 230 118 274 118';
	const phone = '#022c22';
	return (
		<>
			<Backdrop uid={uid} from="#34d399" to="#047857" />
			<g fill="#fff" fillOpacity={0.07} fontWeight={800}>
				<text x={330} y={210} fontSize={160}>
					₹
				</text>
				<text x={-10} y={90} fontSize={110}>
					₹
				</text>
			</g>

			<g fill="#fff">
				<path d="M170 38L200 18L230 38Z" />
				<rect x={172} y={40} width={56} height={4} rx={1} />
				{[177, 190, 203, 216].map((x) => (
					<rect key={x} x={x} y={46} width={7} height={18} rx={1} />
				))}
				<rect x={168} y={66} width={64} height={5} rx={1.5} />
			</g>
			<path
				d="M200 74V88"
				stroke="#fff"
				strokeOpacity={0.6}
				strokeWidth={2}
				strokeDasharray="2 3"
			/>
			<Trail d={route} />

			<rect
				x={70}
				y={62}
				width={56}
				height={104}
				rx={11}
				fill={phone}
				stroke="#fff"
				strokeOpacity={0.25}
			/>
			<rect x={76} y={72} width={44} height={84} rx={6} fill="#ecfdf5" />
			<text x={98} y={90} textAnchor="middle" fontSize={7.5} fill="#64748b">
				Paying
			</text>
			<text x={98} y={112} textAnchor="middle" fontSize={15} fontWeight={800} fill="#064e3b">
				₹500
			</text>
			<rect x={82} y={132} width={32} height={13} rx={6.5} fill="#059669" />
			<text x={98} y={141.5} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#fff">
				Pay
			</text>

			<rect
				x={274}
				y={62}
				width={56}
				height={104}
				rx={11}
				fill={phone}
				stroke="#fff"
				strokeOpacity={0.25}
			/>
			<rect x={280} y={72} width={44} height={84} rx={6} fill="#ecfdf5" />
			<circle cx={302} cy={104} r={14} fill="#10b981" />
			<path
				d="M295 104l5 5 9-10"
				fill="none"
				stroke="#fff"
				strokeWidth={3}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<text
				x={302}
				y={134}
				textAnchor="middle"
				fontSize={7.5}
				fontWeight={700}
				fill="#065f46"
			>
				Received
			</text>
			<text x={302} y={146} textAnchor="middle" fontSize={9} fontWeight={800} fill="#064e3b">
				₹500
			</text>

			<rect x={158} y={156} width={84} height={20} rx={10} fill="#fff" fillOpacity={0.95} />
			<text
				x={200}
				y={169.5}
				textAnchor="middle"
				fontSize={9}
				fontWeight={700}
				fill="#065f46"
			>
				Done in 2 sec
			</text>

			<g transform={still ? 'translate(200 92)' : undefined}>
				<circle r={10} fill="#fbbf24" stroke="#fff" strokeWidth={2} />
				<text
					textAnchor="middle"
					dominantBaseline="central"
					fontSize={11}
					fontWeight={800}
					fill="#78350f"
				>
					₹
				</text>
				{!still && <animateMotion dur="3s" repeatCount="indefinite" path={route} />}
			</g>
		</>
	);
}

/** Where the shelves sit, and the boxes on them: [x, shelf, width, height, colour]. */
const SHELVES = [72, 122, 172];

const BOXES: [x: number, shelf: number, w: number, h: number, color: string][] = [
	[68, 72, 28, 34, '#fcd34d'],
	[100, 72, 24, 40, '#fda4af'],
	[128, 72, 30, 30, '#fde68a'],
	[162, 72, 20, 22, '#c7d2fe'],
	[70, 122, 36, 28, '#fde68a'],
	[110, 122, 26, 38, '#a5b4fc'],
	[140, 122, 40, 26, '#fcd34d'],
	[68, 172, 30, 40, '#f9a8d4'],
	[102, 172, 34, 30, '#fcd34d'],
	[140, 172, 24, 36, '#fde68a'],
	[220, 72, 36, 30, '#a5b4fc'],
	[260, 72, 28, 38, '#fcd34d'],
	[292, 72, 38, 26, '#fda4af'],
	[218, 122, 30, 36, '#fcd34d'],
	[252, 122, 26, 28, '#fde68a'],
	[282, 122, 22, 40, '#c7d2fe'],
	[308, 122, 24, 30, '#f9a8d4'],
	[220, 172, 40, 34, '#fde68a'],
	[264, 172, 30, 28, '#a5b4fc'],
	[298, 172, 34, 38, '#fcd34d'],
];

/** Boxes on shelves; a scanner sweeps one rack, and a tag shows what's in stock. */
function StockPoster({ uid }: PosterProps) {
	return (
		<>
			<Backdrop uid={uid} from="#818cf8" to="#312e81" />
			<defs>
				<linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#f43f5e" stopOpacity={0} />
					<stop offset="0.5" stopColor="#f43f5e" stopOpacity={0.35} />
					<stop offset="1" stopColor="#f43f5e" stopOpacity={0} />
				</linearGradient>
			</defs>
			<ellipse cx={200} cy={184} rx={170} ry={8} fill="#1e1b4b" fillOpacity={0.3} />
			{[60, 210].map((x) => (
				<g key={x} fill="#e0e7ff">
					<rect x={x} y={26} width={5} height={156} rx={1} />
					<rect x={x + 125} y={26} width={5} height={156} rx={1} />
					{SHELVES.map((y) => (
						<rect key={y} x={x} y={y} width={130} height={5} rx={1} />
					))}
				</g>
			))}
			{BOXES.map(([x, shelf, w, h, color]) => (
				<g key={`${x}:${shelf}`}>
					<rect x={x} y={shelf - h} width={w} height={h} rx={3} fill={color} />
					<rect
						x={x + w / 2 - 3}
						y={shelf - h}
						width={6}
						height={h}
						fill="#fff"
						fillOpacity={0.3}
					/>
				</g>
			))}
			<g className="scan-sweep">
				<rect x={206} y={24} width={138} height={16} fill={`url(#${uid}-beam)`} />
				<rect x={206} y={31} width={138} height={2.5} rx={1.25} fill="#f43f5e" />
			</g>
			<g transform="translate(284 8)">
				<rect width={104} height={34} rx={9} fill="#fff" />
				<circle cx={14} cy={17} r={5} fill="#22c55e" />
				<text x={26} y={15} fontSize={9.5} fontWeight={700} fill="#1d2433">
					Blue mug
				</text>
				<text x={26} y={27} fontSize={8.5} fontWeight={600} fill="#4f46e5">
					12 in stock
				</text>
			</g>
			<g transform="translate(4 146)">
				<rect width={50} height={22} rx={11} fill="#fff" fillOpacity={0.95} />
				<text
					x={25}
					y={14.5}
					textAnchor="middle"
					fontSize={8.5}
					fontWeight={700}
					fill="#3730a3"
				>
					3 stores
				</text>
			</g>
		</>
	);
}

const POSTERS: Record<string, (props: PosterProps) => ReactNode> = {
	'ride-hailing': RidePoster,
	'video-streaming': VideoPoster,
	'upi-payments': UpiPoster,
	stockroom: StockPoster,
};
