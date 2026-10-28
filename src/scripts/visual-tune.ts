/**
 * Temporary visual debug values.
 * Every default matches the look that shipped before this panel existed.
 * Delete this module once those exported numbers are baked back into the site.
 */

export type TuneKind = "number" | "color" | "toggle";

export interface TuneField {
    id: string;
    group: string;
    label: string;
    hint: string;
    kind: TuneKind;
    min?: number;
    max?: number;
    step?: number;
    /** Shown beside the number. Also the CSS unit when `cssVar` is set. */
    unit?: string;
    cssVar?: string;
    default: number | string | boolean;
}

const STORAGE_KEY = "mativan15-visual-tune";

export const TUNE_FIELDS: readonly TuneField[] = [
    { id: "page.bg", group: "Page", label: "Page background", hint: "The black behind the whole page, including the lens scene.", kind: "color", cssVar: "--dbg-page-bg", default: "#07080a" },
    { id: "page.ink", group: "Page", label: "Page text", hint: "Main cream text color.", kind: "color", cssVar: "--dbg-page-ink", default: "#e7e1d6" },
    { id: "page.header", group: "Page", label: "Header color", hint: "The bar color after you scroll.", kind: "color", default: "#07080a" },
    { id: "page.headerAlpha", group: "Page", label: "Header strength", hint: "0 is see-through, 1 is solid. Starts at 88%.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.88 },
    { id: "page.accent", group: "Page", label: "Accent", hint: "Amber used on buttons and repository links.", kind: "color", cssVar: "--dbg-accent", default: "#e8a04a" },

    { id: "lens.scale", group: "Lens size", label: "Size", hint: "Multiplies the lens after it has been fitted. 1 is the current size.", kind: "number", min: 0.25, max: 2.2, step: 0.01, unit: "×", default: 1 },
    { id: "lens.widthShare", group: "Lens size", label: "Width share", hint: "How much of the screen width the lens wants. 0.56 is 56%.", kind: "number", min: 0.15, max: 0.95, step: 0.01, default: 0.56 },
    { id: "lens.heightShare", group: "Lens size", label: "Height share", hint: "How much of the screen height the lens wants. 0.68 is 68%.", kind: "number", min: 0.15, max: 1, step: 0.01, default: 0.68 },
    { id: "lens.inset", group: "Lens size", label: "Right margin", hint: "Gap between the lens and the right edge, as a fraction of the width.", kind: "number", min: 0, max: 0.25, step: 0.005, default: 0.02 },
    { id: "lens.gap", group: "Lens size", label: "Gap after the name", hint: "Space kept between the name and the lens, as a fraction of the width.", kind: "number", min: 0, max: 0.3, step: 0.005, default: 0.045 },
    { id: "lens.scroll", group: "Lens size", label: "Scroll length", hint: "How many screen-heights the lens takes to rise. 2.2 is the current travel.", kind: "number", min: 1, max: 4, step: 0.05, unit: "× screen", default: 2.2 },
    { id: "lens.yNudge", group: "Lens size", label: "Vertical nudge", hint: "Moves the lens down when positive, up when negative.", kind: "number", min: -500, max: 500, step: 1, unit: "px", default: 0 },
    { id: "lens.opacity", group: "Lens size", label: "Lens opacity", hint: "The glass drawing. 0 hides it, 1 is solid.", kind: "number", min: 0, max: 1, step: 0.01, cssVar: "--dbg-lens-opacity", default: 1 },

    { id: "lens.yawStart", group: "Lens turn", label: "Turn at the start", hint: "Degrees around the vertical axis when the scroll begins. 0 faces you, the round glass you have now.", kind: "number", min: -30, max: 360, step: 1, unit: "°", default: 0 },
    { id: "lens.yawName", group: "Lens turn", label: "Turn at the name", hint: "Degrees when the lens lines up with the middle of the name. 90 shows the edge, like a lens seen from the side.", kind: "number", min: 0, max: 360, step: 1, unit: "°", default: 90 },
    { id: "lens.yawEnd", group: "Lens turn", label: "Turn at the end", hint: "Degrees at the bottom of the opening scroll. 180 faces you again, so the glass is round.", kind: "number", min: 0, max: 360, step: 1, unit: "°", default: 180 },
    { id: "lens.curve", group: "Lens turn", label: "Face curve", hint: "Radius of each curved face, measured in lens widths. Lower bulges more and focuses closer. 1.75 is a thick focusing lens.", kind: "number", min: 1.05, max: 4, step: 0.01, default: 1.75 },
    { id: "lens.edge", group: "Lens turn", label: "Rim thickness", hint: "How thick the rim is, as a fraction of the lens radius. The middle is thicker because the faces bulge.", kind: "number", min: 0.02, max: 0.25, step: 0.005, default: 0.06 },

    { id: "lens.lampDist", group: "Lens light", label: "Lamp distance", hint: "How far the lamp sits to the right of the lens, in lens radii. Farther makes the incoming rays more parallel, like the textbook drawing.", kind: "number", min: 2.5, max: 24, step: 0.1, unit: "× radius", default: 8 },
    { id: "lens.lightY", group: "Lens light", label: "Lamp up / down", hint: "Raises the lamp above the lens when positive. 0 keeps it level with the glass.", kind: "number", min: -2, max: 2, step: 0.01, unit: "× radius", default: 0 },
    { id: "lens.lightZ", group: "Lens light", label: "Lamp depth", hint: "Moves the lamp out of the page. 0 keeps it in the same plane as the lens, so the focus stays on the screen.", kind: "number", min: 0, max: 4, step: 0.01, unit: "× radius", default: 0 },
    { id: "lens.gain", group: "Lens light", label: "Beam brightness", hint: "Strength of the orange beam. The current look is 2.7.", kind: "number", min: 0, max: 8, step: 0.01, default: 2.7 },
    { id: "lens.beamAlpha", group: "Lens light", label: "Beam opacity", hint: "How solid the beam is after it is colored. 0.9 is the current look.", kind: "number", min: 0, max: 1.5, step: 0.01, default: 0.9 },
    { id: "lens.knee", group: "Lens light", label: "Beam softness", hint: "Higher spreads the bright core into a wider glow.", kind: "number", min: 0.4, max: 24, step: 0.1, default: 6.4 },
    { id: "lens.spine", group: "Lens light", label: "Beam core", hint: "The thin bright line leaving the lens toward the name.", kind: "number", min: 0, max: 40, step: 0.1, default: 14 },
    { id: "lens.exitSoft", group: "Lens light", label: "Exit glow", hint: "The softer light around the beam after it leaves the glass.", kind: "number", min: 0, max: 1.5, step: 0.01, default: 0.22 },
    { id: "lens.sigma", group: "Lens light", label: "Beam width", hint: "Thickness of the beam relative to the lens.", kind: "number", min: 0.005, max: 0.25, step: 0.001, default: 0.055 },
    { id: "lens.beamCool", group: "Lens light", label: "Beam shadow color", hint: "The darker orange in the thin parts of the beam.", kind: "color", default: "#ed6910" },
    { id: "lens.beamWarm", group: "Lens light", label: "Beam hot color", hint: "The pale color where the beam is densest.", kind: "color", default: "#fae8c7" },
    { id: "lens.blur", group: "Lens light", label: "Beam blur", hint: "How much the beam is smeared. 1.3 is the current look.", kind: "number", min: 0.2, max: 6, step: 0.05, default: 1.3 },
    { id: "lens.blurSpread", group: "Lens light", label: "Blur reach", hint: "How far that smear is allowed to extend, in pixels.", kind: "number", min: 0, max: 48, step: 1, unit: "px", default: 14 },

    { id: "lens.ior", group: "Lens glass", label: "Refraction", hint: "Glass index. 1.52 is window glass. Lower is weaker bending, higher bends more.", kind: "number", min: 1.05, max: 2.4, step: 0.01, default: 1.52 },
    { id: "lens.steer", group: "Lens glass", label: "Ray steer", hint: "How hard bent rays are pulled back toward the lamp direction. 0.6 is current.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.6 },
    { id: "lens.spread", group: "Lens glass", label: "Ray bundle", hint: "How wide the bundle of rays through the glass is.", kind: "number", min: 0.05, max: 1.2, step: 0.01, default: 0.36 },
    { id: "lens.focus", group: "Lens glass", label: "Focus depth", hint: "Where inside the sphere the rays aim. 0.72 is current.", kind: "number", min: 0.05, max: 1.6, step: 0.01, default: 0.72 },
    { id: "lens.bendNear", group: "Lens glass", label: "Center bend", hint: "How strongly the middle of the lens shifts the symbols behind it.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.26 },
    { id: "lens.bendFar", group: "Lens glass", label: "Edge bend", hint: "How strongly the rim of the lens shifts those symbols.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.48 },
    { id: "lens.glyphThrough", group: "Lens glass", label: "Symbols inside glass", hint: "How bright the page stays after the glass bends it. Higher is clearer glass.", kind: "number", min: 0, max: 1.4, step: 0.01, default: 0.82 },
    { id: "lens.fresnel", group: "Lens glass", label: "Fresnel", hint: "How quickly the rim brightens as the surface turns away.", kind: "number", min: 0.2, max: 8, step: 0.05, default: 2.5 },
    { id: "lens.rim", group: "Lens glass", label: "Rim brightness", hint: "1 is the current rim. 0 removes it.", kind: "number", min: 0, max: 3, step: 0.01, default: 1 },
    { id: "lens.specPower", group: "Lens glass", label: "Highlight tightness", hint: "Higher makes the white glint smaller and sharper.", kind: "number", min: 1, max: 128, step: 1, default: 34 },
    { id: "lens.specGain", group: "Lens glass", label: "Highlight strength", hint: "Brightness of that sharp glint.", kind: "number", min: 0, max: 2, step: 0.01, default: 0.42 },
    { id: "lens.specSoft", group: "Lens glass", label: "Soft highlight tightness", hint: "The wider, duller shine on the glass.", kind: "number", min: 1, max: 32, step: 0.1, default: 7 },
    { id: "lens.specSoftGain", group: "Lens glass", label: "Soft highlight strength", hint: "Brightness of the wider shine.", kind: "number", min: 0, max: 0.4, step: 0.005, default: 0.02 },
    { id: "lens.glassSpine", group: "Lens glass", label: "Light caught in glass", hint: "The bright streak drawn inside the lens.", kind: "number", min: 0, max: 40, step: 0.1, default: 16 },
    { id: "lens.glassCap", group: "Lens glass", label: "Glass brightness cap", hint: "The brightest the glass is allowed to get. 0.97 is current.", kind: "number", min: 0.2, max: 1.5, step: 0.01, default: 0.97 },

    { id: "glyph.opacity", group: "Floating symbols", label: "Field opacity", hint: "The whole layer of symbols behind the name. 0.46 is current.", kind: "number", min: 0, max: 1, step: 0.01, cssVar: "--dbg-glyph-opacity", default: 0.46 },
    { id: "glyph.alpha", group: "Floating symbols", label: "Symbol strength", hint: "Extra multiplier on each symbol. 1 leaves them as they are.", kind: "number", min: 0, max: 2, step: 0.01, default: 1 },
    { id: "glyph.count", group: "Floating symbols", label: "Count on desktop", hint: "How many symbols are scattered on a wide screen.", kind: "number", min: 0, max: 6000, step: 50, default: 3000 },
    { id: "glyph.countPhone", group: "Floating symbols", label: "Count on a phone", hint: "How many symbols are scattered on a narrow screen.", kind: "number", min: 0, max: 4000, step: 50, default: 1200 },
    { id: "glyph.sizeMin", group: "Floating symbols", label: "Smallest symbol", hint: "Starting size in pixels. Random symbols grow from here.", kind: "number", min: 4, max: 28, step: 0.1, unit: "px", default: 8 },
    { id: "glyph.sizeSpan", group: "Floating symbols", label: "Size range", hint: "Added to the smallest size. 3 means symbols land between 8 and 11.", kind: "number", min: 0, max: 20, step: 0.1, unit: "px", default: 3 },
    { id: "glyph.paper", group: "Floating symbols", label: "Paper color", hint: "Most symbols.", kind: "color", default: "#e7e1d6" },
    { id: "glyph.amber", group: "Floating symbols", label: "Amber symbols", hint: "The fewer warm symbols mixed in.", kind: "color", default: "#e8a04a" },
    { id: "glyph.speed", group: "Floating symbols", label: "Drift speed", hint: "1 is the current pace. 0 holds them still.", kind: "number", min: 0, max: 3, step: 0.01, default: 1 },
    { id: "glyph.drift", group: "Floating symbols", label: "Drift distance", hint: "How far the slow swell moves each symbol. 1 is current.", kind: "number", min: 0, max: 4, step: 0.01, default: 1 },
    { id: "glyph.pushRadius", group: "Floating symbols", label: "Pointer push radius", hint: "How far from the pointer symbols start to move away.", kind: "number", min: 0, max: 400, step: 1, unit: "px", default: 168 },
    { id: "glyph.push", group: "Floating symbols", label: "Pointer push", hint: "How far a symbol is shoved. 36 is current.", kind: "number", min: 0, max: 120, step: 1, unit: "px", default: 36 },
    { id: "glyph.waterPush", group: "Floating symbols", label: "Wake strength", hint: "How hard a moving pointer drags the symbol field.", kind: "number", min: 0, max: 2, step: 0.01, default: 0.85 },
    { id: "glyph.waterDamp", group: "Floating symbols", label: "Wake fade", hint: "How quickly that wake dies. Lower fades faster.", kind: "number", min: 0.05, max: 0.98, step: 0.01, default: 0.55 },
    { id: "glyph.pause", group: "Floating symbols", label: "Pause the drift", hint: "Stops the swell. The pointer can still push symbols.", kind: "toggle", default: false },

    { id: "name.scale", group: "Name", label: "Name size", hint: "1 is the current size on every screen width.", kind: "number", min: 0.4, max: 1.8, step: 0.01, unit: "×", cssVar: "--dbg-name-scale", default: 1 },
    { id: "name.track", group: "Name", label: "Letter spacing", hint: "Negative pulls the letters tighter. Current is -0.045em.", kind: "number", min: -0.12, max: 0.08, step: 0.001, unit: "em", cssVar: "--dbg-name-track", default: -0.045 },
    { id: "name.leading", group: "Name", label: "Line spacing", hint: "Space between Ivan, Sardon, and Medina. 0.84 is current.", kind: "number", min: 0.6, max: 1.4, step: 0.01, cssVar: "--dbg-name-leading", default: 0.84 },
    { id: "name.fill", group: "Name", label: "Resting color", hint: "The dim letters before the beam reaches them.", kind: "color", cssVar: "--dbg-name-fill", default: "#6f6a62" },
    { id: "name.beam", group: "Name", label: "Lit color", hint: "The letters while the beam is on them.", kind: "color", cssVar: "--dbg-name-beam", default: "#fffdf8" },
    { id: "name.glowNear", group: "Name", label: "Tight glow", hint: "The small halo on a lit letter.", kind: "number", min: 0, max: 48, step: 1, unit: "px", cssVar: "--dbg-glow-near", default: 14 },
    { id: "name.glowFar", group: "Name", label: "Wide glow", hint: "The larger halo on a lit letter.", kind: "number", min: 0, max: 80, step: 1, unit: "px", cssVar: "--dbg-glow-far", default: 32 },
    { id: "name.gray", group: "Name", label: "Lit letter gray", hint: "1 removes color from the lit letters. 0 lets the lit color show.", kind: "number", min: 0, max: 1, step: 0.01, cssVar: "--dbg-name-gray", default: 1 },
    { id: "name.left", group: "Name", label: "Name inset", hint: "Distance from the left edge.", kind: "number", min: 0, max: 30, step: 0.1, unit: "vw", cssVar: "--dbg-copy-left", default: 7 },
    { id: "name.shift", group: "Name", label: "Name vertical shift", hint: "Moves the name and the line under it. Positive is down.", kind: "number", min: -200, max: 200, step: 1, unit: "px", cssVar: "--dbg-copy-shift", default: 0 },
    { id: "name.line", group: "Name", label: "Line under the name", hint: "The sentence under the name.", kind: "color", cssVar: "--dbg-line", default: "#e7e1d6" },
    { id: "name.hintOpacity", group: "Name", label: "Hint opacity", hint: "The small “move the pointer” line.", kind: "number", min: 0, max: 1, step: 0.01, cssVar: "--dbg-hint-opacity", default: 0.72 },
    { id: "name.beamFloor", group: "Name", label: "Letter glow floor", hint: "The least glow a letter keeps.", kind: "number", min: 0, max: 0.4, step: 0.005, default: 0.04 },
    { id: "name.beamBase", group: "Name", label: "Letter glow base", hint: "How much of the beam reaches the letters.", kind: "number", min: 0, max: 1.5, step: 0.01, default: 0.28 },
    { id: "name.beamTight", group: "Name", label: "Letter glow focus", hint: "Extra glow when the beam is gathered into a small band.", kind: "number", min: 0, max: 1.5, step: 0.01, default: 0.72 },

    { id: "shelf.idle", group: "Carousel motion", label: "Idle speed", hint: "Books per second while the pointer is away. About one book every 7 seconds.", kind: "number", min: 0, max: 1, step: 0.001, unit: "books/s", default: 0.135 },
    { id: "shelf.cruise", group: "Carousel motion", label: "Pointer speed", hint: "Books per second while the pointer rests on a side.", kind: "number", min: 0, max: 4, step: 0.001, unit: "books/s", default: 1.092 },
    { id: "shelf.deadZone", group: "Carousel motion", label: "Center dead zone", hint: "The middle band that keeps the slow spin. 0.16 is 16% of the half-width.", kind: "number", min: 0, max: 0.8, step: 0.01, default: 0.16 },
    { id: "shelf.ease", group: "Carousel motion", label: "Speed ease", hint: "How long the shelf takes to reach the new speed.", kind: "number", min: 1, max: 800, step: 1, unit: "ms", default: 120 },
    { id: "shelf.clickMs", group: "Carousel motion", label: "Click glide", hint: "How quickly a clicked side book slides to the center.", kind: "number", min: 1, max: 800, step: 1, unit: "ms", default: 75 },
    { id: "shelf.arrowMs", group: "Carousel motion", label: "Arrow glide", hint: "How quickly the arrow keys move one book.", kind: "number", min: 1, max: 800, step: 1, unit: "ms", default: 170 },
    { id: "shelf.wheel", group: "Carousel motion", label: "Wheel distance", hint: "Higher makes a horizontal wheel move the shelf less.", kind: "number", min: 40, max: 2000, step: 10, default: 420 },
    { id: "shelf.openDistance", group: "Carousel motion", label: "Open distance", hint: "How close a book must be to the center before a click opens it.", kind: "number", min: 0.05, max: 1.5, step: 0.01, unit: "books", default: 0.45 },
    { id: "shelf.pause", group: "Carousel motion", label: "Pause the spin", hint: "Stops the automatic turn. Drag and click still work.", kind: "toggle", default: false },

    { id: "shelf.widthRatio", group: "Carousel books", label: "Width share", hint: "Book width as a fraction of the stage. 0.16 is 16%.", kind: "number", min: 0.06, max: 0.4, step: 0.005, default: 0.16 },
    { id: "shelf.widthMin", group: "Carousel books", label: "Minimum width", hint: "Books never get narrower than this.", kind: "number", min: 60, max: 220, step: 1, unit: "px", default: 108 },
    { id: "shelf.widthMax", group: "Carousel books", label: "Maximum width", hint: "Books never get wider than this.", kind: "number", min: 80, max: 320, step: 1, unit: "px", default: 176 },
    { id: "shelf.heightRatio", group: "Carousel books", label: "Height", hint: "Cover height compared with width. 1.5 is a tall book.", kind: "number", min: 0.8, max: 2.4, step: 0.01, unit: "× width", default: 1.5 },
    { id: "shelf.depthRatio", group: "Carousel books", label: "Thickness", hint: "The page block, as a fraction of the width.", kind: "number", min: 0.04, max: 0.6, step: 0.01, default: 0.2 },
    { id: "shelf.depthMin", group: "Carousel books", label: "Minimum thickness", hint: "The page block never gets thinner than this.", kind: "number", min: 4, max: 80, step: 1, unit: "px", default: 22 },
    { id: "shelf.step", group: "Carousel books", label: "Spacing", hint: "Distance from one book to the next, as a fraction of the width.", kind: "number", min: 0.2, max: 1.4, step: 0.01, default: 0.56 },
    { id: "shelf.gap", group: "Carousel books", label: "Neighbor gap", hint: "Extra space opened beside the center book.", kind: "number", min: 0, max: 1.4, step: 0.01, default: 0.62 },
    { id: "shelf.prominence", group: "Carousel books", label: "Center falloff", hint: "How fast books shrink as they leave the center. Higher is steeper.", kind: "number", min: 0.2, max: 4, step: 0.01, default: 1.7 },
    { id: "shelf.lift", group: "Carousel books", label: "Center lift", hint: "How far the center book rises.", kind: "number", min: 0, max: 0.4, step: 0.005, default: 0.08 },
    { id: "shelf.zFront", group: "Carousel books", label: "Center depth", hint: "How far the center book comes forward.", kind: "number", min: 0, max: 1.4, step: 0.01, default: 0.55 },
    { id: "shelf.zBack", group: "Carousel books", label: "Side depth", hint: "How far side books sink backward.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.22 },
    { id: "shelf.rot", group: "Carousel books", label: "Turn per book", hint: "Degrees a book yaws for each step away from the center.", kind: "number", min: 0, max: 70, step: 0.5, unit: "°", default: 31 },
    { id: "shelf.rotMax", group: "Carousel books", label: "Maximum turn", hint: "Yaw never passes this.", kind: "number", min: 0, max: 89, step: 1, unit: "°", default: 58 },
    { id: "shelf.scaleBase", group: "Carousel books", label: "Side scale", hint: "Size of a book far from the center.", kind: "number", min: 0.4, max: 1.2, step: 0.01, default: 0.94 },
    { id: "shelf.scalePop", group: "Carousel books", label: "Center scale boost", hint: "Added to the side scale for the center book.", kind: "number", min: 0, max: 0.6, step: 0.01, default: 0.16 },
    { id: "shelf.minLoop", group: "Carousel books", label: "Loop length", hint: "Short filters repeat until the row is at least this many slots.", kind: "number", min: 4, max: 40, step: 1, default: 16 },

    { id: "shelf.perspective", group: "Carousel stage", label: "Perspective", hint: "Lower looks more dramatic. 1700 is current.", kind: "number", min: 400, max: 4000, step: 10, unit: "px", cssVar: "--dbg-perspective", default: 1700 },
    { id: "shelf.originX", group: "Carousel stage", label: "Vanishing point sideways", hint: "50 is the middle.", kind: "number", min: 0, max: 100, step: 1, unit: "%", cssVar: "--dbg-origin-x", default: 50 },
    { id: "shelf.originY", group: "Carousel stage", label: "Vanishing point height", hint: "42 is a little above the middle.", kind: "number", min: 0, max: 100, step: 1, unit: "%", cssVar: "--dbg-origin-y", default: 42 },
    { id: "shelf.tilt", group: "Carousel stage", label: "Shelf tilt", hint: "The row tips back by this many degrees.", kind: "number", min: -20, max: 40, step: 0.5, unit: "deg", cssVar: "--dbg-tilt", default: 7 },
    { id: "shelf.heightVh", group: "Carousel stage", label: "Stage height", hint: "The stage is the smaller of this and the pixel height.", kind: "number", min: 20, max: 90, step: 1, unit: "vh", cssVar: "--dbg-shelf-vh", default: 50 },
    { id: "shelf.heightPx", group: "Carousel stage", label: "Stage height cap", hint: "The stage never grows past this on a wide screen.", kind: "number", min: 200, max: 800, step: 4, unit: "px", cssVar: "--dbg-shelf-px", default: 460 },
    { id: "shelf.heightMin", group: "Carousel stage", label: "Stage minimum", hint: "The stage never shrinks past this on a wide screen.", kind: "number", min: 180, max: 500, step: 4, unit: "px", cssVar: "--dbg-shelf-min", default: 320 },
    { id: "shelf.phoneHeight", group: "Carousel stage", label: "Phone stage height", hint: "Used when the screen is under 720 pixels wide.", kind: "number", min: 180, max: 560, step: 4, unit: "px", cssVar: "--dbg-shelf-phone", default: 300 },
    { id: "shelf.phoneMin", group: "Carousel stage", label: "Phone stage minimum", hint: "Minimum height on a phone.", kind: "number", min: 160, max: 480, step: 4, unit: "px", cssVar: "--dbg-shelf-phone-min", default: 280 },
    { id: "shelf.bookTop", group: "Carousel stage", label: "Book vertical center", hint: "48 places the books slightly above the middle of the stage.", kind: "number", min: 20, max: 80, step: 1, unit: "%", cssVar: "--dbg-book-top", default: 48 },
    { id: "shelf.titleSize", group: "Carousel stage", label: "Caption title", hint: "The project name under the shelf.", kind: "number", min: 14, max: 56, step: 1, unit: "px", cssVar: "--dbg-cap-title", default: 28 },
    { id: "shelf.noteSize", group: "Carousel stage", label: "Caption note", hint: "The sentence under the project name.", kind: "number", min: 11, max: 24, step: 1, unit: "px", cssVar: "--dbg-cap-note", default: 15 },

    { id: "shade.color", group: "Carousel shadow", label: "Shadow color", hint: "The color laid over the books at the sides.", kind: "color", default: "#07080a" },
    { id: "shade.opacity", group: "Carousel shadow", label: "Shadow layer", hint: "0 hides the whole side shadow. 1 is the full effect.", kind: "number", min: 0, max: 1, step: 0.01, cssVar: "--dbg-shade-opacity", default: 1 },
    { id: "shade.openEdge", group: "Carousel shadow", label: "Wide-row edge", hint: "Darkness at the very edge when every book already fits. 0.2 is a light dim.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.2 },
    { id: "shade.openA", group: "Carousel shadow", label: "Wide-row stop A", hint: "Percent from the left edge where the wide-row fade continues.", kind: "number", min: 0, max: 40, step: 0.5, unit: "%", default: 4 },
    { id: "shade.openAAlpha", group: "Carousel shadow", label: "Wide-row A darkness", hint: "0 is clear, 1 is solid.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.12 },
    { id: "shade.openB", group: "Carousel shadow", label: "Wide-row stop B", hint: "Next percent inward.", kind: "number", min: 0, max: 45, step: 0.5, unit: "%", default: 9 },
    { id: "shade.openBAlpha", group: "Carousel shadow", label: "Wide-row B darkness", hint: "0 is clear, 1 is solid.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.06 },
    { id: "shade.openC", group: "Carousel shadow", label: "Wide-row stop C", hint: "Next percent inward.", kind: "number", min: 0, max: 48, step: 0.5, unit: "%", default: 16 },
    { id: "shade.openCAlpha", group: "Carousel shadow", label: "Wide-row C darkness", hint: "0 is clear, 1 is solid.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.02 },
    { id: "shade.openD", group: "Carousel shadow", label: "Wide-row clear point", hint: "Percent where the wide-row shadow is gone.", kind: "number", min: 4, max: 49, step: 0.5, unit: "%", default: 24 },
    { id: "shade.tightEdge", group: "Carousel shadow", label: "Short-row edge", hint: "Darkness at the edge when a repeated book would show. 0.92 is nearly solid.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.92 },
    { id: "shade.aAlpha", group: "Carousel shadow", label: "Before the repeat", hint: "Darkness just outside the repeated copy.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.94 },
    { id: "shade.bAlpha", group: "Carousel shadow", label: "On the repeat", hint: "Darkness on the repeated copy of a book.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.84 },
    { id: "shade.cAlpha", group: "Carousel shadow", label: "Last unique book", hint: "Darkness on the furthest book that is still a different title.", kind: "number", min: 0, max: 1, step: 0.01, default: 0.2 },
    { id: "shade.aLead", group: "Carousel shadow", label: "Fade lead", hint: "How many percent of the stage the dark starts before the repeated book.", kind: "number", min: 0, max: 20, step: 0.1, unit: "%", default: 5 },
    { id: "shade.dExtra", group: "Carousel shadow", label: "Clear band", hint: "How far the fade continues inward from the last unique book.", kind: "number", min: 0, max: 24, step: 0.1, unit: "%", default: 6 },

    { id: "about.portrait", group: "About", label: "Portrait height", hint: "On a wide screen. A phone uses the next control.", kind: "number", min: 180, max: 800, step: 4, unit: "px", cssVar: "--dbg-portrait", default: 460 },
    { id: "about.portraitPhone", group: "About", label: "Portrait height on a phone", hint: "Used under 720 pixels wide.", kind: "number", min: 160, max: 700, step: 4, unit: "px", cssVar: "--dbg-portrait-phone", default: 380 }
];

const fieldById = new Map(TUNE_FIELDS.map((field) => [field.id, field]));

const EXACT_COLORS: Record<string, [number, number, number]> = {
    "lens.beamCool": [0.93, 0.41, 0.06],
    "lens.beamWarm": [0.98, 0.91, 0.78]
};

const values = new Map<string, number | string | boolean>();
const listeners = new Set<() => void>();
let generation = 0;

TUNE_FIELDS.forEach((field) => {
    values.set(field.id, field.default);
});

const fieldOf = (id: string): TuneField => {
    const field = fieldById.get(id);
    if (!field) {
        throw new Error(`Unknown visual control: ${id}`);
    }
    return field;
};

export const tuneGeneration = (): number => generation;

export const n = (id: string): number => {
    const field = fieldOf(id);
    const value = values.get(id);
    return typeof value === "number" ? value : Number(field.default);
};

export const c = (id: string): string => {
    const value = values.get(id);
    return typeof value === "string" ? value : String(fieldOf(id).default);
};

export const flag = (id: string): boolean => values.get(id) === true;

export const tuneValue = (id: string): number | string | boolean => {
    const value = values.get(id);
    return value === undefined ? fieldOf(id).default : value;
};

export const isTuneDefault = (id: string): boolean => {
    const field = fieldOf(id);
    const value = values.get(id);
    if (typeof field.default === "string") {
        return String(value).toLowerCase() === field.default.toLowerCase();
    }
    return Object.is(value, field.default);
};

const clampNumber = (field: TuneField, value: number): number => {
    if (!Number.isFinite(value)) {
        return Number(field.default);
    }
    const min = field.min ?? value;
    const max = field.max ?? value;
    return Math.min(max, Math.max(min, value));
};

const hexChannels = (hex: string): [number, number, number] | null => {
    const match = /^#([\da-f]{6})$/i.exec(hex.trim());
    if (!match?.[1]) {
        return null;
    }
    const raw = Number.parseInt(match[1], 16);
    return [(raw >> 16) & 255, (raw >> 8) & 255, raw & 255];
};

export const tuneVec3 = (id: string): [number, number, number] => {
    if (isTuneDefault(id) && EXACT_COLORS[id]) {
        return EXACT_COLORS[id];
    }
    const channels = hexChannels(c(id));
    if (!channels) {
        return EXACT_COLORS[id] ?? [1, 1, 1];
    }
    return [channels[0] / 255, channels[1] / 255, channels[2] / 255];
};

const writeCss = (name: string, value: string | null): void => {
    if (typeof document === "undefined") {
        return;
    }
    if (value === null) {
        document.documentElement.style.removeProperty(name);
        return;
    }
    document.documentElement.style.setProperty(name, value);
};

const CSS_UNITS = new Set(["px", "em", "vw", "vh", "%", "deg"]);

const cssText = (field: TuneField, value: number | string | boolean): string => {
    if (field.kind === "number" && field.unit && CSS_UNITS.has(field.unit)) {
        return `${value}${field.unit}`;
    }
    return String(value);
};

export const applyTuneCss = (): void => {
    if (typeof document === "undefined") {
        return;
    }
    TUNE_FIELDS.forEach((field) => {
        if (!field.cssVar) {
            return;
        }
        const value = values.get(field.id);
        if (value === undefined || isTuneDefault(field.id)) {
            writeCss(field.cssVar, null);
            return;
        }
        writeCss(field.cssVar, cssText(field, value));
    });

    if (isTuneDefault("page.header") && isTuneDefault("page.headerAlpha")) {
        writeCss("--dbg-header", null);
    } else {
        const channels = hexChannels(c("page.header")) ?? [7, 8, 10];
        writeCss("--dbg-header", `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${n("page.headerAlpha")})`);
    }

    if (isTuneDefault("shade.color")) {
        writeCss("--dbg-shade-rgb", null);
    } else {
        const channels = hexChannels(c("shade.color")) ?? [7, 8, 10];
        writeCss("--dbg-shade-rgb", `${channels[0]}, ${channels[1]}, ${channels[2]}`);
    }
};

const persist = (): void => {
    if (typeof localStorage === "undefined") {
        return;
    }
    const changed: Record<string, number | string | boolean> = {};
    TUNE_FIELDS.forEach((field) => {
        if (!isTuneDefault(field.id)) {
            const value = values.get(field.id);
            if (value !== undefined) {
                changed[field.id] = value;
            }
        }
    });
    if (Object.keys(changed).length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
};

const emit = (): void => {
    generation += 1;
    listeners.forEach((listener) => listener());
};

export const setTune = (id: string, next: number | string | boolean): void => {
    const field = fieldOf(id);
    let stored: number | string | boolean;
    if (field.kind === "number") {
        stored = clampNumber(field, Number(next));
    } else if (field.kind === "color") {
        const text = String(next).trim().toLowerCase();
        stored = hexChannels(text) ? text : field.default;
    } else {
        stored = next === true;
    }
    if (Object.is(values.get(id), stored)) {
        return;
    }
    values.set(id, stored);
    applyTuneCss();
    persist();
    emit();
};

export const resetTune = (id?: string): void => {
    const targets = id ? [fieldOf(id)] : TUNE_FIELDS;
    let moved = false;
    targets.forEach((field) => {
        if (!isTuneDefault(field.id)) {
            values.set(field.id, field.default);
            moved = true;
        }
    });
    if (!moved && id) {
        return;
    }
    applyTuneCss();
    persist();
    emit();
};

export const onTune = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const loadTune = (): void => {
    if (typeof localStorage === "undefined") {
        return;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return;
    }
    try {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        Object.entries(saved).forEach(([id, value]) => {
            if (!fieldById.has(id)) {
                return;
            }
            if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
                const field = fieldOf(id);
                if (field.kind === "number" && typeof value === "number") {
                    values.set(id, clampNumber(field, value));
                } else if (field.kind === "color" && typeof value === "string" && hexChannels(value)) {
                    values.set(id, value.toLowerCase());
                } else if (field.kind === "toggle") {
                    values.set(id, value === true);
                }
            }
        });
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
};

export interface TuneChange {
    id: string;
    label: string;
    group: string;
    was: number | string | boolean;
    now: number | string | boolean;
}

export const tuneChanges = (): TuneChange[] => (
    TUNE_FIELDS.filter((field) => !isTuneDefault(field.id)).map((field) => ({
        id: field.id,
        label: field.label,
        group: field.group,
        was: field.default,
        now: tuneValue(field.id)
    }))
);

export const exportTuneText = (): string => {
    const changes = tuneChanges();
    const payload = {
        note: "Temporary visual debug export. Send this back to bake the values into the site.",
        changed: Object.fromEntries(changes.map((change) => [change.id, { was: change.was, now: change.now, label: change.label }]))
    };
    const lines = changes.length
        ? changes.map((change) => `${change.id}: ${String(change.was)} -> ${String(change.now)} (${change.label})`)
        : ["No values were changed."];
    return ["Visual debug export", ...lines, "", JSON.stringify(payload, null, 2)].join("\n");
};
