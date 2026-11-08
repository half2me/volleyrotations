import { COLUMN_PAIRS, ROW_ORDER, type Point, type Zone } from './model.js';

/**
 * One broken relation from FIVB rule 7.4.2: a back-row player not behind their front-row partner
 * (`depth`), or two neighbours in a row out of left-to-right order (`side`).
 */
export type OverlapFault = { kind: 'depth' | 'side'; a: Zone; b: Zone };

/**
 * Players are judged as points. The real rule compares feet (7.4.3), so being level is legal,
 * and a tiny tolerance keeps players placed exactly level from flickering in the trainer.
 */
const LEVEL = 0.001;

/**
 * Every fault in a formation. `exempt` lists zones the rule does not apply to, such as the
 * server's zone 1, who stands outside the court.
 */
export function overlapFaults(
	positions: Partial<Record<Zone, Point>>,
	exempt: readonly Zone[] = []
): OverlapFault[] {
	const faults: OverlapFault[] = [];
	const checked = (z: Zone) => positions[z] && !exempt.includes(z);
	for (const [front, back] of COLUMN_PAIRS) {
		if (!checked(front) || !checked(back)) continue;
		if (positions[back]!.y < positions[front]!.y - LEVEL)
			faults.push({ kind: 'depth', a: front, b: back });
	}
	for (const [left, right] of ROW_ORDER) {
		if (!checked(left) || !checked(right)) continue;
		if (positions[left]!.x > positions[right]!.x + LEVEL)
			faults.push({ kind: 'side', a: left, b: right });
	}
	return faults;
}

type Body = { zone: Zone; p: Point; weight: number };

/**
 * Moves players the least it can to make a formation legal with a visible gap, so diagrams show
 * the relation clearly. Heavier players move less: a passer stays on their spot while the setter
 * hiding behind them gives way. Constraints are a few chains, so relaxing them pairwise converges.
 */
export function makeLegal(
	positions: Record<Zone, Point>,
	weights: Partial<Record<Zone, number>> = {},
	exempt: readonly Zone[] = [],
	gap = 0.45
): Record<Zone, Point> {
	const bodies = new Map<Zone, Body>();
	for (const [z, p] of Object.entries(positions)) {
		const zone = Number(z) as Zone;
		bodies.set(zone, { zone, p: { ...p }, weight: weights[zone] ?? 1 });
	}
	const live = (z: Zone) => !exempt.includes(z);
	const push = (lo: Body, hi: Body, axis: 'x' | 'y') => {
		const deficit = lo.p[axis] + gap - hi.p[axis];
		if (deficit <= 0) return false;
		const total = 1 / lo.weight + 1 / hi.weight;
		lo.p[axis] -= (deficit * (1 / lo.weight)) / total;
		hi.p[axis] += (deficit * (1 / hi.weight)) / total;
		return true;
	};
	const clamp = (b: Body) => {
		b.p.x = Math.min(8.7, Math.max(0.3, b.p.x));
		b.p.y = Math.min(8.8, Math.max(0.4, b.p.y));
	};
	for (let i = 0; i < 200; i++) {
		let moved = false;
		for (const [front, back] of COLUMN_PAIRS) {
			if (live(front) && live(back))
				moved = push(bodies.get(front)!, bodies.get(back)!, 'y') || moved;
		}
		for (const [left, right] of ROW_ORDER) {
			if (live(left) && live(right))
				moved = push(bodies.get(left)!, bodies.get(right)!, 'x') || moved;
		}
		for (const b of bodies.values()) if (live(b.zone)) clamp(b);
		if (!moved) break;
	}
	return Object.fromEntries([...bodies].map(([z, b]) => [z, b.p])) as Record<Zone, Point>;
}
