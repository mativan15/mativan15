import { describe, expect, it } from "vitest";
import { transmit } from "./optics";
import { lensFrame, nameClearance, preferredDiameter, scrollHeight } from "./stage";

describe("lens placement", () => {
    it("keeps a wide lens on the right when the name leaves room", () => {
        const frame = lensFrame({
            width: 1000,
            height: 800,
            nameRight: 300,
            progress: 0,
            reducedMotion: false,
            header: 76
        });
        expect(preferredDiameter(1000, 800)).toBe(544);
        expect(frame.diameter).toBe(544);
        expect(frame.x).toBe(708);
        expect(frame.y).toBe(664);
    });

    it("shrinks the lens so its left edge stays a proportion past the name", () => {
        const frame = lensFrame({
            width: 400,
            height: 800,
            nameRight: 200,
            progress: 0,
            reducedMotion: false,
            header: 76
        });
        expect(frame.diameter).toBe(174);
        expect(frame.x - frame.diameter / 2).toBeCloseTo(218, 5);
        expect(frame.x + frame.diameter / 2).toBeCloseTo(400 - 400 * 0.02, 5);
    });

    it("ends with the center on the top edge, and parks lower when motion is reduced", () => {
        const shared = {
            width: 1000,
            height: 800,
            nameRight: 300,
            progress: 1,
            header: 76
        };
        expect(lensFrame({ ...shared, reducedMotion: false }).y).toBe(0);
        expect(lensFrame({ ...shared, reducedMotion: true }).y).toBe(362);
    });

    it("uses the saved name edge only after the name has a real width", () => {
        expect(nameClearance(1000, 10, 2)).toBe(360);
        expect(nameClearance(1000, 10, 3)).toBe(10);
    });

    it("keeps the original scroll length", () => {
        expect(scrollHeight(800, false)).toBe(1760);
        expect(scrollHeight(800, true)).toBe(800);
        expect(scrollHeight(777, false)).toBe(1709);
    });
});

describe("refraction", () => {
    it("carries a straight ray through the sphere and out the far side", () => {
        const hit = transmit([40, 0, 0], [-1, 0, 0], [0, 0, 0], 10);
        expect(hit).not.toBeNull();
        expect(hit?.entry[0]).toBeCloseTo(10, 5);
        expect(hit?.exitPoint[0]).toBeCloseTo(-9, 5);
        expect(hit?.outgoing[0]).toBeCloseTo(-1, 5);
        expect(hit?.outgoing[1]).toBeCloseTo(0, 5);
    });

    it("ignores a ray that misses the sphere", () => {
        expect(transmit([40, 30, 0], [-1, 0, 0], [0, 0, 0], 10)).toBeNull();
    });
});
