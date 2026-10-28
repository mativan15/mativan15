import { describe, expect, it } from "vitest";
import { norm3, type Vec3 } from "./optics";
import { biconvexShape, focalLength, raySpreadAt, traceBiconvex, worldToLens, lensToWorld, crossPlaneX } from "./biconvex";

const heightsOnPlane = (yaw: number, planeX: number): number[] => {
    const aperture = 100;
    const lens = biconvexShape(aperture);
    const heights: number[] = [];
    for (let i = -3; i <= 3; i += 1) {
        if (i === 0) {
            continue;
        }
        const y = i * 18;
        const worldOrigin: Vec3 = [aperture * 6, y, 0];
        const worldDir = norm3([-1, 0, 0]);
        const hit = traceBiconvex(worldToLens(worldOrigin, yaw), worldToLens(worldDir, yaw), lens);
        if (!hit) {
            continue;
        }
        const exit = lensToWorld(hit.exitPoint, yaw);
        const outgoing = lensToWorld(hit.outgoing, yaw);
        const crossed = crossPlaneX(exit, outgoing, planeX);
        if (crossed !== null) {
            heights.push(crossed);
        }
    }
    return heights;
};

describe("biconvex lens", () => {
    it("bends parallel rays toward one focus along its axis", () => {
        const lens = biconvexShape(100);
        const focus = focalLength(lens);
        const heights: number[] = [];
        for (let i = -4; i <= 4; i += 1) {
            if (i === 0) {
                continue;
            }
            const y = i * 12;
            const hit = traceBiconvex([0, y, lens.curvature * 3], [0, 0, -1], lens);
            expect(hit).not.toBeNull();
            const dir = hit!.outgoing;
            const t = (-focus - hit!.exitPoint[2]) / dir[2];
            heights.push(hit!.exitPoint[1] + dir[1] * t);
        }
        expect(raySpreadAt(heights)).toBeLessThan(8);
    });

    it("focuses light toward the name only when the glass is edge-on", () => {
        const aperture = 100;
        const focusX = -focalLength(biconvexShape(aperture)) * 0.85;
        const edgeOn = heightsOnPlane(Math.PI / 2, focusX);
        const faceOn = heightsOnPlane(0, focusX);
        const back = heightsOnPlane(Math.PI, focusX);
        expect(edgeOn.length).toBeGreaterThan(3);
        expect(raySpreadAt(edgeOn)).toBeLessThan(aperture * 0.2);
        expect(raySpreadAt(faceOn)).toBeGreaterThan(raySpreadAt(edgeOn) * 3);
        expect(raySpreadAt(back)).toBeGreaterThan(raySpreadAt(edgeOn) * 3);
    });

    it("sends the focused ray onward instead of back toward the lamp", () => {
        const lens = biconvexShape(80);
        const hit = traceBiconvex(worldToLens([400, 10, 0], Math.PI / 2), worldToLens(norm3([-1, 0, 0]), Math.PI / 2), lens);
        expect(hit).not.toBeNull();
        const outgoing = lensToWorld(hit!.outgoing, Math.PI / 2);
        expect(outgoing[0]).toBeLessThan(0);
    });
});
