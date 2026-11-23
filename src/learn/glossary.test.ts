import { describe, expect, it } from 'vitest';
import { parseSystem } from '@/model/parseSystem';
import { rideHailing } from '@/systems/rideHailing';
import { annotate, glossary, namesOf, type Piece } from './glossary';
import { lessonsFor, OVERVIEW } from './lessons';

const system = parseSystem(rideHailing);

/** The glossary words found, in order. */
const words = (pieces: Piece[][]) =>
	pieces.flat().flatMap((p) => (p.kind === 'term' ? [`${p.text}=${p.id}`] : []));
/** The text back again, as it was written (without the ** marks). */
const text = (pieces: Piece[]) => pieces.map((p) => p.text).join('');

describe('the glossary', () => {
	it('explains each word once, in a line, in lower case forms that point to one word only', () => {
		const ids = glossary.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
		const forms = glossary.flatMap((t) => t.forms);
		expect(new Set(forms).size).toBe(forms.length);
		for (const term of glossary) {
			expect(term.meaning.length, term.term).toBeLessThan(170);
			for (const form of term.forms) expect(form).toBe(form.toLowerCase());
		}
	});
});

describe('annotate', () => {
	it('marks a word the first time it appears, across every text on the card', () => {
		const pieces = annotate([
			'A request goes to a server.',
			'Every request waits for the server.',
		]);
		expect(words(pieces)).toEqual(['request=request', 'server=server']);
		expect(text(pieces[1]!)).toBe('Every request waits for the server.');
	});

	it('knows a word in its other forms, whatever the case', () => {
		expect(words(annotate(['Requests are Retried, then Sharded.']))).toEqual([
			'Requests=request',
			'Retried=retry',
			'Sharded=shard',
		]);
	});

	it('prefers the longer phrase', () => {
		expect(words(annotate(['Turn on circuit breakers, then check the cache miss.']))).toEqual([
			'circuit breakers=circuit-breaker',
			'cache miss=cache-miss',
		]);
	});

	it('only matches whole words', () => {
		expect(words(annotate(['The requested metadata is overcached.']))).toEqual([]);
		expect(words(annotate(['Autoscaling is a kind of scaling.']))).toEqual([
			'Autoscaling=autoscaling',
			'scaling=scaling',
		]);
	});

	it('explains the words in a part’s name, and keeps it bold', () => {
		const pieces = annotate(['**Driver location index** keeps a cache.'], namesOf(system));
		expect(words(pieces)).toEqual(['index=index', 'cache=cache']);
		expect(pieces[0]!.slice(0, 2)).toEqual([
			{ kind: 'text', text: 'Driver location ', strong: true },
			{ kind: 'term', text: 'index', id: 'index', strong: true },
		]);
	});

	it('leaves the names of journeys alone', () => {
		const pieces = annotate(['“Request a ride” sends a request.'], namesOf(system));
		expect(words(pieces)).toEqual(['request=request']);
		expect(text(pieces[0]!)).toBe('“Request a ride” sends a request.');
	});

	it('explains the words a newcomer meets in the lessons', () => {
		const lessons = lessonsFor(system);
		const step = (lesson: string, title: string) => {
			const found = lessons
				.find((l) => l.id === lesson)!
				.steps.find((s) => s.title === title)!;
			return words(annotate(found.body, namesOf(system))).map((w) => w.split('=')[1]);
		};
		expect(step(OVERVIEW, 'The front door')).toEqual(
			expect.arrayContaining(['request', 'gateway', 'real-time', 'live-connection']),
		);
		expect(step(OVERVIEW, 'The data')).toEqual(
			expect.arrayContaining(['copy', 'shard', 'in-memory', 'cache', 'index', 'database']),
		);
	});
});
