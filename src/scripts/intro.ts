// @ts-nocheck
// Mechanical port of the previous intro. The refraction and placement math live in typed modules.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { landingsAt } from "./optics";
import { shaderSources } from "./shaders";
import { headerOffset, lensFrame, nameClearance, scrollHeight } from "./stage";

interface GlyphItem {
    nx: number;
    ny: number;
    glyph: string;
    glyphIndex: number;
    sizeIndex: number;
    amber: boolean;
    size: number;
    alpha: number;
}

interface LensScene {
    lensX: number;
    lensY: number;
    radius: number;
    light: { x: number; y: number; z: number };
    nameTop: number;
    nameBottom: number;
    nameRight: number;
    viewHeight: number;
}

export function startIntro(reducedMotion: boolean): void {
    const pinEl = document.getElementById("canopy-pin");
    const rigEl = document.getElementById("lens-rig");
    const canvasEl = document.getElementById("canopy-field");
    const nameEl = document.getElementById("canopy-name");
    const glEl = document.getElementById("lens-gl");
    const scrollEl = document.querySelector(".canopy-scroll");
    if (!(pinEl instanceof HTMLElement) || !(rigEl instanceof HTMLElement) || !(canvasEl instanceof HTMLCanvasElement) || !(nameEl instanceof HTMLElement) || !(glEl instanceof HTMLCanvasElement) || !(scrollEl instanceof HTMLElement)) {
        return;
    }
    const pin = pinEl;
    const rig = rigEl;
    const canvas = canvasEl;
    const canopyName = nameEl;
    const glCanvas = glEl;
    const scrollScene = scrollEl;

    const glyphSet = ["{", "}", "(", ")", ";", "->", "=>", "0x", "[", "]", "fn", "#", "&", "*", "/", "="];
    const ctx = canvas.getContext("2d");
    const mouse = { x: -9999, y: -9999, on: false, vx: 0, vy: 0 };
    const beamGain = 2.7;
    const GLYPH_SIZE_COUNT = 31;
    let glyphs: GlyphItem[] = [];
    let glyphAtlas: { sheet: HTMLCanvasElement; cell: number; dpr: number } | null = null;
    let scrollProgress = reducedMotion ? 1 : 0;
    let lensGL: { render: (scene: LensScene, moved: boolean) => void } | null = null;
    let lastOptics: number[] | null = null;

    const glyphSizeIndex = (size) => {
        const snapped = Number(size.toFixed(1));
        return Math.max(0, Math.min(GLYPH_SIZE_COUNT - 1, Math.round(snapped * 10) - 80));
    };

    const buildGlyphAtlas = (dpr) => {
        const safeDpr = Math.min(dpr || 1, 2);
        if (glyphAtlas && glyphAtlas.dpr === safeDpr) {
            return;
        }
        const probe = document.createElement("canvas").getContext("2d");
        if (!probe) {
            glyphAtlas = null;
            return;
        }
        probe.font = "11.0px ui-monospace, SFMono-Regular, Menlo, monospace";
        let ink = 16;
        glyphSet.forEach((glyph) => {
            const metrics = probe.measureText(glyph);
            const width = metrics.width || 16;
            const height = (metrics.actualBoundingBoxAscent || 11) + (metrics.actualBoundingBoxDescent || 4);
            ink = Math.max(ink, width, height);
        });
        const cell = Math.ceil(ink + 8);
        const cols = glyphSet.length * 2;
        const rows = GLYPH_SIZE_COUNT;
        const sheet = document.createElement("canvas");
        sheet.width = Math.ceil(cols * cell * safeDpr);
        sheet.height = Math.ceil(rows * cell * safeDpr);
        const actx = sheet.getContext("2d");
        if (!actx || sheet.width > 4096 || sheet.height > 4096 || sheet.width < 2 || sheet.height < 2) {
            glyphAtlas = null;
            return;
        }
        actx.setTransform(safeDpr, 0, 0, safeDpr, 0, 0);
        actx.clearRect(0, 0, cols * cell, rows * cell);
        actx.textAlign = "center";
        actx.textBaseline = "middle";
        const colors = ["#E7E1D6", "#E8A04A"];
        for (let colorIndex = 0; colorIndex < colors.length; colorIndex += 1) {
            actx.fillStyle = colors[colorIndex];
            for (let sizeIndex = 0; sizeIndex < GLYPH_SIZE_COUNT; sizeIndex += 1) {
                const label = (8 + sizeIndex * 0.1).toFixed(1);
                actx.font = label + "px ui-monospace, SFMono-Regular, Menlo, monospace";
                const rowTop = sizeIndex * cell;
                for (let glyphIndex = 0; glyphIndex < glyphSet.length; glyphIndex += 1) {
                    const colLeft = (colorIndex * glyphSet.length + glyphIndex) * cell;
                    actx.fillText(glyphSet[glyphIndex], colLeft + cell / 2, rowTop + cell / 2);
                }
            }
        }
        glyphAtlas = { sheet, cell, dpr: safeDpr };
    };

    const opticsShifted = (sample) => {
        if (!lastOptics) {
            lastOptics = sample.slice();
            return true;
        }
        for (let index = 0; index < sample.length; index += 1) {
            if (Math.abs(sample[index] - lastOptics[index]) > 0.25) {
                lastOptics = sample.slice();
                return true;
            }
        }
        return false;
    };

    const random = (seed) => {
        let state = seed >>> 0;
        return () => {
            state = (state + 0x6D2B79F5) >>> 0;
            let value = Math.imul(state ^ (state >>> 15), state | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    };

    const buildGlyphs = () => {
        const next = random(20261006);
        const phone = window.matchMedia("(max-width: 720px)").matches;
        const width = Math.max(pin.clientWidth || window.innerWidth || 800, 320);
        const height = Math.max(pin.clientHeight || window.innerHeight || 800, 320);
        const marginX = 170 / width;
        const marginY = 170 / height;
        const count = phone ? 1200 : 3000;
        glyphs = [];
        for (let i = 0; i < count; i += 1) {
            const size = 8 + next() * 3;
            glyphs.push({
                nx: -marginX + next() * (1 + marginX * 2),
                ny: -marginY + next() * (1 + marginY * 2),
                glyph: glyphSet[i % glyphSet.length],
                glyphIndex: i % glyphSet.length,
                sizeIndex: glyphSizeIndex(size),
                amber: i % 5 === 0,
                size,
                alpha: 0.45 + next() * 0.4
            });
        }
    };

    const fitCanvas = () => {
        if (!ctx) {
            return { w: 0, h: 0 };
        }
        const width = pin.clientWidth;
        const height = pin.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.imageSmoothingEnabled = true;
        if ("imageSmoothingQuality" in ctx) {
            ctx.imageSmoothingQuality = "high";
        }
        buildGlyphAtlas(dpr);
        return { w: width, h: height };
    };

    let stagedHeight = 0;

    const stageSize = () => {
        const height = Math.max(320, window.innerHeight || pin.clientHeight || 800);
        const width = Math.max(280, Math.min(pin.clientWidth || window.innerWidth || 800, window.innerWidth || 800));
        const nextScroll = scrollHeight(height, reducedMotion);
        if (height !== stagedHeight) {
            stagedHeight = height;
            pin.style.height = height + "px";
            scrollScene.style.height = nextScroll + "px";
            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
        }
        return { width, height };
    };

    const placeLens = (progress) => {
        const { width, height } = stageSize();
        const pinRect = pin.getBoundingClientRect();
        const nameRect = canopyName.getBoundingClientRect();
        const nameRight = nameClearance(width, nameRect.right - pinRect.left, nameRect.width);
        const frame = lensFrame({
            width,
            height,
            nameRight,
            progress,
            reducedMotion,
            header: headerOffset()
        });
        const nextWidth = frame.diameter + "px";
        if (rig.style.width !== nextWidth) {
            rig.style.width = nextWidth;
        }
        const nextLeft = frame.x + "px";
        const nextTop = frame.y + "px";
        if (rig.style.left !== nextLeft) {
            rig.style.left = nextLeft;
        }
        if (rig.style.top !== nextTop) {
            rig.style.top = nextTop;
        }
    };

    const WATER_COLS = 48;
    const WATER_ROWS = 30;
    let water: { width: number; height: number; ox: Float32Array; oy: Float32Array; vx: Float32Array; vy: Float32Array; nvx: Float32Array; nvy: Float32Array } | null = null;

    const ensureWater = (width, height) => {
        if (water && water.width === width && water.height === height) {
            return;
        }
        const count = WATER_COLS * WATER_ROWS;
        water = {
            width,
            height,
            ox: new Float32Array(count),
            oy: new Float32Array(count),
            vx: new Float32Array(count),
            vy: new Float32Array(count),
            nvx: new Float32Array(count),
            nvy: new Float32Array(count)
        };
    };

    const swellAt = (x, y, time) => {
        const along = x * 0.011 + time * 1.85;
        const across = y * 0.0095 - time * 1.55;
        const cross = x * 0.0062 + y * 0.0071 + time * 1.25;
        const ripple = x * 0.021 - y * 0.018 + time * 2.6;
        return {
            x: Math.cos(along) * 3.2 + Math.sin(cross) * 1.8 + Math.sin(ripple) * 1.1,
            y: Math.sin(across) * 2.8 + Math.cos(cross) * 1.6 + Math.cos(ripple) * 0.9
        };
    };

    const sampleWater = (x, y, width, height) => {
        const gx = Math.max(0, Math.min(WATER_COLS - 1.001, (x / Math.max(width, 1)) * (WATER_COLS - 1)));
        const gy = Math.max(0, Math.min(WATER_ROWS - 1.001, (y / Math.max(height, 1)) * (WATER_ROWS - 1)));
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const tx = gx - x0;
        const ty = gy - y0;
        const i = y0 * WATER_COLS + x0;
        const { ox, oy } = water!;
        return {
            x: ox[i] * (1 - tx) * (1 - ty) + ox[i + 1] * tx * (1 - ty) + ox[i + WATER_COLS] * (1 - tx) * ty + ox[i + WATER_COLS + 1] * tx * ty,
            y: oy[i] * (1 - tx) * (1 - ty) + oy[i + 1] * tx * (1 - ty) + oy[i + WATER_COLS] * (1 - tx) * ty + oy[i + WATER_COLS + 1] * tx * ty
        };
    };

    const stepWater = (width, height, pointerX, pointerY) => {
        ensureWater(width, height);
        const { ox, oy, vx, vy, nvx, nvy } = water!;
        const sigma = Math.max(58, Math.min(92, width * 0.062));
        const sigma2 = sigma * sigma * 2;
        const reach2 = (sigma * 2.15) * (sigma * 2.15);
        const handX = mouse.vx;
        const handY = mouse.vy;
        const moving = Math.min(Math.hypot(handX, handY), 16);
        if (mouse.on || handX || handY) {
            for (let row = 0; row < WATER_ROWS; row += 1) {
                const py = (row / (WATER_ROWS - 1)) * height;
                const dy = py - pointerY;
                if (dy * dy > reach2) {
                    continue;
                }
                for (let col = 0; col < WATER_COLS; col += 1) {
                    const px = (col / (WATER_COLS - 1)) * width;
                    const dx = px - pointerX;
                    const dist2 = dx * dx + dy * dy;
                    if (dist2 > reach2) {
                        continue;
                    }
                    const fall = Math.exp(-dist2 / sigma2);
                    const index = row * WATER_COLS + col;
                    vx[index] += handX * fall * 0.85;
                    vy[index] += handY * fall * 0.85;
                    if (mouse.on) {
                        const dist = Math.sqrt(dist2) || 1;
                        const shove = fall * (0.22 + moving * 0.03);
                        vx[index] += (dx / dist) * shove;
                        vy[index] += (dy / dist) * shove;
                    }
                }
            }
        }
        mouse.vx = 0;
        mouse.vy = 0;

        for (let index = 0; index < vx.length; index += 1) {
            vx[index] *= 0.55;
            vy[index] *= 0.55;
            ox[index] += vx[index];
            oy[index] += vy[index];
        }

        for (let row = 0; row < WATER_ROWS; row += 1) {
            for (let col = 0; col < WATER_COLS; col += 1) {
                const index = row * WATER_COLS + col;
                let sx = ox[index] * 0.64;
                let sy = oy[index] * 0.64;
                const bleed = 0.09;
                const share = (source) => {
                    sx += ox[source] * bleed;
                    sy += oy[source] * bleed;
                };
                share(col > 0 ? index - 1 : index);
                share(col < WATER_COLS - 1 ? index + 1 : index);
                share(row > 0 ? index - WATER_COLS : index);
                share(row < WATER_ROWS - 1 ? index + WATER_COLS : index);
                nvx[index] = sx;
                nvy[index] = sy;
            }
        }

        for (let index = 0; index < ox.length; index += 1) {
            ox[index] = nvx[index] * 0.82;
            oy[index] = nvy[index] * 0.82;
        }
    };

    const paintScene = () => {
        placeLens(scrollProgress);
        const pinRect = pin.getBoundingClientRect();
        const nameRect = canopyName.getBoundingClientRect();
        const rigRect = rig.getBoundingClientRect();
        const lensX = rigRect.left + rigRect.width / 2 - pinRect.left;
        const lensY = rigRect.top + rigRect.height / 2 - pinRect.top;
        const radius = rigRect.width / 2;
        const nameRight = nameRect.right - pinRect.left;
        const nameTop = nameRect.top - pinRect.top;
        const nameBottom = nameRect.bottom - pinRect.top;
        const nameMid = (nameTop + nameBottom) * 0.5;
        const light = {
            x: lensX + radius * 2.45,
            y: nameMid,
            z: radius * 0.48
        };
        const opticsMoved = opticsShifted([
            lensX, lensY, radius, light.x, light.y, light.z,
            nameTop, nameBottom, nameRight, pin.clientWidth, pin.clientHeight
        ]);
        if (opticsMoved) {
            const landings = landingsAt(lensX, lensY, radius, light, pin.clientHeight, nameRight);
            const nameHeight = Math.max(1, nameBottom - nameTop);
            if (landings.length) {
                const sorted = landings.slice().sort((a, b) => a - b);
                const mid = sorted[Math.floor(sorted.length * 0.5)];
                const lowBand = sorted[Math.floor(sorted.length * 0.2)];
                const highBand = sorted[Math.floor(sorted.length * 0.8)];
                const spread = Math.max(8, highBand - lowBand);
                const clamped = Math.min(nameBottom, Math.max(nameTop, mid));
                const causticY = ((clamped - nameTop) / nameHeight) * 100;
                const band = Math.max(8, Math.min(78, (spread / nameHeight) * 100));
                const dist = mid < nameTop ? nameTop - mid : mid > nameBottom ? mid - nameBottom : 0;
                const reachWidth = spread * 0.65 + 28;
                const reach = Math.exp(-(dist * dist) / (2 * reachWidth * reachWidth));
                const tight = 1 - Math.min(1, spread / (nameHeight * 1.35));
                const strength = Math.min(1, 0.04 + reach * (0.28 + 0.72 * tight));
                canopyName.style.setProperty("--caustic-y", causticY.toFixed(1) + "%");
                canopyName.style.setProperty("--caustic-band", band.toFixed(1) + "%");
                canopyName.style.setProperty("--beam", strength.toFixed(3));
                const fillLines = canopyName.querySelectorAll(".name-fill .name-line");
                const beamLines = canopyName.querySelectorAll(".name-beam .name-line");
                const sigma = Math.max(spread * 1.15, nameHeight * 0.42);
                beamLines.forEach((line, index) => {
                    const box = fillLines[index].getBoundingClientRect();
                    const center = (box.top + box.bottom) / 2 - pinRect.top;
                    const fall = Math.exp(-((center - mid) * (center - mid)) / (2 * sigma * sigma));
                    const glow = Math.min(1, fall * (0.2 + 0.8 * reach));
                    line.style.setProperty("--glow", glow.toFixed(3));
                });
            } else {
                canopyName.style.setProperty("--beam", "0.040");
                canopyName.querySelectorAll(".name-beam .name-line").forEach((line) => {
                    line.style.setProperty("--glow", "0");
                });
            }
        }

        if (ctx && pin.clientWidth > 2 && pin.clientHeight > 2) {
            const width = pin.clientWidth;
            const height = pin.clientHeight;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
                fitCanvas();
            }
            const localX = mouse.x - pinRect.left;
            const localY = mouse.y - pinRect.top;
            const time = reducedMotion ? 0 : performance.now() * 0.001;
            if (!reducedMotion) {
                stepWater(width, height, localX, localY);
            }

            if (!glyphAtlas || glyphAtlas.dpr !== dpr) {
                buildGlyphAtlas(dpr);
            }
            const atlas = glyphAtlas;

            ctx.clearRect(0, 0, width, height);
            for (const item of glyphs) {
                const homeX = item.nx * width;
                const homeY = item.ny * height;
                let x = homeX;
                let y = homeY;
                const alpha = item.amber ? Math.min(1, item.alpha + 0.12) : item.alpha;

                if (reducedMotion) {
                    if (mouse.on) {
                        const dx = x - localX;
                        const dy = y - localY;
                        const distance = Math.hypot(dx, dy) || 0.001;
                        if (distance < 168) {
                            const force = (168 - distance) / 168;
                            x += (dx / distance) * force * 36;
                            y += (dy / distance) * force * 36;
                        }
                    }
                } else {
                    const drift = swellAt(homeX, homeY, time);
                    const carried = sampleWater(homeX, homeY, width, height);
                    x += drift.x + carried.x;
                    y += drift.y + carried.y;
                }

                if (x < -24 || y < -24 || x > width + 24 || y > height + 24) {
                    continue;
                }

                ctx.globalAlpha = alpha;
                if (atlas) {
                    const src = atlas.cell * atlas.dpr;
                    const col = (item.amber ? glyphSet.length : 0) + item.glyphIndex;
                    const row = item.sizeIndex;
                    ctx.drawImage(
                        atlas.sheet,
                        col * src,
                        row * src,
                        src,
                        src,
                        x - atlas.cell / 2,
                        y - atlas.cell / 2,
                        atlas.cell,
                        atlas.cell
                    );
                } else {
                    ctx.fillStyle = item.amber ? "#E8A04A" : "#E7E1D6";
                    ctx.font = item.size.toFixed(1) + "px ui-monospace, SFMono-Regular, Menlo, monospace";
                    ctx.fillText(item.glyph, x, y);
                }
            }
            ctx.globalAlpha = 1;
        }
        if (lensGL) {
            try {
            lensGL.render({
                lensX,
                lensY,
                radius,
                light,
                nameTop,
                nameBottom,
                nameRight,
                viewHeight: pin.clientHeight
            }, opticsMoved);
            } catch (error) {
                glCanvas.dataset.lensError = error instanceof Error ? error.message : String(error);
                lensGL = null;
            }
        }
    };

    const createLensGL = () => {
        const gl = glCanvas.getContext("webgl2", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            stencil: false
        });
        if (!gl) {
            throw new Error("WebGL2 is not available");
        }

        const { vertexSource, beamSource, blurSource, glassSource, compositeSource } = shaderSources();

        const compile = (type: number, source: string, label: string) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                const log = gl.getShaderInfoLog(shader) || label;
                gl.deleteShader(shader);
                throw new Error(label + ": " + log);
            }
            return shader;
        };

        const link = (source: string, label: string) => {
            const program = gl.createProgram();
            const vertex = compile(gl.VERTEX_SHADER, vertexSource, label + " vertex");
            const fragment = compile(gl.FRAGMENT_SHADER, source, label);
            gl.attachShader(program, vertex);
            gl.attachShader(program, fragment);
            gl.linkProgram(program);
            gl.deleteShader(vertex);
            gl.deleteShader(fragment);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                const log = gl.getProgramInfoLog(program) || label;
                gl.deleteProgram(program);
                throw new Error(label + " link: " + log);
            }
            return program;
        };

        const locations = (program: WebGLProgram, names: string[]) => {
            const found: Record<string, WebGLUniformLocation | null> = {};
            names.forEach((name) => {
                found[name] = gl.getUniformLocation(program, name);
            });
            return found;
        };

        const beamProgram = link(beamSource, "beam");
        const blurProgram = link(blurSource, "blur");
        const glassProgram = link(glassSource, "glass");
        const beamLoc = locations(beamProgram, [
            "uBuffer", "uCssScale", "uViewHeight", "uLens", "uRadius", "uLight", "uNameSpan", "uNameRight", "uGain"
        ]);
        const blurLoc = locations(blurProgram, ["uTex", "uDirection"]);
        const glassLoc = locations(glassProgram, [
            "uBuffer", "uCssScale", "uViewHeight", "uLens", "uRadius", "uLight", "uBeam", "uGlyphs"
        ]);
        let compositeProgram = null;
        let compositeLoc = null;
        try {
            compositeProgram = link(compositeSource, "composite");
            compositeLoc = locations(compositeProgram, ["uBeam", "uBuffer"]);
        } catch {
            compositeProgram = null;
            compositeLoc = null;
        }

        const glyphTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glyphTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const makeTarget = (width: number, height: number) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            const fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            if (status !== gl.FRAMEBUFFER_COMPLETE) {
                throw new Error("framebuffer " + status);
            }
            return { tex, fb, width, height };
        };

        let beamTarget = null;
        let blurTarget = null;
        let fullW = 0;
        let fullH = 0;
        let checked = false;
        let beamValid = false;

        const dropTarget = (target) => {
            if (!target) {
                return;
            }
            gl.deleteFramebuffer(target.fb);
            gl.deleteTexture(target.tex);
        };

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
            const viewW = Math.min(pin.clientWidth, window.innerWidth || pin.clientWidth);
            const viewH = Math.min(pin.clientHeight, window.innerHeight || pin.clientHeight);
            const nextW = Math.max(2, Math.round(viewW * dpr));
            const nextH = Math.max(2, Math.round(viewH * dpr));
            if (glCanvas.width !== nextW || glCanvas.height !== nextH) {
                glCanvas.width = nextW;
                glCanvas.height = nextH;
            }
            const bw = gl.drawingBufferWidth;
            const bh = gl.drawingBufferHeight;
            const hw = Math.max(2, Math.floor(bw / 2));
            const hh = Math.max(2, Math.floor(bh / 2));
            if (beamTarget && beamTarget.width === hw && beamTarget.height === hh && fullW === bw && fullH === bh) {
                return { bw, bh, hw, hh, rebuilt: false };
            }
            dropTarget(beamTarget);
            dropTarget(blurTarget);
            beamTarget = makeTarget(hw, hh);
            blurTarget = makeTarget(hw, hh);
            fullW = bw;
            fullH = bh;
            beamValid = false;
            return { bw, bh, hw, hh, rebuilt: true };
        };

        const setOptics = (loc: Record<string, WebGLUniformLocation | null>, scene: LensScene, bufferW: number, bufferH: number, scaleX: number, scaleY: number) => {
            gl.uniform2f(loc.uBuffer, bufferW, bufferH);
            gl.uniform2f(loc.uCssScale, scaleX, scaleY);
            gl.uniform1f(loc.uViewHeight, scene.viewHeight);
            gl.uniform2f(loc.uLens, scene.lensX, scene.lensY);
            gl.uniform1f(loc.uRadius, scene.radius);
            gl.uniform3f(loc.uLight, scene.light.x, scene.light.y, scene.light.z);
        };

        const fullQuad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

        const drawQuad = () => {
            gl.bindBuffer(gl.ARRAY_BUFFER, quad);
            gl.bufferData(gl.ARRAY_BUFFER, fullQuad, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };

        const drawCssRect = (x0: number, y0: number, x1: number, y1: number) => {
            const viewW = Math.max(1, pin.clientWidth);
            const viewH = Math.max(1, pin.clientHeight);
            if (!(x1 > x0) || !(y1 > y0)) {
                return;
            }
            const left = (x0 / viewW) * 2 - 1;
            const right = (x1 / viewW) * 2 - 1;
            const top = 1 - (y0 / viewH) * 2;
            const bottom = 1 - (y1 / viewH) * 2;
            gl.bindBuffer(gl.ARRAY_BUFFER, quad);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                left, bottom,
                right, bottom,
                left, top,
                right, top
            ]), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };

        const uploadGlyphs = () => {
            if (canvas.width > 2 && canvas.height > 2) {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, glyphTex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            }
        };

        return {
            render(scene: LensScene, opticsMoved: boolean) {
                if (scene.radius < 2 || pin.clientWidth < 2) {
                    return;
                }
                const size = resize();
                if (size.bw < 2 || size.bh < 2) {
                    return;
                }
                gl.disable(gl.BLEND);
                gl.disable(gl.DEPTH_TEST);
                gl.clearColor(0, 0, 0, 0);

                const nameMid = (scene.nameTop + scene.nameBottom) * 0.5;
                const band = Math.abs(scene.lensY - nameMid) + scene.radius * 3.2;
                const litY0 = Math.min(scene.lensY, nameMid) - band;
                const litY1 = Math.max(scene.lensY, nameMid) + band;
                const spreadX = 14 * (pin.clientWidth / size.hw);
                const spreadY = 14 * (pin.clientHeight / size.hh);
                const refreshBeam = opticsMoved !== false || size.rebuilt || !beamValid;

                if (refreshBeam) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, beamTarget.fb);
                    gl.viewport(0, 0, size.hw, size.hh);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.useProgram(beamProgram);
                    setOptics(beamLoc, scene, size.hw, size.hh, pin.clientWidth / size.hw, pin.clientHeight / size.hh);
                    gl.uniform2f(beamLoc.uNameSpan, scene.nameTop, scene.nameBottom);
                    gl.uniform1f(beamLoc.uNameRight, scene.nameRight);
                    gl.uniform1f(beamLoc.uGain, beamGain);
                    drawCssRect(-2, litY0 - 2, pin.clientWidth + 2, litY1 + 2);

                    gl.bindFramebuffer(gl.FRAMEBUFFER, blurTarget.fb);
                    gl.viewport(0, 0, size.hw, size.hh);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.useProgram(blurProgram);
                    gl.uniform1i(blurLoc.uTex, 0);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, beamTarget.tex);
                    gl.uniform2f(blurLoc.uDirection, 1 / size.hw, 0);
                    drawQuad();

                    gl.bindFramebuffer(gl.FRAMEBUFFER, beamTarget.fb);
                    gl.viewport(0, 0, size.hw, size.hh);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.bindTexture(gl.TEXTURE_2D, blurTarget.tex);
                    gl.uniform2f(blurLoc.uDirection, 0, 1 / size.hh);
                    drawQuad();
                    beamValid = true;
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, size.bw, size.bh);
                gl.colorMask(true, true, true, true);
                gl.clear(gl.COLOR_BUFFER_BIT);
                uploadGlyphs();

                if (compositeProgram) {
                    gl.useProgram(compositeProgram);
                    gl.uniform2f(compositeLoc.uBuffer, size.bw, size.bh);
                    gl.uniform1i(compositeLoc.uBeam, 1);
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, beamTarget.tex);
                    drawCssRect(-spreadX, litY0 - spreadY, pin.clientWidth + spreadX, litY1 + spreadY);

                    const lensPad = scene.radius + 4;
                    gl.useProgram(glassProgram);
                    setOptics(glassLoc, scene, size.bw, size.bh, pin.clientWidth / size.bw, pin.clientHeight / size.bh);
                    gl.uniform1i(glassLoc.uBeam, 1);
                    gl.uniform1i(glassLoc.uGlyphs, 2);
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, beamTarget.tex);
                    drawCssRect(scene.lensX - lensPad, scene.lensY - lensPad, scene.lensX + lensPad, scene.lensY + lensPad);
                } else {
                    gl.useProgram(glassProgram);
                    setOptics(glassLoc, scene, size.bw, size.bh, pin.clientWidth / size.bw, pin.clientHeight / size.bh);
                    gl.uniform1i(glassLoc.uBeam, 1);
                    gl.uniform1i(glassLoc.uGlyphs, 2);
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, beamTarget.tex);
                    drawQuad();
                }

                if (!checked) {
                    checked = true;
                    const error = gl.getError();
                    if (error) {
                        glCanvas.dataset.lensError = String(error);
                    }
                }
            }
        };
    };

    const heroInView = () => {
        const rect = scrollScene.getBoundingClientRect();
        const viewH = window.innerHeight || document.documentElement.clientHeight || 0;
        return rect.bottom > 0 && rect.top < viewH;
    };

    let heroVisible = heroInView();
    let loopScheduled = false;

    const frame = () => {
        loopScheduled = false;
        const ready = pin.clientWidth > 2 && pin.clientHeight > 2;
        const canRun = heroVisible && !document.hidden;
        if (canRun && ready) {
            paintScene();
        }
        if (reducedMotion) {
            if (canRun && !ready) {
                loopScheduled = true;
                requestAnimationFrame(frame);
            }
            return;
        }
        if (canRun) {
            loopScheduled = true;
            requestAnimationFrame(frame);
        }
    };

    const schedule = () => {
        if (loopScheduled || document.hidden || !heroVisible) {
            return;
        }
        loopScheduled = true;
        requestAnimationFrame(frame);
    };

    if ("IntersectionObserver" in window) {
        const heroObserver = new IntersectionObserver((entries) => {
            heroVisible = entries.some((entry) => entry.isIntersecting);
            if (heroVisible) {
                schedule();
            }
        });
        heroObserver.observe(scrollScene);
    }

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            schedule();
        }
    });

    pin.addEventListener("pointermove", (event) => {
        if (mouse.on) {
            mouse.vx += event.clientX - mouse.x;
            mouse.vy += event.clientY - mouse.y;
        }
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.on = true;
        if (reducedMotion) {
            paintScene();
        }
    });

    pin.addEventListener("pointerleave", () => {
        mouse.on = false;
        if (reducedMotion) {
            paintScene();
        }
    });

    if (!reducedMotion && gsap && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        window.ScrollTrigger = ScrollTrigger;
        ScrollTrigger.create({
            trigger: scrollScene,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                scrollProgress = self.progress;
            }
        });
    } else if (!reducedMotion) {
        const readProgress = () => {
            const rect = scrollScene.getBoundingClientRect();
            const travel = scrollScene.offsetHeight - window.innerHeight;
            scrollProgress = travel <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / travel));
        };
        readProgress();
        window.addEventListener("scroll", readProgress, { passive: true });
    }

    window.addEventListener("resize", () => {
        buildGlyphs();
        fitCanvas();
        lastOptics = null;
        if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
        }
        heroVisible = heroInView();
        if (heroVisible && !document.hidden) {
            paintScene();
            schedule();
        }
    });

    try {
        lensGL = createLensGL();
        pin.classList.add("is-shader");
    } catch (error) {
        glCanvas.dataset.lensError = error instanceof Error ? error.message : String(error);
        console.error(error);
    }

    if (document.fonts) {
        document.fonts.ready.then(() => {
            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
            lastOptics = null;
            if (heroVisible && !document.hidden) {
                paintScene();
            }
        });
    }

    buildGlyphs();
    fitCanvas();
    schedule();
}
