/**
 * The 3D poses of every referee signal and line-judge flag signal in `src/lib/signals.ts`, keyed
 * by id, plus the beach blocker's partner signals. Each figure gives a list of frames: functions
 * that pose the mannequin, in the order the sprite sheet stores them.
 *
 * Shapes of a figure:
 *   - a held signal: frames go from rest to the signal (`rise` frames), and the page plays them
 *     forwards, holds, and plays them back;
 *   - a loop: `rise` frames from rest into the movement, then a cycle the page repeats;
 *   - `pingPong`: a cycle the page plays forwards and backwards.
 * `still` is the frame shown to readers who prefer reduced motion.
 *
 * Coordinates are head heights: x to the referee's left (the viewer's right), y up, z towards
 * the viewer. Shoulders are at (±0.82, 2.9, 0). The referee's right arm is `R`, on the viewer's
 * left.
 */
import { SHOULDER_X, SHOULDER_Y } from './mannequin.mjs';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const RISE = 10;
const LOOP = 12;

/**
 * Frames blending from the rest pose into `signal` (a function posing the figure). The arms go
 * up through the front of the body, as a referee's do, by way of a midway keyframe; a straight
 * blend would swing them out sideways and widen the picture.
 */
function hold(signal, { still } = {}) {
	return {
		frames: (fig) => {
			fig.rest(fig.R);
			fig.rest(fig.L);
			const a = fig.snapshot();
			const restWrists = [fig.wristAt(fig.R), fig.wristAt(fig.L)];
			signal(fig);
			const b = fig.snapshot();
			for (const [A, w0] of [
				[fig.R, restWrists[0]],
				[fig.L, restWrists[1]]
			]) {
				const w1 = fig.wristAt(A);
				const moved = Math.hypot(w1[0] - w0[0], w1[1] - w0[1], w1[2] - w0[2]);
				if (moved < 0.6) continue;
				const mid = [(w0[0] + w1[0]) / 2, (w0[1] + w1[1]) / 2 + 0.2, Math.max(w0[2], w1[2]) + 0.9];
				fig.reach(A, mid, [A.side * 3, SHOULDER_Y - 1.5, 0.6]);
			}
			const m = fig.snapshot();
			return Array.from({ length: RISE }, (_, i) => () => {
				const t = easeOut(i / (RISE - 1));
				if (t < 0.5) fig.blend(a, m, t * 2);
				else fig.blend(m, b, (t - 0.5) * 2);
				fig.root.updateMatrixWorld(true);
			});
		},
		rise: RISE,
		still: still ?? RISE - 1
	};
}

/** Frames from rest into `cycle(0)`, then `cycle(phase)` for one turn. */
function loop(cycle, { pingPong = false, steps = LOOP, still } = {}) {
	return {
		frames: (fig) => {
			fig.rest(fig.R);
			fig.rest(fig.L);
			const a = fig.snapshot();
			cycle(fig, 0);
			const b = fig.snapshot();
			const rise = Array.from({ length: 6 }, (_, i) => () => {
				fig.blend(a, b, easeOut(i / 5));
				fig.root.updateMatrixWorld(true);
			});
			const turn = Array.from({ length: steps }, (_, i) => () => {
				cycle(fig, pingPong ? easeInOut(i / (steps - 1)) : i / steps);
				fig.root.updateMatrixWorld(true);
			});
			return [...rise, ...turn];
		},
		rise: 6,
		still: still ?? 6 + Math.floor(steps / 4),
		loop: true,
		pingPong
	};
}

const withProps = (figure, props) => ({
	...figure,
	frames: (fig) => {
		const frames = figure.frames(fig);
		fig.showProps(props);
		return frames;
	}
});

