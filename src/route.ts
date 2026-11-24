import { useSyncExternalStore } from 'react';
import { lessonsOf } from '@/learn/lessons';
import { allSystems } from '@/systems';

/**
 * Which page you're on, kept in the URL's hash (#/ride-hailing/learn/request-ride/3),
 * so links, bookmarks and the back button work on any static host, from any
 * folder, with no server to send every path to the app (ADR 0007).
 */
export type Mode =
	{ kind: 'learn'; lessonId: string; /** From 0. */ step: number } | { kind: 'explore' };

export type Route = { page: 'home' } | { page: 'system'; systemId: string; mode: Mode };

export const homeHref = '#/';
export const systemHref = (systemId: string) => `#/${systemId}`;
export const lessonHref = (systemId: string, lessonId: string, step = 0) =>
	`#/${systemId}/learn/${lessonId}${step > 0 ? `/${step + 1}` : ''}`;
export const exploreHref = (systemId: string) => `#/${systemId}/explore`;

/**
 * Reads a route from a hash. An unknown system is the home page; an unknown
 * lesson in a known system is its first lesson.
 */
export function parseRoute(hash: string): Route {
	const [systemId = '', section, target, step] = hash
		.replace(/^#\/?/, '')
		.split('?')[0]!
		.split('/')
		.filter(Boolean);
	const system = allSystems.find((s) => s.id === systemId);
	if (!system) return { page: 'home' };
	const at = (mode: Mode): Route => ({ page: 'system', systemId, mode });

	if (section === 'explore') return at({ kind: 'explore' });
	const lessons = lessonsOf(system).map((l) => l.id);
	const lessonId = section === 'learn' && lessons.includes(target ?? '') ? target! : lessons[0]!;
	const n = Number(step);
	return at({ kind: 'learn', lessonId, step: Number.isInteger(n) && n > 1 ? n - 1 : 0 });
}

/** Goes to a page without adding to the history, e.g. for each step of a lesson. */
export function replaceRoute(href: string) {
	window.location.replace(href);
}

function subscribe(onChange: () => void) {
	window.addEventListener('hashchange', onChange);
	return () => window.removeEventListener('hashchange', onChange);
}

/** The current route, kept up to date as the hash changes. */
export function useRoute(): Route {
	const hash = useSyncExternalStore(
		subscribe,
		() => window.location.hash,
		() => '',
	);
	return parseRoute(hash);
}
