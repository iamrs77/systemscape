import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia; behave like a wide screen with no motion preference
if (!window.matchMedia) {
	window.matchMedia = (query: string) =>
		({
			matches: query.includes('min-width'),
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false,
		}) as MediaQueryList;
}

// jsdom doesn't lay anything out, so there's nothing to scroll
Element.prototype.scrollIntoView ??= () => {};
