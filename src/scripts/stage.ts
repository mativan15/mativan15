import { n } from "./visual-tune";

export const headerOffset = (): number => (window.matchMedia("(max-width: 720px)").matches ? 66 : 76);

export const preferredDiameter = (width: number, height: number): number => (
    Math.round(Math.min(height * n("lens.heightShare"), width * n("lens.widthShare")))
);

export const scrollHeight = (height: number, reducedMotion: boolean): number => (
    reducedMotion ? height : Math.round(height * n("lens.scroll"))
);

export const nameClearance = (width: number, measuredRight: number, measuredWidth: number): number => (
    measuredWidth > 2 ? measuredRight : width * 0.36
);

export interface LensFrameInput {
    width: number;
    height: number;
    nameRight: number;
    progress: number;
    reducedMotion: boolean;
    header: number;
}

export interface LensFrame {
    diameter: number;
    x: number;
    y: number;
}

export const lensFrame = ({ width, height, nameRight, progress, reducedMotion, header }: LensFrameInput): LensFrame => {
    const preferred = preferredDiameter(width, height);
    const inset = width * n("lens.inset");
    const gap = width * n("lens.gap");
    const room = width - inset - nameRight - gap;
    const diameter = Math.round(Math.max(1, Math.min(preferred, room)));
    const radius = diameter / 2;
    const x = width - inset - radius;
    const startY = height - radius / 2;
    const endY = reducedMotion ? header + radius + 14 : 0;
    const y = startY + (endY - startY) * progress;
    return { diameter, x, y };
};

/**
 * Lamp offset, in lens radii, while the page scrolls.
 * `cross` is the scroll point where the lens lines up with the middle of the name.
 * The offset is `start` at the top of the scroll, `atName` at that lineup,
 * then keeps moving the same way. `keep` of 1 holds the same speed after the lineup.
 */
export const lampSideways = (
    progress: number,
    cross: number,
    start: number,
    atName: number,
    keep: number
): number => {
    const span = Math.min(0.98, Math.max(0.02, cross));
    const slope = (atName - start) / span;
    if (progress <= span) {
        return start + slope * progress;
    }
    return atName + slope * keep * (progress - span);
};

/**
 * Yaw of the lens in degrees while the page scrolls.
 * `cross` is the scroll point where the lens lines up with the middle of the name.
 * The turn is `start` at the top of the scroll, `atName` at that lineup, and `end` at the bottom.
 */
export const lensYaw = (
    progress: number,
    cross: number,
    start: number,
    atName: number,
    end: number
): number => {
    const span = Math.min(0.98, Math.max(0.02, cross));
    const p = Math.min(1, Math.max(0, progress));
    if (p <= span) {
        return start + (atName - start) * (p / span);
    }
    const remain = Math.max(0.02, 1 - span);
    return atName + (end - atName) * ((p - span) / remain);
};
