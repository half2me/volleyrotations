import type { Point } from './model.js';

/** Keeps the part of a convex polygon on the side of the line where `inside` is non-negative. */
function clip(polygon: Point[], inside: (p: Point) => number): Point[] {
	const out: Point[] = [];
	for (let i = 0; i < polygon.length; i++) {
		const a = polygon[i];
		const b = polygon[(i + 1) % polygon.length];
		const da = inside(a);
		const db = inside(b);
		if (da >= 0) out.push(a);
		if (da >= 0 !== db >= 0) {
			const t = da / (da - db);
			out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
		}
	}
	return out;
}

/**
 * The area each player is responsible for: every point of the region closer to them than to any
 * teammate in `players` (a Voronoi cell). It is a teaching simplification: real responsibility
 * also depends on the block and the hitter, but "the balls nearest you are yours" holds.
 */
export function coverageAreas(
	players: Point[],
	region: { x0: number; y0: number; x1: number; y1: number }
): Point[][] {
	const box: Point[] = [
		{ x: region.x0, y: region.y0 },
		{ x: region.x1, y: region.y0 },
		{ x: region.x1, y: region.y1 },
		{ x: region.x0, y: region.y1 }
	];
	return players.map((p, i) =>
		players.reduce((cell, q, j) => {
			if (i === j || cell.length === 0) return cell;
			const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
			const dir = { x: p.x - q.x, y: p.y - q.y };
			return clip(cell, (r) => (r.x - mid.x) * dir.x + (r.y - mid.y) * dir.y);
		}, box)
	);
}