/** Shorthands for a side: the right arm's x is negative. */
const sx = (A, x) => A.side * x;
/** An arm straight up beside the head, palm forward. */
function up(fig, A, { palm = [0, 0, 1], tilt = 0 } = {}) {
	const s = A.side;
	fig.reach(A, [s * (SHOULDER_X + 0.25 + tilt), SHOULDER_Y + 2.62, 0.1], [s * 4, SHOULDER_Y, 0.5]);
	fig.straight(A, palm);
}
/** An arm out to the side at shoulder height, palm forward. */
function out(fig, A) {
	const s = A.side;
	fig.reach(A, [s * (SHOULDER_X + 2.65), SHOULDER_Y - 0.05, 0.1], [s * 2, SHOULDER_Y - 2, 0.5]);
	fig.straight(A, [0, 0, 1]);
}
/** A forearm upright in front of the shoulder, palm towards the body or forward. */
function forearmUp(fig, A, palm) {
	const s = A.side;
	fig.reach(A, [s * (SHOULDER_X + 0.3), SHOULDER_Y + 0.9, 1.05], [s * 2.2, SHOULDER_Y - 1.6, 0.9]);
	fig.orient(A, [s * 0.1, 1, 0.1], palm);
}
const restArm = (fig, A) => fig.rest(A);

/** A card raised overhead. */
const raiseCard = (prop) =>
	withProps(
		hold((fig) => {
			up(fig, fig.R, { tilt: 0.2 });
			fig.orient(fig.R, [-0.1, 1, 0.1], [0, 0, 1]);
			fig.shape(fig.R, 'pinch');
			restArm(fig, fig.L);
		}),
		prop
	);

/** Forearms crossed in front of the chest, hands open, palms to the body. */
const crossed = hold((fig) => {
	fig.reach(fig.R, [0.75, SHOULDER_Y + 0.35, 1.05], [-2.4, SHOULDER_Y - 1.4, 1.0]);
	fig.orient(fig.R, [0.6, 1, 0.1], [0, -0.1, -1]);
	fig.shape(fig.R, 'open');
	fig.reach(fig.L, [-0.75, SHOULDER_Y + 0.35, 0.85], [2.4, SHOULDER_Y - 1.4, 1.0]);
	fig.orient(fig.L, [-0.6, 1, 0.1], [0, -0.1, -1]);
	fig.shape(fig.L, 'open');
});

/** The T, or the brush: the left hand upright at the chest, the right hand flat on its tips. */
function tee(fig, dx = 0) {
	fig.reach(fig.L, [0.15, SHOULDER_Y - 0.55, 0.95], [1.4, SHOULDER_Y - 1.5, 0.6]);
	fig.orient(fig.L, [0, 1, 0], [-1, 0, 0.1]);
	fig.shape(fig.L, 'open', 0.3);
	fig.reach(fig.R, [-0.35 + dx, SHOULDER_Y + 0.25, 1.0], [-1.6, SHOULDER_Y - 0.7, 0.4]);
	fig.orient(fig.R, [1, 0, 0], [0, -1, 0.15]);
	fig.shape(fig.R, 'open', 0.3);
}

