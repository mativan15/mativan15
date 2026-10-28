import { n } from "./visual-tune";

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
    const w = clamp(width * n("shelf.widthRatio"), n("shelf.widthMin"), n("shelf.widthMax"));
    return {
        w,
        h: w * n("shelf.heightRatio"),
        d: Math.max(n("shelf.depthMin"), w * n("shelf.depthRatio")),
        step: w * n("shelf.step"),
        gap: w * n("shelf.gap")
    };
}

export function shelfPose(distance: number, size: ShelfMetrics): ShelfPose {
    const abs = Math.abs(distance);
    const sign = distance < 0 ? -1 : distance > 0 ? 1 : 0;
    const prominence = Math.exp(-abs * abs * n("shelf.prominence"));
    return {
        x: distance * size.step + sign * size.gap * Math.min(abs, 1),
        y: -prominence * size.w * n("shelf.lift"),
        z: -abs * size.w * n("shelf.zBack") + prominence * size.w * n("shelf.zFront"),
        rot: distance === 0 ? 0 : clamp(-distance * n("shelf.rot"), -n("shelf.rotMax"), n("shelf.rotMax")),
        scale: n("shelf.scaleBase") + prominence * n("shelf.scalePop")
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

/** How solid the page color is at a point, 0 at the left edge and 100 at the right. */
export function shadeAlpha(shade: ShelfShade, fromLeftPercent: number): number {
    const point = Math.min(fromLeftPercent, 100 - fromLeftPercent);
    const stops: [number, number][] = [
        [0, shade.edge],
        [shade.a, shade.aAlpha],
        [shade.b, shade.bAlpha],
        [shade.c, shade.cAlpha],
        [shade.d, 0],
        [50, 0]
    ].sort((left, right) => left[0] - right[0]);
    if (point <= stops[0][0]) {
        return stops[0][1];
    }
    for (let index = 1; index < stops.length; index += 1) {
        const [start, startAlpha] = stops[index - 1];
        const [end, endAlpha] = stops[index];
        if (point <= end) {
            const span = end - start;
            const mix = span === 0 ? 0 : (point - start) / span;
            return startAlpha + (endAlpha - startAlpha) * mix;
        }
    }
    return 0;
}

const bookCenterX = (distance: number, size: ShelfMetrics): number => Math.abs(shelfPose(distance, size).x);

const fromLeftOf = (x: number, stageWidth: number): number => 50 - (Math.abs(x) / stageWidth) * 100;

/**
 * Shadow across the stage.
 * Stops are percentages from the left edge. Alphas are how solid the page color is.
 * Books closer than half a cycle are unique, so they only get a light dim.
 * The copy at half a cycle is the same title on both sides, so that one goes dark.
 * When that copy is already off the screen, only the light side dim remains.
 */
export function shelfShade(count: number, stageWidth: number, size: ShelfMetrics): ShelfShade {
    const openShade = (): ShelfShade => ({
        edge: n("shade.openEdge"),
        a: n("shade.openA"),
        aAlpha: n("shade.openAAlpha"),
        b: n("shade.openB"),
        bAlpha: n("shade.openBAlpha"),
        c: n("shade.openC"),
        cAlpha: n("shade.openCAlpha"),
        d: n("shade.openD")
    });
    if (count <= 1 || stageWidth <= 0) {
        return openShade();
    }
    const repeatX = bookCenterX(count / 2, size);
    if (repeatX >= stageWidth / 2) {
        return openShade();
    }
    const uniqueDistance = Math.floor((count - 1) / 2);
    const uniqueX = bookCenterX(uniqueDistance, size);
    const repeatPercent = fromLeftOf(repeatX, stageWidth);
    const uniquePercent = uniqueDistance === 0 ? 44 : fromLeftOf(uniqueX, stageWidth);
    const spotlight = fromLeftOf(bookCenterX(0.4, size), stageWidth);
    const repeatStop = clamp(repeatPercent, 4, 42);
    const uniqueStop = clamp(Math.max(uniquePercent, repeatStop + 3), repeatStop + 3, 46);
    const tight: ShelfShade = {
        edge: n("shade.tightEdge"),
        a: clamp(repeatStop - n("shade.aLead"), 2, repeatStop - 1.5),
        aAlpha: n("shade.aAlpha"),
        b: repeatStop,
        bAlpha: n("shade.bAlpha"),
        c: uniqueStop,
        cAlpha: n("shade.cAlpha"),
        d: clamp(Math.max(spotlight, uniqueStop + n("shade.dExtra")), uniqueStop + 4, 48)
    };
    return tight;
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
    return Math.ceil(n("shelf.minLoop") / count);
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
    if (pointer === null || Math.abs(pointer) < n("shelf.deadZone")) {
        return n("shelf.idle");
    }
    return Math.sign(pointer) * n("shelf.cruise");
}

export function visibleBooks<T extends { tag: string }>(books: readonly T[], tag: string): T[] {
    if (tag === "all") {
        return [...books];
    }
    return books.filter((book) => book.tag === tag);
}
