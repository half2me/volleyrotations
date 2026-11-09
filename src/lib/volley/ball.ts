import { TARGET, type AttackFrom, type Options, type Phase, type Placed } from './formations.js';
import type { Point, RoleId } from './model.js';

/** One flight of the ball, from a contact (or the far side) to the next. */
export type Flight = {
	from: Point;
	to: Point;
	/** What sends it: sets the arc's height and speed. */
	kind: 'serve' | 'pass' | 'set' | 'attack' | 'dig' | 'block';
};

/** The far edge of the diagram, where a ball comes from or goes to on the opponents' side. */
const FAR = -1.2;

/** Where the opponents' hitter attacks from, named from their side: their outside hits at our right. */
const ATTACKER: Record<AttackFrom, Point> = {
	outside: { x: 7.4, y: -0.5 },
	middle: { x: 4.2, y: -0.5 },
	opposite: { x: 1.6, y: -0.5 }
};

const nearest = (players: Placed[], to: Point): Placed | undefined =>
	players.map((p) => ({ p, d: Math.hypot(p.x - to.x, p.y - to.y) })).sort((a, b) => a.d - b.d)[0]
		?.p;

/** The reader if they are among `players`, else the one nearest `spot`. */
const pick = (players: Placed[], you: RoleId | undefined, spot: Point): Placed | undefined =>
	players.find((p) => p.role === you) ?? nearest(players, spot);

/** Where a player plays the ball: the spot they run to if they have one, else where they stand. */
const at = (p: Placed): Point => p.run ?? { x: p.x, y: p.y };

/**
 * The ball's path through one moment of a rally, as the flights it makes between contacts, so
 * a diagram can show not only where everyone stands but what they are standing there for. The
 * reader's player gets the ball when their task allows it.
 */
export function ballPath(o: Options, phase: Phase, placed: Placed[], you?: RoleId): Flight[] {
	const setter = placed.find((p) => p.setter);
	const target = setter ? at(setter) : TARGET;
	switch (phase) {
		case 'receive': {
			// Their server stands in their zone 1, at our top left; the pass goes to the target.
			const passer = pick(
				placed.filter((p) => p.task === 'pass'),
				you,
				{ x: 4.5, y: 6 }
			);
			if (!passer) return [];
			const land = { x: passer.x, y: passer.y };
			return [
				{ from: { x: 1.8, y: FAR }, to: land, kind: 'serve' },
				{ from: land, to: target, kind: 'pass' }
			];
		}
		case 'serve': {
			const server = placed.find((p) => p.task === 'serve');
			if (!server) return [];
			return [
				{ from: { x: server.x, y: server.y }, to: { x: 9 - server.x * 0.6, y: FAR }, kind: 'serve' }
			];
		}
		case 'base':
			return [];
		case 'defense': {
			if (o.incoming === 'free') {
				const passer = pick(
					placed.filter((p) => p.task === 'pass'),
					you,
					{ x: 4.5, y: 5.5 }
				);
				if (!passer) return [];
				const land = { x: passer.x, y: passer.y };
				return [
					{ from: { x: 4.5, y: FAR }, to: land, kind: 'pass' },
					{ from: land, to: target, kind: 'pass' }
				];
			}
			// Their hitter swings cross-court, the usual shot, to the deep digger opposite them.
			const hitter = ATTACKER[o.attackFrom];
			const crossCourt = { x: 9 - hitter.x, y: 6.6 };
			const digger = pick(
				placed.filter((p) => p.task === 'dig' || p.task === 'tip'),
				you,
				crossCourt
			);
			if (!digger) return [];
			const land = { x: digger.x, y: digger.y };
			return [
				{ from: hitter, to: land, kind: o.incoming === 'down' ? 'pass' : 'attack' },
				{ from: land, to: target, kind: 'dig' }
			];
		}
		case 'attack': {
			const hitters = placed.filter((p) => p.task === 'attack' && p.run);
			const hitter = pick(hitters, you, { x: 1, y: 1 });
			if (!hitter?.run) return [];
			const h = hitter.run;
			// A wing hitter swings cross-court; a middle hits straight down.
			const to = { x: h.x < 3 ? 7.6 : h.x > 6 ? 1.4 : h.x + 0.8, y: FAR };
			return [
				{ from: target, to: h, kind: 'set' },
				{ from: h, to, kind: 'attack' }
			];
		}
		case 'cover': {
			const hitter = placed.find((p) => p.task === 'attack');
			if (!hitter) return [];
			const h = { x: hitter.x, y: hitter.y };
			const net = { x: h.x + (4.5 - h.x) * 0.1, y: -0.15 };
			// Blocked straight back: a short ball into the cup behind the hitter.
			const back = { x: h.x + (4.5 - h.x) * 0.35, y: h.y + 2.4 };
			return [
				{ from: target, to: h, kind: 'set' },
				{ from: h, to: net, kind: 'attack' },
				{ from: net, to: back, kind: 'block' }
			];
		}
	}
}
