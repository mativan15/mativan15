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

/** The shadow stops used when the row is long enough that repeats stay in the dark. */
export const SHELF_SHADE = { a: 12, b: 20, c: 32, d: 46 };

/**
 * Shadow stops, as percentages from the left edge.
 * A long row keeps the same stops. A short row pulls the dark inward
 * until the repeated copy of a book sits under it, without narrowing the clear center.
 */
export function shelfShade(count: number, stageWidth: number, size: ShelfMetrics): { a: number; b: number; c: number; d: number } {
    const base = SHELF_SHADE;
    if (count <= 1 || stageWidth <= 0) {
        return { ...base };
    }
    const duplicateInner = count * size.step + size.gap - size.w * 0.7;
    const fromLeft = 50 - (duplicateInner / stageWidth) * 100;
    if (fromLeft <= base.b) {
        return { ...base };
    }
    const a = clamp(fromLeft, base.a, 42);
    const span = base.d - a;
    const baseSpan = base.d - base.a;
    return {
        a,
        b: a + ((base.b - base.a) / baseSpan) * span,
        c: a + ((base.c - base.a) / baseSpan) * span,
        d: base.d
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
