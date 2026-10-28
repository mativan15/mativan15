import { add3, dot3, mul3, norm3, refract3, sub3, type Vec3 } from "./optics";

/** Symmetric biconvex lens. The optical axis is local +Z. Aperture is the glass radius. */
export interface Biconvex {
    aperture: number;
    curvature: number;
    thickness: number;
    ior: number;
}

/**
 * `curve` is the sphere radius divided by the aperture. Larger is flatter.
 * `edge` is the rim thickness divided by the aperture.
 */
export const biconvexShape = (aperture: number, curve = 1.75, edge = 0.06, ior = 1.52): Biconvex => {
    const safeAperture = Math.max(aperture, 1e-4);
    const curvature = Math.max(curve, 1.02) * safeAperture;
    const sagitta = curvature - Math.sqrt(curvature * curvature - safeAperture * safeAperture);
    return {
        aperture: safeAperture,
        curvature,
        thickness: edge * safeAperture + 2 * sagitta,
        ior
    };
};

/** Thin-lens focal length along the optical axis, in the same units as the aperture. */
export const focalLength = (lens: Biconvex): number => {
    const { curvature: radius, thickness, ior } = lens;
    const power = (ior - 1) * (2 / radius - ((ior - 1) * thickness) / (ior * radius * radius));
    return 1 / power;
};

interface CapHit {
    t: number;
    point: Vec3;
    /** Outward normal. */
    normal: Vec3;
}

const hitCap = (
    origin: Vec3,
    dir: Vec3,
    center: Vec3,
    radius: number,
    aperture: number,
    facing: 1 | -1
): CapHit | null => {
    const oc = sub3(origin, center);
    const b = dot3(oc, dir);
    const h = b * b - (dot3(oc, oc) - radius * radius);
    if (h < 0) {
        return null;
    }
    const root = Math.sqrt(h);
    let best: CapHit | null = null;
    [ -b - root, -b + root ].forEach((t) => {
        if (t < 0.002) {
            return;
        }
        const point = add3(origin, mul3(dir, t));
        if (point[0] * point[0] + point[1] * point[1] > aperture * aperture) {
            return;
        }
        const normal = norm3(sub3(point, center));
        if (facing > 0 && normal[2] <= 0) {
            return;
        }
        if (facing < 0 && normal[2] >= 0) {
            return;
        }
        if (!best || t < best.t) {
            best = { t, point, normal };
        }
    });
    return best;
};

const nearer = (a: CapHit | null, b: CapHit | null): CapHit | null => {
    if (!a) {
        return b;
    }
    if (!b) {
        return a;
    }
    return a.t <= b.t ? a : b;
};

export interface LensRay {
    entry: Vec3;
    exitPoint: Vec3;
    outgoing: Vec3;
}

/**
 * Trace one ray through the lens in lens space.
 * The ray direction should point toward the glass. Air outside, glass inside.
 */
export const traceBiconvex = (origin: Vec3, dir: Vec3, lens: Biconvex): LensRay | null => {
    const direction = norm3(dir);
    const { aperture, curvature, thickness, ior } = lens;
    const front = [0, 0, thickness / 2 - curvature] as Vec3;
    const back = [0, 0, -thickness / 2 + curvature] as Vec3;
    const entry = nearer(
        hitCap(origin, direction, front, curvature, aperture, 1),
        hitCap(origin, direction, back, curvature, aperture, -1)
    );
    if (!entry || dot3(entry.normal, direction) >= 0) {
        return null;
    }
    const into = refract3(direction, entry.normal, 1 / ior);
    if (!into) {
        return null;
    }
    const inside = norm3(into);
    const stepped = sub3(entry.point, mul3(entry.normal, 0.02));
    const leave = nearer(
        hitCap(stepped, inside, front, curvature, aperture, 1),
        hitCap(stepped, inside, back, curvature, aperture, -1)
    );
    if (!leave || dot3(leave.normal, inside) <= 0) {
        return null;
    }
    const outgoing = refract3(inside, mul3(leave.normal, -1), ior);
    if (!outgoing) {
        return null;
    }
    return { entry: entry.point, exitPoint: leave.point, outgoing: norm3(outgoing) };
};

/** Rotate lens space into world space. Yaw is about local Y. Zero faces the camera. */
export const lensToWorld = (local: Vec3, yaw: number): Vec3 => {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return [c * local[0] + s * local[2], local[1], -s * local[0] + c * local[2]];
};

export const worldToLens = (world: Vec3, yaw: number): Vec3 => {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return [c * world[0] - s * world[2], world[1], s * world[0] + c * world[2]];
};

/** Where a ray crosses a plane of constant world X, in world Y (y up). */
export const crossPlaneX = (point: Vec3, dir: Vec3, planeX: number): number | null => {
    if (Math.abs(dir[0]) < 1e-6) {
        return null;
    }
    const t = (planeX - point[0]) / dir[0];
    if (t <= 0) {
        return null;
    }
    return point[1] + dir[1] * t;
};

/**
 * Screen Y (y down) where focused rays meet the name's x.
 * `yaw` is radians. The lamp sits in screen pixels, y down, same as the lens.
 */
export const focusLandings = (
    lensX: number,
    lensY: number,
    radius: number,
    yaw: number,
    lamp: { x: number; y: number },
    viewHeight: number,
    nameX: number,
    curve = 1.75,
    edge = 0.06,
    ior = 1.52
): number[] => {
    const lens = biconvexShape(radius, curve, edge, ior);
    const center: Vec3 = [lensX, viewHeight - lensY, 0];
    const source: Vec3 = [lamp.x, viewHeight - lamp.y, 0];
    const ys: number[] = [];
    const count = 24;
    for (let i = 0; i < count; i += 1) {
        const fi = i + 0.5;
        const ang = fi * 2.39996323;
        const rad = Math.sqrt(fi / count) * radius * 0.85;
        const aim: Vec3 = [center[0], center[1] + Math.cos(ang) * rad, Math.sin(ang) * rad];
        const worldDir = norm3(sub3(aim, source));
        const origin = worldToLens(sub3(source, center), yaw);
        const dir = worldToLens(worldDir, yaw);
        const hit = traceBiconvex(origin, dir, lens);
        if (!hit) {
            continue;
        }
        const exit = add3(center, lensToWorld(hit.exitPoint, yaw));
        const outgoing = lensToWorld(hit.outgoing, yaw);
        const yUp = crossPlaneX(exit, outgoing, nameX);
        if (yUp === null) {
            continue;
        }
        ys.push(viewHeight - yUp);
    }
    return ys;
};

export const raySpreadAt = (heights: number[]): number => {
    if (heights.length < 2) {
        return Infinity;
    }
    const mid = heights.reduce((sum, value) => sum + value, 0) / heights.length;
    return Math.sqrt(heights.reduce((sum, value) => sum + (value - mid) ** 2, 0) / heights.length);
};
