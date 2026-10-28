import { afterEach, describe, expect, it } from "vitest";
import { exportTuneText, isTuneDefault, n, resetTune, setTune, tuneChanges } from "./visual-tune";

afterEach(() => {
    resetTune();
});

describe("visual tune", () => {
    it("starts on the values the page already uses", () => {
        expect(n("lens.ior")).toBe(1.52);
        expect(n("lens.gain")).toBe(2.7);
        expect(n("shelf.idle")).toBe(0.135);
        expect(n("shelf.cruise")).toBe(1.092);
        expect(n("shade.tightEdge")).toBe(0.92);
        expect(tuneChanges()).toEqual([]);
    });

    it("exports only the controls that moved, then restores the original look", () => {
        setTune("lens.ior", 1.4);
        setTune("lens.gain", 2.7);
        const text = exportTuneText();
        expect(text).toContain("lens.ior: 1.52 -> 1.4");
        expect(text).not.toContain("lens.gain:");
        expect(isTuneDefault("lens.gain")).toBe(true);
        resetTune();
        expect(n("lens.ior")).toBe(1.52);
        expect(tuneChanges()).toEqual([]);
    });
});