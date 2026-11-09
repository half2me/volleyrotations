/**
 * A referee built from primitives in three.js, at textbook proportions (units are head heights:
 * shoulders two heads wide, upper arm 1.5, forearm 1.2, hand 0.75), with a joint chain of
 * shoulder, elbow, wrist, three joints per finger and two for the thumb. Poses are given as wrist
 * targets solved by inverse kinematics, hand orientations, and finger shapes; animation between
 * two poses interpolates every joint, so an arm travels in a natural arc.
 *
 * Rendered flat-shaded with ink outlines, so the result reads as a book sketch. This module runs
 * in the browser page that `scripts/figures.ts` drives; it never ships to the site.
 */
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

const UPPER = 1.5;
const FORE = 1.2;
export const SHOULDER_Y = 2.9;
export const SHOULDER_X = 0.82;

const deg = (d) => (d * Math.PI) / 180;

/** Three-step and two-step toon ramps. */
function ramp(steps) {
	const data = new Uint8Array(steps.flatMap((v) => [v, v, v, 255]));
	const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
	t.minFilter = t.magFilter = THREE.NearestFilter;
	t.needsUpdate = true;
	return t;
}
const RAMP = ramp([95, 175, 255]);
const RAMP_FLAT = ramp([200, 255]);

const sphere = new THREE.SphereGeometry(1, 32, 24);

