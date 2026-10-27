export interface ShelfMetrics {
    w: number;
    h: number;
    d: number;
    step: number;
    gap: number;
}

export interface ShelfPose {
    x: number;
    y: number;
    z: number;
    rot: number;
    scale: number;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function wrapIndex(value: number, count: number): number {
    if (count <= 0) {
        return 0;
    }
    return ((value % count) + count) % count;
}

/** Pick the copy of `index` that sits closest to `from`, so the shelf turns the short way. */
export function nearestTurn(index: number, from: number, count: number): number {
    let best = index;
    let bestDistance = Infinity;
    [index - count, index, index + count].forEach((candidate) => {
        const distance = Math.abs(candidate - from);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    });
    return best;
}

/** Signed steps from the focused book, wrapped so the row is a loop. */
export function circularOffset(index: number, from: number, count: number): number {
    if (count <= 0) {
        return 0;
    }
    let distance = index - from;
    distance -= count * Math.round(distance / count);
    return distance;
}

export function shelfMetrics(width: number): ShelfMetrics {
    const w = clamp(width * 0.16, 108, 176);
    return {
        w,
        h: w * 1.5,
        d: Math.max(22, w * 0.2),
        step: w * 0.56,
        gap: w * 0.62
    };
}

export function shelfPose(distance: number, size: ShelfMetrics): ShelfPose {
    const abs = Math.abs(distance);
    const sign = distance < 0 ? -1 : distance > 0 ? 1 : 0;
    const prominence = Math.exp(-abs * abs * 1.7);
    return {
        x: distance * size.step + sign * size.gap * Math.min(abs, 1),
        y: -prominence * size.w * 0.08,
        z: -abs * size.w * 0.22 + prominence * size.w * 0.55,
        rot: distance === 0 ? 0 : clamp(-distance * 31, -58, 58),
        scale: 0.94 + prominence * 0.16
    };
}

/** Books per second while nobody is pointing at the shelf. One book takes about 7 seconds. */
export const SHELF_IDLE_RATE = 0.135;

/** Books per second while the pointer rests on one side. The rate does not change with time. */
export const SHELF_CRUISE_RATE = 1.092;

export interface ShelfShade {
    edge: number;
    a: number;
    aAlpha: number;
    b: number;
    bAlpha: number;
    c: number;
    cAlpha: number;
    d: number;
}

/** Light edge dimming. Used when unique books already fill the stage, so nothing needs to be hidden. */
export const SHELF_SHADE_OPEN: ShelfShade = {
    edge: 0.2,
    a: 4,
    aAlpha: 0.12,
    b: 9,
    bAlpha: 0.06,
    c: 16,
    cAlpha: 0.02,
    d: 24
};

/**
 * Shadow across the stage.
 * Stops are percentages from the left edge. Alphas are how solid the page color is.
 * A long row only dims the edges. A short row keeps the tight black spotlight,
 * pulled in until the repeated copy sits under it.
 */
export function shelfShade(count: number, stageWidth: number, size: ShelfMetrics): ShelfShade {
    if (count <= 1 || stageWidth <= 0) {
        return { ...SHELF_SHADE_OPEN };
    }
    const duplicateInner = count * size.step + size.gap - size.w * 0.7;
    const fromLeft = 50 - (duplicateInner / stageWidth) * 100;
    if (fromLeft <= 12) {
        return { ...SHELF_SHADE_OPEN };
    }
    const a = clamp(fromLeft, 12, 42);
    const d = 46;
    const span = d - a;
    const tight: ShelfShade = {
        edge: 1,
        a,
        aAlpha: 0.98,
        b: a + (8 / 34) * span,
        bAlpha: 0.92,
        c: a + (20 / 34) * span,
        cAlpha: 0.62,
        d
    };
    if (fromLeft >= 26) {
        return tight;
    }
    const blend = (fromLeft - 12) / (26 - 12);
    const mix = (open: number, closed: number): number => open + (closed - open) * blend;
    return {
        edge: mix(SHELF_SHADE_OPEN.edge, tight.edge),
        a: mix(SHELF_SHADE_OPEN.a, tight.a),
        aAlpha: mix(SHELF_SHADE_OPEN.aAlpha, tight.aAlpha),
        b: mix(SHELF_SHADE_OPEN.b, tight.b),
        bAlpha: mix(SHELF_SHADE_OPEN.bAlpha, tight.bAlpha),
        c: mix(SHELF_SHADE_OPEN.c, tight.c),
        cAlpha: mix(SHELF_SHADE_OPEN.cAlpha, tight.cAlpha),
        d: mix(SHELF_SHADE_OPEN.d, tight.d)
    };
}

/**
 * Short filters are repeated until the loop is at least this many slots.
 * The seam, where a copy leaves one side and another enters, then sits in the dark edge.
 */
export const SHELF_MIN_LOOP = 16;

export function loopRepeats(count: number): number {
    if (count <= 1) {
        return 1;
    }
    return Math.ceil(SHELF_MIN_LOOP / count);
}

/**
 * Constant spin for the shelf.
 * `pointer` is -1 at the left edge and +1 at the right edge, or null when the pointer is away.
 * The right side brings the books on the right toward the center. The left side does the opposite.
 * A narrow band in the middle keeps the slow idle spin, so the shelf never stops.
 */
export function shelfCruise(pointer: number | null, reducedMotion = false): number {
    if (reducedMotion) {
        return 0;
    }
    if (pointer === null || Math.abs(pointer) < 0.16) {
        return SHELF_IDLE_RATE;
    }
    return Math.sign(pointer) * SHELF_CRUISE_RATE;
}

export function visibleBooks<T extends { tag: string }>(books: readonly T[], tag: string): T[] {
    if (tag === "all") {
        return [...books];
    }
    return books.filter((book) => book.tag === tag);
}
