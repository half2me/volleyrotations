import type { Point } from './model.js';

/**
 * A still diagram of a drill or a match situation, drawn by DrillCourt on a Court. Coordinates
 * are metres on our half as everywhere else: x 0–9 (0–8 on sand) from the left sideline, y from
 * the net towards our end line, so the opponents' side is negative y and the service zone runs
 * past the end line. Kept free of Svelte and Paraglide so the data files can be loaded anywhere.
 */
export type Text = { en: string; hu: string };

export type DiagramPlayer = {
	/**
	 * Up to three characters on the token. A role id (S, OH1, L…) is translated like every other
	 * token; a `Text` picks the locale's letters; a plain string is drawn as it is. A coach needs
	 * no label.
	 */
	label?: string | Text;
	x: number;
	y: number;
	/** Opponents are hollow, the coach is a square. */
	kind?: 'team' | 'libero' | 'coach' | 'opponent';
	/** Where the same player started, drawn pale next to a movement arrow. */
	faded?: boolean;
};

export type Diagram = {
	players: DiagramPlayer[];
	/** The ball's flights in order; the ball itself is drawn leaving the first one. */
	ball?: { from: Point; to: Point }[];
	/** Where players run. */
	moves?: { from: Point; to: Point; dashed?: boolean }[];
	/** Cones or spots to aim at. */
	targets?: Point[];
	/** Marked-out boxes, such as corners drawn in the sand. `y` is the edge nearer the net. */
	areas?: { x: number; y: number; w: number; h: number }[];
	/** Draw the opponents' whole half, not just a strip of it. */
	bothHalves?: boolean;
	/** Zone numbers on our half (indoor only). */
	zones?: boolean;
};

export const pt = (x: number, y: number): Point => ({ x, y });

export const player = (
	label: DiagramPlayer['label'],
	x: number,
	y: number,
	kind?: DiagramPlayer['kind']
): DiagramPlayer => (kind ? { label, x, y, kind } : { label, x, y });

export const opponent = (label: DiagramPlayer['label'], x: number, y: number): DiagramPlayer =>
	player(label, x, y, 'opponent');

export const coach = (x: number, y: number): DiagramPlayer => ({ x, y, kind: 'coach' });

/** Every point a diagram draws something at, for working out how much court to show. */
export function diagramPoints(d: Diagram): Point[] {
	return [
		...d.players,
		...(d.ball ?? []).flatMap((f) => [f.from, f.to]),
		...(d.moves ?? []).flatMap((f) => [f.from, f.to]),
		...(d.targets ?? []),
		...(d.areas ?? []).flatMap((a) => [pt(a.x, a.y), pt(a.x + a.w, a.y + a.h)])
	];
}