export function createFigure({ width, height }) {
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
		preserveDrawingBuffer: true
	});
	renderer.setPixelRatio(1);
	renderer.setSize(width, height);
	renderer.setClearColor(0x000000, 0);
	const scene = new THREE.Scene();
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
	scene.add(new THREE.AmbientLight(0xffffff, 1.6));
	const key = new THREE.DirectionalLight(0xffffff, 2.2);
	key.position.set(-4, 8, 6);
	scene.add(key);

	const mat = (color, r = RAMP) => new THREE.MeshToonMaterial({ color, gradientMap: r });
	const SKIN = mat(0xe8b48e);
	const SHIRT = mat(0xf7f7f7);
	const TRIM = mat(0x1b2a4a);
	const HAIR = mat(0x4a3324);
	const DARK = mat(0x222222);
	const WHITE = mat(0xffffff, RAMP_FLAT);
	const GREY = mat(0xc9ced6);
	const YELLOW = mat(0xf5c400);
	const RED = mat(0xd7263d);

	const add = (parent, geo, m, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) => {
		const mesh = new THREE.Mesh(geo, m);
		mesh.position.set(...pos);
		mesh.scale.set(...scale);
		mesh.rotation.set(...rot);
		parent.add(mesh);
		return mesh;
	};
	const pivot = (parent, pos) => {
		const o = new THREE.Object3D();
		o.position.set(...pos);
		parent.add(o);
		return o;
	};
	/** A limb segment hanging down from its pivot: a tapered cylinder with a ball at the far end. */
	function segment(parent, length, r1, r2, m) {
		add(parent, new THREE.CylinderGeometry(r1, r2, length, 24, 1), m, [0, -length / 2, 0]);
		add(parent, sphere, m, [0, -length, 0], [r2, r2, r2]);
	}

	const root = new THREE.Group();
	scene.add(root);

	// Torso: chest, waist and shorts under a white polo with navy trim.
	add(root, sphere, SHIRT, [0, 2.35, 0], [0.74, 0.76, 0.46]);
	add(root, new THREE.CylinderGeometry(0.58, 0.62, 1.3, 32), SHIRT, [0, 1.45, 0], [1.12, 1, 0.72]);
	add(root, sphere, TRIM, [0, 0.75, 0], [0.78, 0.5, 0.48]);
	add(root, new THREE.CylinderGeometry(0.78, 0.82, 0.35, 32), TRIM, [0, 0.85, 0], [1, 1, 0.62]);
	add(
		root,
		new THREE.TorusGeometry(0.3, 0.07, 12, 32),
		TRIM,
		[0, 3.0, 0.02],
		[1, 1, 1.3],
		[Math.PI / 2, 0, 0]
	);
	add(root, new THREE.BoxGeometry(0.05, 0.6, 0.05), TRIM, [0, 2.6, 0.5]);
	// Lanyard and whistle
	add(root, new THREE.TorusGeometry(0.22, 0.012, 8, 32), DARK, [0, 2.75, 0.45], [1, 1.6, 1]);
	add(
		root,
		new THREE.CylinderGeometry(0.08, 0.08, 0.26, 16),
		GREY,
		[0, 2.25, 0.5],
		[1, 1, 1],
		[0, 0, Math.PI / 2]
	);
	// Neck and head
	add(root, new THREE.CylinderGeometry(0.17, 0.2, 0.55, 24), SKIN, [0, 3.15, 0]);
	const head = pivot(root, [0, 3.95, 0]);
	add(head, sphere, SKIN, [0, 0.05, 0], [0.4, 0.46, 0.44]);
	add(head, sphere, SKIN, [0, -0.22, 0.08], [0.33, 0.3, 0.34]);
	add(head, sphere, HAIR, [0, 0.16, -0.03], [0.425, 0.4, 0.47]);
	add(head, sphere, HAIR, [0, 0.3, 0.3], [0.3, 0.12, 0.2]);
	for (const sx of [-1, 1]) {
		add(head, sphere, SKIN, [sx * 0.41, -0.04, 0.02], [0.06, 0.11, 0.07]);
		add(head, sphere, WHITE, [sx * 0.15, -0.02, 0.4], [0.065, 0.045, 0.03]);
		add(head, sphere, DARK, [sx * 0.15, -0.02, 0.425], [0.032, 0.036, 0.015]);
		add(
			head,
			new THREE.BoxGeometry(0.15, 0.028, 0.03),
			HAIR,
			[sx * 0.15, 0.08, 0.41],
			[1, 1, 1],
			[0, 0, sx * -0.12]
		);
	}
	add(head, sphere, SKIN, [0, -0.1, 0.46], [0.055, 0.1, 0.06]);
	add(
		head,
		new THREE.TorusGeometry(0.075, 0.011, 8, 16, Math.PI),
		DARK,
		[0, -0.25, 0.4],
		[1, 0.45, 1],
		[Math.PI, 0, 0]
	);

	/**
	 * An arm. `side` is -1 for the referee's right (the viewer's left when the referee faces the
	 * camera) and 1 for the left. The hand's local frame: fingers along -y, palm normal +z, thumb
	 * on the outer side (-side·x).
	 */
	function arm(side) {
		const shoulder = pivot(root, [side * SHOULDER_X, SHOULDER_Y, 0]);
		add(shoulder, sphere, SHIRT, [side * 0.05, 0.05, 0], [0.3, 0.3, 0.3]);
		add(shoulder, new THREE.CylinderGeometry(0.29, 0.26, 0.55, 24), SHIRT, [0, -0.3, 0]);
		add(shoulder, new THREE.CylinderGeometry(0.265, 0.255, 0.1, 24), TRIM, [0, -0.6, 0]);
		segment(shoulder, UPPER, 0.22, 0.17, SKIN);
		const elbow = pivot(shoulder, [0, -UPPER, 0]);
		segment(elbow, FORE, 0.19, 0.12, SKIN);
		const wrist = pivot(elbow, [0, -FORE, 0]);
		const hand = pivot(wrist, [0, 0, 0]);
		hand.scale.setScalar(1.2);
		add(hand, sphere, SKIN, [0, -0.2, 0], [0.22, 0.26, 0.075]);
		add(hand, new THREE.BoxGeometry(0.4, 0.34, 0.11), SKIN, [0, -0.26, 0]);
		const fingers = [];
		const fx = [0.15, 0.05, -0.05, -0.15];
		const fl = [0.82, 0.92, 0.85, 0.68];
		for (let i = 0; i < 4; i++) {
			const base = pivot(hand, [side * -fx[i], -0.43, 0]);
			const lens = [0.17, 0.12, 0.1].map((l) => l * fl[i]);
			let p = base;
			const joints = [];
			for (const l of lens) {
				segment(p, l, 0.056, 0.05, SKIN);
				joints.push(p);
				p = pivot(p, [0, -l, 0]);
			}
			fingers.push(joints);
		}
		const thumbBase = pivot(hand, [side * 0.2, -0.2, 0.03]);
		segment(thumbBase, 0.16, 0.06, 0.05, SKIN);
		const thumbTip = pivot(thumbBase, [0, -0.16, 0]);
		segment(thumbTip, 0.12, 0.05, 0.045, SKIN);
		// Props live in the hand's frame and are shown per pose.
		const props = new THREE.Group();
		hand.add(props);
		const card = (m, dx, rz) =>
			add(
				props,
				new THREE.BoxGeometry(0.42, 0.6, 0.02),
				m,
				[dx, -0.55, 0.07],
				[1, 1, 1],
				[0, 0, rz]
			);
		const yellow = card(YELLOW, 0, 0);
		const red = card(RED, 0, 0);
		const redFanned = card(RED, 0.14, -0.22);
		// Flag: pole across the fist along the hand's x axis, cloth beyond the thumb side.
		const flag = new THREE.Group();
		props.add(flag);
		add(
			flag,
			new THREE.CylinderGeometry(0.03, 0.03, 2.2, 12),
			DARK,
			[side * 0.55, -0.25, 0],
			[1, 1, 1],
			[0, 0, Math.PI / 2]
		);
		const cloth = new THREE.Group();
		cloth.position.set(side * 1.3, -0.25, 0);
		flag.add(cloth);
		add(cloth, new THREE.BoxGeometry(0.8, 0.02, 0.6), RED, [0, 0, -0.3]);
		add(cloth, new THREE.BoxGeometry(0.4, 0.025, 0.3), YELLOW, [-0.2, 0, -0.15]);
		add(cloth, new THREE.BoxGeometry(0.4, 0.025, 0.3), YELLOW, [0.2, 0, -0.45]);
		const all = { yellow, red, redFanned, flag };
		for (const p of Object.values(all)) p.visible = false;
		const joints = [shoulder, elbow, wrist, hand, ...fingers.flat(), thumbBase, thumbTip];
		return {
			side,
			shoulder,
			elbow,
			wrist,
			hand,
			fingers,
			thumb: [thumbBase, thumbTip],
			props: all,
			joints
		};
	}
	const R = arm(-1);
	const L = arm(1);
	const arms = { right: R, left: L };

	// Scene props: a net with its antenna, and a floor line.
	const net = new THREE.Group();
	scene.add(net);
	const mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(4.2, 1.4),
		new THREE.MeshToonMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })
	);
	net.add(mesh);
	for (let i = 0; i <= 14; i++)
		add(net, new THREE.BoxGeometry(0.012, 1.4, 0.012), DARK, [-2.1 + i * 0.3, -0.7, 0]);
	for (let i = 0; i <= 5; i++)
		add(net, new THREE.BoxGeometry(4.2, 0.012, 0.012), DARK, [0, -0.1 - i * 0.26, 0]);
	add(net, new THREE.BoxGeometry(4.2, 0.1, 0.03), WHITE, [0, 0, 0]);
	add(net, new THREE.CylinderGeometry(0.025, 0.025, 2.2, 10), RED, [2.1, 0.2, 0]);
	for (let i = 0; i < 4; i++)
		add(net, new THREE.CylinderGeometry(0.027, 0.027, 0.27, 10), WHITE, [2.1, 1.17 - i * 0.55, 0]);
	net.visible = false;
	const line = add(
		scene,
		new THREE.BoxGeometry(2.2, 0.04, 0.12),
		mat(0xb5522a),
		[-0.6, -0.25, 1.4]
	);
	line.visible = false;

	root.updateMatrixWorld(true);

	// ---- posing helpers ----
	const v = (a) => new THREE.Vector3(...a);
	const DOWN = new THREE.Vector3(0, -1, 0);

	/**
	 * Put a wrist at a world point. The elbow lies on a circle of solutions around the
	 * shoulder-to-target axis; the point nearest `hint` (a world point) is taken.
	 */
	function reach(A, target, hint) {
		const S = new THREE.Vector3();
		A.shoulder.getWorldPosition(S);
		const T = v(target);
		const toT = T.clone().sub(S);
		const dist = Math.min(
			UPPER + FORE - 0.01,
			Math.max(Math.abs(UPPER - FORE) + 0.01, toT.length())
		);
		const dir = toT.clone().normalize();
		const cosA = (UPPER * UPPER + dist * dist - FORE * FORE) / (2 * UPPER * dist);
		const a = Math.acos(Math.min(1, Math.max(-1, cosA)));
		const H = v(hint).sub(S);
		let perp = H.clone().sub(dir.clone().multiplyScalar(H.dot(dir)));
		if (perp.lengthSq() < 1e-6) perp = new THREE.Vector3(A.side * -1, -0.3, 0);
		perp.normalize();
		const E = S.clone()
			.add(dir.clone().multiplyScalar(UPPER * Math.cos(a)))
			.add(perp.multiplyScalar(UPPER * Math.sin(a)));
		const parentQ = new THREE.Quaternion();
		A.shoulder.parent.getWorldQuaternion(parentQ);
		const qS = new THREE.Quaternion().setFromUnitVectors(DOWN, E.clone().sub(S).normalize());
		A.shoulder.quaternion.copy(parentQ.clone().invert().multiply(qS));
		A.shoulder.updateMatrixWorld(true);
		const qShoulderW = new THREE.Quaternion();
		A.shoulder.getWorldQuaternion(qShoulderW);
		const qE = new THREE.Quaternion().setFromUnitVectors(DOWN, T.clone().sub(E).normalize());
		A.elbow.quaternion.copy(qShoulderW.clone().invert().multiply(qE));
		A.elbow.updateMatrixWorld(true);
	}

	/** Turn a hand so its fingers point along `fingers` and its palm faces `palm`, in world space. */
	function orient(A, fingers, palm) {
		const f = v(fingers).normalize();
		const n = v(palm);
		n.sub(f.clone().multiplyScalar(n.dot(f)));
		if (n.lengthSq() < 1e-6) n.set(0, 0, 1);
		n.normalize();
		const x = new THREE.Vector3().crossVectors(f.clone().negate(), n);
		const m = new THREE.Matrix4().makeBasis(x, f.clone().negate(), n);
		const q = new THREE.Quaternion().setFromRotationMatrix(m);
		const pq = new THREE.Quaternion();
		A.wrist.parent.getWorldQuaternion(pq);
		A.wrist.quaternion.copy(pq.invert().multiply(q));
		A.wrist.updateMatrixWorld(true);
	}

	/** The hand's fingers carry on from the forearm, the palm turned towards `palm`. */
	function straight(A, palm) {
		A.elbow.updateMatrixWorld(true);
		const E = new THREE.Vector3();
		const W = new THREE.Vector3();
		A.elbow.getWorldPosition(E);
		A.wrist.getWorldPosition(W);
		orient(A, W.clone().sub(E).toArray(), palm);
	}

	const curl = (f, amount) => f.forEach((j) => j.rotation.set(deg(amount), 0, 0));
	/**
	 * Finger shapes. `open` palm, `point`, `two`, `four` (thumb folded), `five` (thumb out),
	 * `fist`, `thumb` (thumbs up), `pinch` (a card), `grip` (a pole).
	 */
	function shape(A, kind, spread = 1) {
		const s = A.side;
		const out = (i, amount, splay) => {
			curl(A.fingers[i], amount);
			A.fingers[i][0].rotation.z = deg(splay) * s * spread;
		};
		const splay = [-14, -4, 4, 14];
		switch (kind) {
			case 'open':
				[0, 1, 2, 3].forEach((i) => out(i, 6, splay[i] * 0.5));
				A.thumb[0].rotation.set(deg(10), deg(s * -10), s * -0.9);
				A.thumb[1].rotation.set(deg(10), 0, 0);
				break;
			case 'five':
				[0, 1, 2, 3].forEach((i) => out(i, 2, splay[i] * 1.3));
				A.thumb[0].rotation.set(deg(0), deg(s * -20), s * -1.35);
				A.thumb[1].rotation.set(deg(5), 0, 0);
				break;
			case 'four':
				[0, 1, 2, 3].forEach((i) => out(i, 2, splay[i] * 1.1));
				A.thumb[0].rotation.set(deg(55), deg(s * 20), s * -1.3);
				A.thumb[1].rotation.set(deg(50), 0, 0);
				break;
			case 'two':
				out(0, 0, -16);
				out(1, 0, 10);
				out(2, 100, 0);
				out(3, 100, 0);
				A.thumb[0].rotation.set(deg(60), deg(s * 20), s * -1.3);
				A.thumb[1].rotation.set(deg(50), 0, 0);
				break;
			case 'point':
				out(0, 0, 0);
				out(1, 100, 0);
				out(2, 100, 0);
				out(3, 100, 0);
				A.thumb[0].rotation.set(deg(50), deg(s * 20), s * -1.2);
				A.thumb[1].rotation.set(deg(40), 0, 0);
				break;
			case 'fist':
				[0, 1, 2, 3].forEach((i) => out(i, 100, 0));
				A.thumb[0].rotation.set(deg(70), deg(s * 25), s * -1.35);
				A.thumb[1].rotation.set(deg(60), 0, 0);
				break;
			case 'thumb':
				[0, 1, 2, 3].forEach((i) => out(i, 100, 0));
				A.thumb[0].rotation.set(deg(-5), 0, s * -0.15);
				A.thumb[1].rotation.set(deg(-5), 0, 0);
				break;
			case 'pinch':
				[0, 1, 2, 3].forEach((i) => out(i, 80, 0));
				A.thumb[0].rotation.set(deg(10), 0, s * -0.25);
				A.thumb[1].rotation.set(deg(20), 0, 0);
				break;
			case 'grip':
				[0, 1, 2, 3].forEach((i) => out(i, 95, 0));
				A.thumb[0].rotation.set(deg(30), deg(s * 30), s * -1.1);
				A.thumb[1].rotation.set(deg(50), 0, 0);
				break;
		}
	}

	/** Arms hanging naturally, fingers relaxed. */
	function rest(A) {
		const s = A.side;
		reach(A, [s * (SHOULDER_X + 0.35), SHOULDER_Y - 2.6, 0.15], [s * 3, 0, 0.5]);
		straight(A, [s * -0.4, 0, 1]);
		shape(A, 'open');
		A.fingers.forEach((f) => curl(f, 18));
	}

	function showProps(list) {
		for (const A of [R, L]) for (const p of Object.values(A.props)) p.visible = false;
		net.visible = false;
		line.visible = false;
		for (const item of list ?? []) {
			if (item === 'net') net.visible = true;
			else if (item === 'line') line.visible = true;
			else {
				const [side, prop] = item.split(':');
				arms[side].props[prop].visible = true;
			}
		}
	}

	/** Where a wrist is now, in world coordinates. */
	function wristAt(A) {
		A.wrist.updateMatrixWorld(true);
		return A.wrist.getWorldPosition(new THREE.Vector3()).toArray();
	}

	/** Snapshot every joint's rotation so two poses can be blended. */
	const allJoints = [...R.joints, ...L.joints, head];
	const snapshot = () => allJoints.map((j) => j.quaternion.clone());
	const blend = (a, b, t) => allJoints.forEach((j, i) => j.quaternion.copy(a[i]).slerp(b[i], t));

	/**
	 * Frame the figure: fixed height, width grown to the hands' extent, so every figure is drawn
	 * at the same scale and one with its arms out is only scaled down to fit.
	 */
	function frame(box, view = {}) {
		const from = view.from ?? 'front';
		const viewH = view.height ?? 8.3;
		const baseY = view.centre ?? 3.45;
		const minW = (viewH * width) / height;
		const w = Math.max(minW, box.max.x - box.min.x + 0.9);
		const cx = w > minW + 1e-6 ? (box.min.x + box.max.x) / 2 : 0;
		const aspect = width / height;
		const vw = Math.max(w, viewH * aspect);
		const vh = vw / aspect;
		camera.left = -vw / 2;
		camera.right = vw / 2;
		camera.top = vh / 2;
		camera.bottom = -vh / 2;
		camera.updateProjectionMatrix();
		const cy = baseY + (vh - viewH) / 2;
		if (from === 'back') {
			camera.position.set(cx, cy, -12);
			key.position.set(4, 8, -6);
		} else {
			camera.position.set(cx, cy, 12);
			key.position.set(-4, 8, 6);
		}
		camera.lookAt(cx, cy, 0);
		return { x: cx, scale: height / vh };
	}

	const effect = new OutlineEffect(renderer, {
		defaultThickness: 0.0062,
		defaultColor: [0.2, 0.12, 0.07],
		defaultAlpha: 1
	});

	/** The arms' extent, from visible meshes only: hidden props must not widen the picture. */
	function extent() {
		root.updateMatrixWorld(true);
		const box = new THREE.Box3();
		const meshBox = new THREE.Box3();
		const visit = (o) => {
			if (!o.visible) return;
			if (o.isMesh) {
				meshBox.setFromObject(o, true);
				box.union(meshBox);
			}
			for (const c of o.children) visit(c);
		};
		for (const A of [R, L]) visit(A.shoulder);
		if (net.visible) visit(net);
		box.expandByPoint(new THREE.Vector3(-1.4, 0, 0));
		box.expandByPoint(new THREE.Vector3(1.4, 0, 0));
		return box;
	}

	/** The net beside the referee's right shoulder, its tape at `y`, the antenna nearest the body. */
	function placeNet(y) {
		net.position.set(-2.7, y, 0.3);
	}

	return {
		THREE,
		renderer,
		scene,
		camera,
		root,
		head,
		arms,
		R,
		L,
		reach,
		orient,
		straight,
		shape,
		curl,
		rest,
		showProps,
		placeNet,
		snapshot,
		blend,
		wristAt,
		extent,
		frame,
		render: () => {
			renderer.clear(true, true, true);
			effect.render(scene, camera);
		},
		canvas: renderer.domElement
	};
}