export const FIGURES = {
	// ---- referees' hand signals, FIVB Diagram 11 ----
	'authorise-serve': {
		// The arm starts across the chest and sweeps out to the side.
		...hold((fig) => {
			out(fig, fig.R);
			fig.shape(fig.R, 'open');
			restArm(fig, fig.L);
		}),
		frames: (fig) => {
			fig.rest(fig.L);
			fig.reach(fig.R, [0.9, SHOULDER_Y - 0.3, 1.0], [-2.2, SHOULDER_Y - 1.5, 0.6]);
			fig.orient(fig.R, [1, 0.2, 0], [0, 0, 1]);
			fig.shape(fig.R, 'open');
			const a = fig.snapshot();
			out(fig, fig.R);
			fig.shape(fig.R, 'open');
			const b = fig.snapshot();
			return Array.from({ length: RISE }, (_, i) => () => {
				fig.blend(a, b, easeInOut(i / (RISE - 1)));
				fig.root.updateMatrixWorld(true);
			});
		}
	},
	'team-to-serve': hold((fig) => {
		out(fig, fig.R);
		fig.shape(fig.R, 'open');
		restArm(fig, fig.L);
	}),
	'change-courts': loop(
		(fig, p) => {
			// Forearms level, one in front of the body and one behind, turning around it.
			const th = p * 2 * Math.PI;
			for (const A of [fig.R, fig.L]) {
				const a = th + (A === fig.L ? Math.PI : 0);
				const x = 0.95 * Math.sin(a);
				const z = 0.95 * Math.cos(a);
				fig.reach(A, [x, SHOULDER_Y - 0.6, z], [A.side * 2.5, SHOULDER_Y - 2.2, 0]);
				fig.orient(A, [Math.cos(a) * -A.side, 0, Math.sin(a) * A.side], [0, -1, 0]);
				fig.shape(A, 'open', 0.4);
			}
		},
		{ steps: 16, still: 8 }
	),
	'time-out': hold((fig) => tee(fig)),
	substitution: loop((fig, p) => {
		// Fists rolling around each other in front of the chest.
		const th = p * 2 * Math.PI;
		for (const A of [fig.R, fig.L]) {
			const a = th + (A === fig.L ? Math.PI : 0);
			const y = SHOULDER_Y - 0.55 + 0.42 * Math.cos(a);
			const z = 1.05 + 0.42 * Math.sin(a);
			fig.reach(A, [A.side * 0.12, y, z], [A.side * 2.6, SHOULDER_Y - 2.4, 0.3]);
			fig.orient(A, [A.side * -1, 0.2, 0], [0, Math.sin(a), -Math.cos(a)]);
			fig.shape(A, 'fist');
		}
	}),
	warning: raiseCard(['right:yellow']),
	penalty: raiseCard(['right:red']),
	expulsion: raiseCard(['right:yellow', 'right:redFanned']),
	disqualification: withProps(
		hold((fig) => {
			for (const [A, tilt] of [
				[fig.R, 0.3],
				[fig.L, 0.3]
			]) {
				up(fig, A, { tilt });
				fig.orient(A, [A.side * 0.12, 1, 0.1], [0, 0, 1]);
				fig.shape(A, 'pinch');
			}
		}),
		['right:yellow', 'left:red']
	),
	'end-of-set': crossed,
	'not-tossed': hold((fig) => {
		// Arm stretched forward and lifted, palm up.
		fig.reach(fig.R, [-1.05, SHOULDER_Y + 0.75, 2.3], [-3, SHOULDER_Y - 1.4, 0.6]);
		fig.orient(fig.R, [-0.2, 0.55, 1], [0, 1, -0.5]);
		fig.shape(fig.R, 'open');
		restArm(fig, fig.L);
	}),
	'delay-serve': hold((fig) => {
		for (const A of [fig.R, fig.L]) {
			fig.reach(
				A,
				[A.side * (SHOULDER_X + 1.0), SHOULDER_Y + 2.1, 0.3],
				[A.side * 4, SHOULDER_Y, 0.4]
			);
			fig.straight(A, [0, 0, 1]);
			fig.shape(A, 'four');
		}
	}),
	'block-fault': hold((fig) => {
		for (const A of [fig.R, fig.L]) {
			up(fig, A, { tilt: 0.15 });
			fig.shape(A, 'open');
		}
	}),
	'position-fault': loop((fig, p) => {
		// A forefinger drawing a circle at waist height.
		const th = p * 2 * Math.PI;
		fig.reach(
			fig.R,
			[-0.55 + 0.4 * Math.cos(th), SHOULDER_Y - 1.75, 1.35 + 0.35 * Math.sin(th)],
			[-2.2, SHOULDER_Y - 2.2, 0.6]
		);
		fig.orient(fig.R, [0.1, -1, 0.3], [0, -0.3, 1]);
		fig.shape(fig.R, 'point');
		fig.rest(fig.L);
	}),
	'ball-in': withProps(
		hold((fig) => {
			fig.reach(fig.R, [-2.0, SHOULDER_Y - 2.0, 0.9], [-3, SHOULDER_Y - 0.5, 0.5]);
			fig.straight(fig.R, [0, 0.3, 1]);
			fig.shape(fig.R, 'open', 0.5);
			restArm(fig, fig.L);
		}),
		['line']
	),
	'ball-out': hold((fig) => {
		for (const A of [fig.R, fig.L]) {
			forearmUp(fig, A, [0, 0, -1]);
			fig.shape(A, 'open');
		}
	}),
	catch: {
		...hold((fig) => {
			// Forearm lifted slowly, palm up.
			fig.reach(fig.R, [-1.2, SHOULDER_Y - 0.55, 2.1], [-3, SHOULDER_Y - 1.8, 0.6]);
			fig.orient(fig.R, [-0.25, 0.3, 1], [0, 1, -0.3]);
			fig.shape(fig.R, 'open');
			restArm(fig, fig.L);
		}),
		slow: true
	},
	'double-contact': hold((fig) => {
		up(fig, fig.R, { tilt: 0.35 });
		fig.shape(fig.R, 'two');
		restArm(fig, fig.L);
	}),
	'four-hits': hold((fig) => {
		up(fig, fig.R, { tilt: 0.35 });
		fig.shape(fig.R, 'four');
		restArm(fig, fig.L);
	}),
	'net-touch': withProps(
		hold((fig) => {
			// The hand touches the top of the net, drawn at shoulder-and-a-half height.
			fig.reach(fig.R, [-2.3, SHOULDER_Y + 1.45, 0.6], [-3.2, SHOULDER_Y - 0.6, 0.3]);
			fig.straight(fig.R, [0, 0, 1]);
			fig.shape(fig.R, 'open', 0.4);
			fig.placeNet(SHOULDER_Y + 0.95);
			restArm(fig, fig.L);
		}),
		['net']
	),
	'reach-over': withProps(
		hold((fig) => {
			// The hand above the net, palm down.
			fig.reach(fig.R, [-2.1, SHOULDER_Y + 1.75, 0.5], [-3.2, SHOULDER_Y - 0.4, 0.3]);
			fig.orient(fig.R, [-1, 0, 0], [0, -1, 0.2]);
			fig.shape(fig.R, 'open', 0.4);
			fig.placeNet(SHOULDER_Y + 1.35);
			restArm(fig, fig.L);
		}),
		['net']
	),
	'attack-fault': {
		// Forearm raised, then brought down with the hand open.
		frames: (fig) => {
			fig.rest(fig.L);
			forearmUp(fig, fig.R, [0, 0, 1]);
			fig.shape(fig.R, 'open');
			const a = fig.snapshot();
			fig.reach(fig.R, [-1.0, SHOULDER_Y - 1.6, 1.4], [-2.6, SHOULDER_Y - 1.2, 0.3]);
			fig.straight(fig.R, [0, -0.2, 1]);
			fig.shape(fig.R, 'open');
			const b = fig.snapshot();
			return Array.from({ length: RISE }, (_, i) => () => {
				fig.blend(a, b, easeInOut(i / (RISE - 1)));
				fig.root.updateMatrixWorld(true);
			});
		},
		rise: RISE,
		still: RISE - 1
	},
	penetration: withProps(
		hold((fig) => {
			fig.reach(fig.R, [-1.25, SHOULDER_Y - 2.3, 1.1], [-2.8, SHOULDER_Y - 0.8, 0.6]);
			fig.straight(fig.R, [0, 0.2, 1]);
			fig.shape(fig.R, 'point');
			restArm(fig, fig.L);
		}),
		['line']
	),
	'double-fault': hold((fig) => {
		for (const A of [fig.R, fig.L]) {
			fig.reach(
				A,
				[A.side * (SHOULDER_X + 0.55), SHOULDER_Y + 1.0, 0.9],
				[A.side * 2.6, SHOULDER_Y - 1.6, 0.8]
			);
			fig.orient(A, [A.side * 0.1, 1, 0.1], [A.side * -1, 0, 0.3]);
			fig.shape(A, 'thumb');
		}
	}),
	'ball-touched': loop((fig, p) => tee(fig, -0.5 + p * 0.9), { pingPong: true }),
	delay: withProps(
		hold((fig) => {
			// A card held over the other wrist.
			fig.reach(fig.L, [-0.2, SHOULDER_Y - 0.75, 1.3], [2.2, SHOULDER_Y - 1.6, 0.6]);
			fig.orient(fig.L, [-1, 0, 0.2], [0, 0, -1]);
			fig.shape(fig.L, 'fist');
			fig.reach(fig.R, [-0.95, SHOULDER_Y - 0.35, 1.45], [-2.4, SHOULDER_Y - 1.4, 0.5]);
			fig.orient(fig.R, [1, -0.35, 0], [0, -0.45, 1]);
			fig.shape(fig.R, 'pinch');
		}),
		['right:yellow']
	),

	// ---- line judges' flag signals, Diagram 12 ----
	'flag-in': withProps(
		hold((fig) => {
			fig.reach(fig.R, [-1.55, SHOULDER_Y - 2.25, 0.8], [-3, SHOULDER_Y - 0.6, 0.4]);
			fig.orient(fig.R, [0, 0, 1], [1, 0, 0]);
			fig.shape(fig.R, 'grip');
			restArm(fig, fig.L);
		}),
		['right:flag']
	),
	'flag-out': withProps(
		hold((fig) => {
			up(fig, fig.R, { tilt: 0.1 });
			fig.orient(fig.R, [0, 0, 1], [1, 0, 0]);
			fig.shape(fig.R, 'grip');
			restArm(fig, fig.L);
		}),
		['right:flag']
	),
	'flag-touched': withProps(
		hold((fig) => {
			// Flag raised in front, the other palm touching its top.
			fig.reach(fig.R, [-0.7, SHOULDER_Y + 0.6, 1.1], [-2.6, SHOULDER_Y - 1.4, 0.6]);
			fig.orient(fig.R, [0, 0, 1], [1, 0, 0]);
			fig.shape(fig.R, 'grip');
			fig.reach(fig.L, [-0.35, SHOULDER_Y + 2.1, 1.1], [2.8, SHOULDER_Y + 0.6, 0.4]);
			fig.orient(fig.L, [-1, 0, 0], [0, -1, 0.2]);
			fig.shape(fig.L, 'open', 0.3);
		}),
		['right:flag']
	),
	'flag-antenna': withProps(
		loop(
			(fig, p) => {
				// Flag waved over the head.
				const a = -0.5 + p;
				fig.reach(fig.R, [-0.6 + a * 1.2, SHOULDER_Y + 2.3, 0.5], [-3, SHOULDER_Y + 0.4, 0.4]);
				fig.orient(fig.R, [0, 0, 1], [1, 0, 0]);
				fig.shape(fig.R, 'grip');
				fig.rest(fig.L);
			},
			{ pingPong: true }
		),
		['right:flag']
	),
	'flag-unsure': crossed,

	// ---- beach blocker's partner signals, seen from behind: hands behind the back ----
	...Object.fromEntries(
		['one', 'two', 'fist', 'open'].flatMap((l) =>
			['one', 'two', 'fist', 'open'].map((r) => [
				`partner-${l}-${r}`,
				{
					view: { from: 'back', height: 4.9, centre: 2.15 },
					frames: (fig) => {
						const SHAPES = { one: 'point', two: 'two', fist: 'fist', open: 'open' };
						const place = (A, kind) => {
							fig.reach(
								A,
								[A.side * 0.55, SHOULDER_Y - 1.85, -0.55],
								[A.side * 3, SHOULDER_Y - 1.6, 0.4]
							);
							fig.orient(A, [A.side * 0.15, -1, -0.1], [0, 0, -1]);
							fig.shape(A, kind);
						};
						// The blocker's left hand is `L`; seen from behind it is on the viewer's left.
						place(fig.L, 'fist');
						place(fig.R, 'fist');
						const a = fig.snapshot();
						place(fig.L, SHAPES[l]);
						place(fig.R, SHAPES[r]);
						const b = fig.snapshot();
						return Array.from({ length: 6 }, (_, i) => () => {
							fig.blend(a, b, easeOut(i / 5));
							fig.root.updateMatrixWorld(true);
						});
					},
					rise: 6,
					still: 5
				}
			])
		)
	)
};
