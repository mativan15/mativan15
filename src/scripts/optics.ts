export type Vec3 = [number, number, number];

export interface Transmission {
    entry: Vec3;
    exitPoint: Vec3;
    outgoing: Vec3;
}

export const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul3 = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len3 = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const norm3 = (a: Vec3): Vec3 => mul3(a, 1 / (len3(a) || 1));
export const cross3 = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
];

export const refract3 = (incident: Vec3, normal: Vec3, eta: number): Vec3 | null => {
    const cosi = dot3(normal, incident);
    const k = 1 - eta * eta * (1 - cosi * cosi);
    if (k < 0) {
        return null;
    }
    return sub3(mul3(incident, eta), mul3(normal, eta * cosi + Math.sqrt(k)));
};

export const reflect3 = (incident: Vec3, normal: Vec3): Vec3 => sub3(incident, mul3(normal, 2 * dot3(normal, incident)));

export const sphereHits = (origin: Vec3, dir: Vec3, center: Vec3, radius: number): [number, number] | null => {
    const oc = sub3(origin, center);
    const b = dot3(oc, dir);
    const c = dot3(oc, oc) - radius * radius;
    const h = b * b - c;
    if (h < 0) {
        return null;
    }
    const s = Math.sqrt(h);
    return [-b - s, -b + s];
};

export const transmit = (origin: Vec3, dir: Vec3, center: Vec3, radius: number): Transmission | null => {
    const span = sphereHits(origin, dir, center, radius);
    if (!span || span[0] < 0.001) {
        return null;
    }
    const entry = add3(origin, mul3(dir, span[0]));
    const normalIn = norm3(sub3(entry, center));
    let into = refract3(dir, normalIn, 1 / 1.52);
    if (!into) {
        return null;
    }
    into = norm3(into);
    const spanB = sphereHits(add3(entry, into), into, center, radius);
    if (!spanB) {
        return null;
    }
    const tBack = Math.max(spanB[0], spanB[1]);
    if (tBack < 0.01) {
        return null;
    }
    let exitPoint = add3(entry, mul3(into, tBack));
    const normalOut = norm3(sub3(center, exitPoint));
    let outgoing = refract3(into, normalOut, 1.52);
    if (!outgoing) {
        const bounced = norm3(reflect3(into, normalOut));
        const spanC = sphereHits(add3(exitPoint, bounced), bounced, center, radius);
        if (!spanC) {
            return null;
        }
        const tExit = Math.max(spanC[0], spanC[1]);
        if (tExit < 0.01) {
            return null;
        }
        const third = add3(exitPoint, mul3(bounced, tExit));
        const normalThird = norm3(sub3(center, third));
        outgoing = refract3(bounced, normalThird, 1.52);
        if (!outgoing) {
            return null;
        }
        exitPoint = third;
    }
    return { entry, exitPoint, outgoing: norm3(outgoing) };
};

export const landingsAt = (
    lensX: number,
    lensY: number,
    radius: number,
    light: { x: number; y: number; z: number },
    viewHeight: number,
    nameX: number
): number[] => {
    const center: Vec3 = [lensX, viewHeight - lensY, 0];
    const lamp: Vec3 = [light.x, viewHeight - light.y, light.z];
    const axis = norm3(sub3(center, lamp));
    const helper: Vec3 = Math.abs(axis[1]) < 0.85 ? [0, 1, 0] : [1, 0, 0];
    const tx = norm3(cross3(helper, axis));
    const ty = cross3(axis, tx);
    const count = 32;
    const ys: number[] = [];
    for (let i = 0; i < count; i += 1) {
        const fi = i + 0.5;
        const ang = fi * 2.39996323;
        const rad = Math.sqrt(fi / count) * radius * 0.36;
        const sample = add3(center, add3(mul3(tx, Math.cos(ang) * rad), mul3(ty, Math.sin(ang) * rad)));
        const target = add3(center, mul3(axis, radius * 0.72));
        const dir = norm3(sub3(target, sample));
        const origin = sub3(sample, mul3(dir, radius * 5));
        const hit = transmit(origin, dir, center, radius);
        if (!hit || hit.outgoing[0] > -0.02) {
            continue;
        }
        const steer = 0.60;
        const axis2raw = [axis[0], -axis[1]];
        const axis2len = Math.hypot(axis2raw[0], axis2raw[1]) || 1;
        const axis2 = [axis2raw[0] / axis2len, axis2raw[1] / axis2len];
        const a = [hit.entry[0], viewHeight - hit.entry[1]];
        const b = [hit.exitPoint[0], viewHeight - hit.exitPoint[1]];
        const ab = [b[0] - a[0], b[1] - a[1]];
        const relA = [a[0] - lensX, a[1] - lensY];
        const a11 = ab[0] * ab[0] + ab[1] * ab[1];
        const a12 = ab[0] * axis2[0] + ab[1] * axis2[1];
        const den = a11 - a12 * a12;
        const b1 = ab[0] * relA[0] + ab[1] * relA[1];
        const b2 = axis2[0] * relA[0] + axis2[1] * relA[1];
        const tFocus = Math.abs(den) < 1e-4 ? 0.5 : Math.max(0, Math.min(1, (a12 * b2 - b1) / den));
        const waist = [a[0] + ab[0] * tFocus, a[1] + ab[1] * tFocus];
        const leave = [b[0] - waist[0], b[1] - waist[1]];
        const leaveLen = Math.hypot(leave[0], leave[1]);
        const leaveDir = leaveLen > 1e-4 ? [leave[0] / leaveLen, leave[1] / leaveLen] : axis2;
        let tight = [
            leaveDir[0] * (1 - steer) + axis2[0] * steer,
            leaveDir[1] * (1 - steer) + axis2[1] * steer
        ];
        const tightLen = Math.hypot(tight[0], tight[1]) || 1;
        tight = [tight[0] / tightLen, tight[1] / tightLen];
        const relW = [waist[0] - lensX, waist[1] - lensY];
        const hitB = relW[0] * tight[0] + relW[1] * tight[1];
        const hitC = relW[0] * relW[0] + relW[1] * relW[1] - radius * radius;
        const hitD = hitB * hitB - hitC;
        const hitT = hitD > 0 ? Math.max(-hitB + Math.sqrt(hitD), 0) : leaveLen;
        const exit = [waist[0] + tight[0] * hitT, waist[1] + tight[1] * hitT];
        const travel = (nameX - exit[0]) / tight[0];
        if (!(travel > 0)) {
            continue;
        }
        ys.push(exit[1] + travel * tight[1]);
    }
    return ys;
};
