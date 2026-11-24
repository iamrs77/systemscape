import { useEffect, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/**
 * Where things that float over the page (a word's meaning, a dialog) go: into
 * whatever fills the screen, since only it is shown, or else the page.
 */
export const floatingRoot = (): Element => document.fullscreenElement ?? document.body;

function leaveBrowserFullScreen() {
	if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

/**
 * Shows an element on the whole screen: the browser's own full screen where it
 * has one (Escape leaves it), else the element just covers the page. `full`
 * tells the element to lay itself out for that.
 */
export function useFullScreen(element: RefObject<HTMLElement | null>) {
	const [full, setFull] = useState(false);

	const enter = () => {
		// laid out for the whole screen first, so that's how the browser shows it
		flushSync(() => setFull(true));
		if (document.fullscreenEnabled) element.current?.requestFullscreen().catch(() => {});
	};
	const leave = () => {
		setFull(false);
		leaveBrowserFullScreen();
	};

	useEffect(() => {
		if (!full) return;
		const onChange = () => {
			if (!document.fullscreenElement) setFull(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			setFull(false);
			leaveBrowserFullScreen();
		};
		// the page behind mustn't scroll
		const root = document.documentElement;
		const overflow = root.style.overflow;
		root.style.overflow = 'hidden';
		document.addEventListener('fullscreenchange', onChange);
		document.addEventListener('keydown', onKey);
		return () => {
			root.style.overflow = overflow;
			document.removeEventListener('fullscreenchange', onChange);
			document.removeEventListener('keydown', onKey);
		};
	}, [full]);

	return { full, toggle: full ? leave : enter };
}
