export const headerOffset = (): number => (window.matchMedia("(max-width: 720px)").matches ? 66 : 76);

export const preferredDiameter = (width: number, height: number): number => (
    Math.round(Math.min(height * 0.68, width * 0.56))
);

export const scrollHeight = (height: number, reducedMotion: boolean): number => (
    reducedMotion ? height : Math.round(height * 2.2)
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
    const inset = width * 0.02;
    const gap = width * 0.045;
    const room = width - inset - nameRight - gap;
    const diameter = Math.round(Math.max(1, Math.min(preferred, room)));
    const radius = diameter / 2;
    const x = width - inset - radius;
    const startY = height - radius / 2;
    const endY = reducedMotion ? header + radius + 14 : 0;
    const y = startY + (endY - startY) * progress;
    return { diameter, x, y };
};
