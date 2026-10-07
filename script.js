const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const yearTarget = document.querySelector("[data-year]");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(".reveal");
const interactiveCards = document.querySelectorAll(".project-card, .portrait-card");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
}

if (header) {
    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
}

if (navToggle && navMenu) {
    const setNavLabel = (isOpen) => {
        const label = navToggle.querySelector(".sr-only");
        if (label && window.siteI18n) {
            label.textContent = window.siteI18n.t(isOpen ? "nav.close" : "nav.open");
        }
    };

    navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        setNavLabel(isOpen);
    });

    navMenu.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            navMenu.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
            setNavLabel(false);
        }
    });
}

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealItems.forEach((item) => revealObserver.observe(item));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            navLinks.forEach((link) => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: "-35% 0px -55% 0px" });

    sections.forEach((section) => sectionObserver.observe(section));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (!reducedMotion) {
    interactiveCards.forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            const tiltX = ((xPercent - 50) / 50) * 4;
            const tiltY = -((yPercent - 50) / 50) * 4;

            card.style.setProperty("--spot-x", `${xPercent}%`);
            card.style.setProperty("--spot-y", `${yPercent}%`);
            card.style.setProperty("--tilt-x", `${tiltX}deg`);
            card.style.setProperty("--tilt-y", `${tiltY}deg`);
        });

        card.addEventListener("pointerleave", () => {
            card.style.removeProperty("--tilt-x");
            card.style.removeProperty("--tilt-y");
        });
    });
}

const pin = document.getElementById("canopy-pin");
const rig = document.getElementById("lens-rig");
const canvas = document.getElementById("canopy-field");
const canopyName = document.getElementById("canopy-name");
const glCanvas = document.getElementById("lens-gl");
const scrollScene = document.querySelector(".canopy-scroll");

if (pin && rig && canvas && canopyName && glCanvas && scrollScene) {
    const glyphSet = ["{", "}", "(", ")", ";", "->", "=>", "0x", "[", "]", "fn", "#", "&", "*", "/", "="];
    const ctx = canvas.getContext("2d");
    const mouse = { x: -9999, y: -9999, on: false, vx: 0, vy: 0 };
    const beamGain = 2.7;
    const GLYPH_SIZE_COUNT = 31;
    let glyphs = [];
    let glyphAtlas = null;
    let scrollProgress = reducedMotion ? 1 : 0;
    let lensGL = null;
    let lastOptics = null;

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

    const headerOffset = () => (window.matchMedia("(max-width: 720px)").matches ? 66 : 76);

    const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
    const norm3 = (a) => mul3(a, 1 / (len3(a) || 1));
    const cross3 = (a, b) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];

    const refract3 = (incident, normal, eta) => {
        const cosi = dot3(normal, incident);
        const k = 1 - eta * eta * (1 - cosi * cosi);
        if (k < 0) {
            return null;
        }
        return sub3(mul3(incident, eta), mul3(normal, eta * cosi + Math.sqrt(k)));
    };

    const reflect3 = (incident, normal) => sub3(incident, mul3(normal, 2 * dot3(normal, incident)));

    const sphereHits = (origin, dir, center, radius) => {
        const oc = sub3(origin, center);
        const b = dot3(oc, dir);
        const c = dot3(oc, oc) - radius * radius;
        const h = b * b - c;
        if (h < 0) {
            return null;
        }
        const s = Math.sqrt(h);
        return [-b - s, -b + s];
    };

    const transmit = (origin, dir, center, radius) => {
        const span = sphereHits(origin, dir, center, radius);
        if (!span || span[0] < 0.001) {
            return null;
        }
        const entry = add3(origin, mul3(dir, span[0]));
        const normalIn = norm3(sub3(entry, center));
        let into = refract3(dir, normalIn, 1 / 1.52);
        if (!into) {
            return null;
        }
        into = norm3(into);
        const spanB = sphereHits(add3(entry, into), into, center, radius);
        if (!spanB) {
            return null;
        }
        const tBack = Math.max(spanB[0], spanB[1]);
        if (tBack < 0.01) {
            return null;
        }
        let exitPoint = add3(entry, mul3(into, tBack));
        const normalOut = norm3(sub3(center, exitPoint));
        let outgoing = refract3(into, normalOut, 1.52);
        if (!outgoing) {
            const bounced = norm3(reflect3(into, normalOut));
            const spanC = sphereHits(add3(exitPoint, bounced), bounced, center, radius);
            if (!spanC) {
                return null;
            }
            const tExit = Math.max(spanC[0], spanC[1]);
            if (tExit < 0.01) {
                return null;
            }
            const third = add3(exitPoint, mul3(bounced, tExit));
            const normalThird = norm3(sub3(center, third));
            outgoing = refract3(bounced, normalThird, 1.52);
            if (!outgoing) {
                return null;
            }
            exitPoint = third;
        }
        return { entry, exitPoint, outgoing: norm3(outgoing) };
    };

    const landingsAt = (lensX, lensY, radius, light, viewHeight, nameX) => {
        const center = [lensX, viewHeight - lensY, 0];
        const lamp = [light.x, viewHeight - light.y, light.z];
        const axis = norm3(sub3(center, lamp));
        const helper = Math.abs(axis[1]) < 0.85 ? [0, 1, 0] : [1, 0, 0];
        const tx = norm3(cross3(helper, axis));
        const ty = cross3(axis, tx);
        const count = 32;
        const ys = [];
        for (let i = 0; i < count; i += 1) {
            const fi = i + 0.5;
            const ang = fi * 2.39996323;
            const rad = Math.sqrt(fi / count) * radius * 0.36;
            const sample = add3(center, add3(mul3(tx, Math.cos(ang) * rad), mul3(ty, Math.sin(ang) * rad)));
            const target = add3(center, mul3(axis, radius * 0.72));
            const dir = norm3(sub3(target, sample));
            const origin = sub3(sample, mul3(dir, radius * 5));
            const hit = transmit(origin, dir, center, radius);
            if (!hit || hit.outgoing[0] > -0.02) {
                continue;
            }
            const steer = 0.60;
            const axis2raw = [axis[0], -axis[1]];
            const axis2len = Math.hypot(axis2raw[0], axis2raw[1]) || 1;
            const axis2 = [axis2raw[0] / axis2len, axis2raw[1] / axis2len];
            const a = [hit.entry[0], viewHeight - hit.entry[1]];
            const b = [hit.exitPoint[0], viewHeight - hit.exitPoint[1]];
            const ab = [b[0] - a[0], b[1] - a[1]];
            const relA = [a[0] - lensX, a[1] - lensY];
            const a11 = ab[0] * ab[0] + ab[1] * ab[1];
            const a12 = ab[0] * axis2[0] + ab[1] * axis2[1];
            const den = a11 - a12 * a12;
            const b1 = ab[0] * relA[0] + ab[1] * relA[1];
            const b2 = axis2[0] * relA[0] + axis2[1] * relA[1];
            const tFocus = Math.abs(den) < 1e-4 ? 0.5 : Math.max(0, Math.min(1, (a12 * b2 - b1) / den));
            const waist = [a[0] + ab[0] * tFocus, a[1] + ab[1] * tFocus];
            const leave = [b[0] - waist[0], b[1] - waist[1]];
            const leaveLen = Math.hypot(leave[0], leave[1]);
            const leaveDir = leaveLen > 1e-4 ? [leave[0] / leaveLen, leave[1] / leaveLen] : axis2;
            let tight = [
                leaveDir[0] * (1 - steer) + axis2[0] * steer,
                leaveDir[1] * (1 - steer) + axis2[1] * steer
            ];
            const tightLen = Math.hypot(tight[0], tight[1]) || 1;
            tight = [tight[0] / tightLen, tight[1] / tightLen];
            const relW = [waist[0] - lensX, waist[1] - lensY];
            const hitB = relW[0] * tight[0] + relW[1] * tight[1];
            const hitC = relW[0] * relW[0] + relW[1] * relW[1] - radius * radius;
            const hitD = hitB * hitB - hitC;
            const hitT = hitD > 0 ? Math.max(-hitB + Math.sqrt(hitD), 0) : leaveLen;
            const exit = [waist[0] + tight[0] * hitT, waist[1] + tight[1] * hitT];
            const travel = (nameX - exit[0]) / tight[0];
            if (!(travel > 0)) {
                continue;
            }
            ys.push(exit[1] + travel * tight[1]);
        }
        return ys;
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
        const diameter = Math.round(Math.min(height * 0.68, width * 0.56));
        const nextScroll = reducedMotion ? height : Math.round(height * 2.2);
        if (height !== stagedHeight) {
            stagedHeight = height;
            pin.style.height = height + "px";
            scrollScene.style.height = nextScroll + "px";
            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
        }
        return { width, height, diameter };
    };

    const placeLens = (progress) => {
        const { width, height, diameter: preferred } = stageSize();
        const pinRect = pin.getBoundingClientRect();
        const nameRect = canopyName.getBoundingClientRect();
        const nameRight = nameRect.width > 2 ? nameRect.right - pinRect.left : width * 0.36;
        const inset = width * 0.02;
        const gap = width * 0.045;
        const room = width - inset - nameRight - gap;
        const diameter = Math.round(Math.max(1, Math.min(preferred, room)));
        const radius = diameter / 2;
        const x = width - inset - radius;
        const nextWidth = diameter + "px";
        if (rig.style.width !== nextWidth) {
            rig.style.width = nextWidth;
        }
        const startY = height - radius / 2;
        const endY = reducedMotion ? headerOffset() + radius + 14 : 0;
        const y = startY + (endY - startY) * progress;
        const nextLeft = x + "px";
        const nextTop = y + "px";
        if (rig.style.left !== nextLeft) {
            rig.style.left = nextLeft;
        }
        if (rig.style.top !== nextTop) {
            rig.style.top = nextTop;
        }
    };

    const WATER_COLS = 48;
    const WATER_ROWS = 30;
    let water = null;

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
        const { ox, oy } = water;
        return {
            x: ox[i] * (1 - tx) * (1 - ty) + ox[i + 1] * tx * (1 - ty) + ox[i + WATER_COLS] * (1 - tx) * ty + ox[i + WATER_COLS + 1] * tx * ty,
            y: oy[i] * (1 - tx) * (1 - ty) + oy[i + 1] * tx * (1 - ty) + oy[i + WATER_COLS] * (1 - tx) * ty + oy[i + WATER_COLS + 1] * tx * ty
        };
    };

    const stepWater = (width, height, pointerX, pointerY) => {
        ensureWater(width, height);
        const { ox, oy, vx, vy, nvx, nvy } = water;
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
                glCanvas.dataset.lensError = error && error.message ? error.message : String(error);
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

        const optics = `
const float ETA_IN = 1.0 / 1.52;
const float ETA_OUT = 1.52;

vec2 sphereHits(vec3 origin, vec3 dir, vec3 center, float radius) {
    vec3 oc = origin - center;
    float b = dot(oc, dir);
    float c = dot(oc, oc) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) {
        return vec2(-1.0);
    }
    float s = sqrt(h);
    return vec2(-b - s, -b + s);
}

bool transmit(vec3 origin, vec3 dir, vec3 center, float radius, out vec3 entry, out vec3 exitPoint, out vec3 outgoing) {
    vec2 span = sphereHits(origin, dir, center, radius);
    if (span.x < 0.001) {
        return false;
    }
    entry = origin + dir * span.x;
    vec3 normalIn = normalize(entry - center);
    vec3 into = refract(dir, normalIn, ETA_IN);
    if (dot(into, into) < 1.0e-8) {
        return false;
    }
    into = normalize(into);
    vec2 spanB = sphereHits(entry + into, into, center, radius);
    float tBack = max(spanB.x, spanB.y);
    if (tBack < 0.01) {
        return false;
    }
    exitPoint = entry + into * tBack;
    vec3 normalOut = normalize(center - exitPoint);
    outgoing = refract(into, normalOut, ETA_OUT);
    if (dot(outgoing, outgoing) < 1.0e-8) {
        vec3 bounced = normalize(reflect(into, normalOut));
        vec2 spanC = sphereHits(exitPoint + bounced, bounced, center, radius);
        float tExit = max(spanC.x, spanC.y);
        if (tExit < 0.01) {
            return false;
        }
        vec3 third = exitPoint + bounced * tExit;
        vec3 normalThird = normalize(center - third);
        outgoing = refract(bounced, normalThird, ETA_OUT);
        if (dot(outgoing, outgoing) < 1.0e-8) {
            return false;
        }
        exitPoint = third;
    }
    outgoing = normalize(outgoing);
    return true;
}
`;

        const vertexSource = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

        const beamSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uBuffer;
uniform vec2 uCssScale;
uniform float uViewHeight;
uniform vec2 uLens;
uniform float uRadius;
uniform vec3 uLight;
uniform vec2 uNameSpan;
uniform float uNameRight;
uniform float uGain;
${optics}
void main() {
    vec2 frag = vec2(gl_FragCoord.x, uBuffer.y - gl_FragCoord.y) * uCssScale;
    vec2 rel = frag - uLens;
    float nameMid = (uNameSpan.x + uNameSpan.y) * 0.5;
    float band = abs(uLens.y - nameMid) + uRadius * 3.2;
    if (frag.y < min(uLens.y, nameMid) - band || frag.y > max(uLens.y, nameMid) + band) {
        fragColor = vec4(0.0);
        return;
    }

    vec3 center = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec3 light = vec3(uLight.x, uViewHeight - uLight.y, uLight.z);
    vec3 axis = normalize(center - light);
    vec3 helper = abs(axis.y) < 0.85 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(helper, axis));
    vec3 ty = cross(axis, tx);
    vec2 axis2 = vec2(axis.x, -axis.y);
    axis2 = length(axis2) > 1.0e-4 ? normalize(axis2) : vec2(-1.0, 0.0);
    float side = dot(rel, axis2);
    float dist = length(rel);
    bool inside = dist < uRadius;
    bool incomingLip = inside && dist > uRadius - 12.0 && side < 0.0;
    if (inside && !incomingLip) {
        fragColor = vec4(0.0);
        return;
    }
    float sigma = max(12.0, uRadius * 0.055);
    float acc = 0.0;
    vec3 target = center + axis * (uRadius * 0.72);

    for (int i = 0; i < 48; i++) {
        float fi = float(i) + 0.5;
        float ang = fi * 2.39996323;
        float rad = sqrt(fi / 48.0) * uRadius * 0.36;
        vec3 sampleP = center + (tx * cos(ang) + ty * sin(ang)) * rad;
        vec3 dir = normalize(target - sampleP);
        vec3 origin = sampleP - dir * (uRadius * 5.0);
        vec3 entry;
        vec3 exitPoint;
        vec3 outgoing;
        if (!transmit(origin, dir, center, uRadius, entry, exitPoint, outgoing)) {
            continue;
        }
        if (outgoing.x > -0.02) {
            continue;
        }
        float page = clamp(1.0 - abs(outgoing.z) * 1.2, 0.0, 1.0);
        vec2 entry2 = vec2(entry.x, uViewHeight - entry.y);
        vec2 exitScreen = vec2(exitPoint.x, uViewHeight - exitPoint.y);
        vec2 chord = exitScreen - entry2;
        vec2 relA = entry2 - uLens;
        float a11 = dot(chord, chord);
        float a12 = dot(chord, axis2);
        float den = a11 - a12 * a12;
        float tFocus = abs(den) < 1.0e-4 ? 0.5 : clamp((a12 * dot(axis2, relA) - dot(chord, relA)) / den, 0.0, 1.0);
        vec2 waist = entry2 + chord * tFocus;
        vec2 leave = exitScreen - waist;
        float leaveLen = length(leave);
        vec2 leaveDir = leaveLen > 1.0e-4 ? leave / leaveLen : axis2;
        vec2 tight = normalize(mix(leaveDir, axis2, 0.60));
        vec2 relW = waist - uLens;
        float hitB = dot(relW, tight);
        float hitC = dot(relW, relW) - uRadius * uRadius;
        float hitD = hitB * hitB - hitC;
        float hitT = leaveLen;
        if (hitD > 0.0) {
            hitT = max(-hitB + sqrt(hitD), 0.0);
        }
        vec2 exit2 = waist + tight * hitT;
        vec2 fromCenter = entry2 - uLens;
        if (dot(fromCenter, axis2) < 0.0) {
            vec2 inDir = normalize(fromCenter);
            vec2 deltaIn = frag - entry2;
            float alongOut = dot(deltaIn, inDir);
            if (alongOut > 1.0 && (!inside || incomingLip)) {
                float perp = length(deltaIn - inDir * alongOut);
                float outside = max(dist - uRadius, 0.0);
                if (outside < 16.0 && perp < sigma * 3.2) {
                    float hug = 1.0 - smoothstep(0.0, 16.0, outside);
                    perp *= mix(1.0, 0.82, hug);
                }
                float reach = 1.0 / (1.0 + alongOut / (uRadius * 26.0));
                float core = exp(-0.5 * (perp / sigma) * (perp / sigma));
                float body = exp(-0.5 * (perp / (sigma * 2.15)) * (perp / (sigma * 2.15)));
                acc += (core + body * 0.16) * page * reach;
            }
        }

        vec2 delta = frag - exit2;
        float along = dot(delta, tight);
        if (!inside && along > 1.0) {
            float perp = length(delta - tight * along);
            float reach = 1.0 / (1.0 + along / (uRadius * 26.0));
            float baseSigma = max(10.0, uRadius * 0.046);
            float exitSigma = max(baseSigma, (along + uRadius * 0.55) * 0.042);
            float soft = exp(-0.5 * (perp / exitSigma) * (perp / exitSigma));
            acc += soft * 0.22 * page * reach;
        }
    }

    vec2 fromLens = frag - uLens;
    float alongAxis = dot(fromLens, axis2);
    if (!inside && alongAxis > uRadius * 0.2) {
        float perpAxis = length(fromLens - axis2 * alongAxis);
        float fromPinch = max(alongAxis - uRadius * 0.38, 0.0);
        float coreSigma = max(8.0, uRadius * 0.036) + fromPinch * 0.015;
        float spine = exp(-0.5 * (perpAxis / coreSigma) * (perpAxis / coreSigma));
        float spineReach = 1.0 / (1.0 + max(alongAxis - uRadius, 0.0) / (uRadius * 34.0));
        acc += spine * 14.0 * spineReach;
    }

    acc *= uGain / 2.7;
    float dense = acc / (acc + 6.4);
    vec3 rgb = mix(vec3(0.93, 0.41, 0.06), vec3(0.98, 0.91, 0.78), dense);
    fragColor = vec4(rgb * dense, dense);
}
`;

        const blurSource = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uDirection;
void main() {
    float sigma = 1.3;
    vec4 sum = vec4(0.0);
    float weight = 0.0;
    for (int i = -5; i <= 5; i++) {
        float x = float(i);
        float wgt = exp(-0.5 * (x / sigma) * (x / sigma));
        sum += texture(uTex, vUv + uDirection * x) * wgt;
        weight += wgt;
    }
    fragColor = sum / weight;
}
`;

        const glassSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uBuffer;
uniform vec2 uCssScale;
uniform float uViewHeight;
uniform vec2 uLens;
uniform float uRadius;
uniform vec3 uLight;
uniform sampler2D uBeam;
uniform sampler2D uGlyphs;
${optics}
vec2 lensUv(vec2 fragPx, vec2 pinSize) {
    vec3 centerP = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec2 relP = fragPx - uLens;
    float ndP = length(relP) / max(uRadius, 1.0);
    vec2 straightP = vec2(fragPx.x / pinSize.x, (uViewHeight - fragPx.y) / pinSize.y);
    vec3 camP = vec3(fragPx.x, uViewHeight - fragPx.y, uRadius * 3.2);
    vec3 inP;
    vec3 exitP;
    vec3 outP;
    if (!transmit(camP, vec3(0.0, 0.0, -1.0), centerP, uRadius, inP, exitP, outP)) {
        return straightP;
    }
    float travelP = abs(outP.z) > 0.02 ? (-uRadius * 1.15 - exitP.z) / outP.z : 0.0;
    travelP = clamp(travelP, 0.0, uRadius * 3.0);
    vec3 hitP = exitP + outP * travelP;
    vec2 bentP = vec2(hitP.x / pinSize.x, hitP.y / pinSize.y);
    float bendP = mix(0.08, 0.38, smoothstep(0.48, 0.9, ndP));
    return mix(straightP, bentP, bendP);
}
float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float d2 = dot(ab, ab);
    float t = d2 < 1.0e-4 ? 0.0 : clamp(dot(p - a, ab) / d2, 0.0, 1.0);
    return length(p - (a + ab * t));
}
void main() {
    vec4 beam = texture(uBeam, gl_FragCoord.xy / uBuffer);
    float beamA = beam.a;
    vec3 beamRgb = beamA > 0.001 ? beam.rgb / beamA : vec3(0.0);
    vec2 frag = vec2(gl_FragCoord.x, uBuffer.y - gl_FragCoord.y) * uCssScale;
    vec2 rel = frag - uLens;
    float cover = smoothstep(uRadius + 0.75, uRadius - 1.5, length(rel));
    if (cover <= 0.001) {
        fragColor = vec4(beam.rgb, beamA);
        return;
    }

    float z = sqrt(max(uRadius * uRadius - dot(rel, rel), 0.0));
    vec3 center = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec3 light = vec3(uLight.x, uViewHeight - uLight.y, uLight.z);
    vec3 surf = vec3(frag.x, uViewHeight - frag.y, z);
    vec3 normal = normalize(surf - center);
    float fres = pow(1.0 - clamp(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.5);
    vec3 specDir = reflect(normalize(surf - light), normal);
    float spec = pow(clamp(dot(specDir, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 34.0);
    float facing = pow(clamp(dot(normal, normalize(light - surf)), 0.0, 1.0), 1.8);

    vec3 axis = normalize(center - light);
    vec3 helper = abs(axis.y) < 0.85 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(helper, axis));
    vec3 ty = cross(axis, tx);
    vec3 target = center + axis * (uRadius * 0.72);
    vec2 axis2 = vec2(axis.x, -axis.y);
    axis2 = length(axis2) > 1.0e-4 ? normalize(axis2) : vec2(-1.0, 0.0);
    float wide = max(12.0, uRadius * 0.055);
    float bodyAcc = 0.0;
    for (int i = 0; i < 48; i++) {
        float fi = float(i) + 0.5;
        float ang = fi * 2.39996323;
        float rad = sqrt(fi / 48.0) * uRadius * 0.36;
        vec3 sampleP = center + (tx * cos(ang) + ty * sin(ang)) * rad;
        vec3 dir = normalize(target - sampleP);
        vec3 origin = sampleP - dir * (uRadius * 5.0);
        vec3 entry;
        vec3 exitPoint;
        vec3 outgoing;
        if (!transmit(origin, dir, center, uRadius, entry, exitPoint, outgoing)) {
            continue;
        }
        vec2 a = vec2(entry.x, uViewHeight - entry.y);
        vec2 b = vec2(exitPoint.x, uViewHeight - exitPoint.y);
        vec2 ab = b - a;
        vec2 relA = a - uLens;
        float a11 = dot(ab, ab);
        float a12 = dot(ab, axis2);
        float den = a11 - a12 * a12;
        float tFocus = abs(den) < 1.0e-4 ? 0.5 : clamp((a12 * dot(axis2, relA) - dot(ab, relA)) / den, 0.0, 1.0);
        vec2 waist = a + ab * tFocus;
        vec2 leave = b - waist;
        float leaveLen = length(leave);
        vec2 leaveDir = leaveLen > 1.0e-4 ? leave / leaveLen : axis2;
        vec2 tight = normalize(mix(leaveDir, axis2, 0.60));
        vec2 relW = waist - uLens;
        float hitB = dot(relW, tight);
        float hitC = dot(relW, relW) - uRadius * uRadius;
        float hitD = hitB * hitB - hitC;
        float hitT = leaveLen;
        if (hitD > 0.0) {
            hitT = max(-hitB + sqrt(hitD), 0.0);
        }
        vec2 bTight = waist + tight * hitT;
        float distIn = segDist(frag, a, waist);
        float distOut = segDist(frag, waist, bTight);
        if (distOut < distIn) {
            bodyAcc += 0.2 * exp(-0.5 * (distOut / wide) * (distOut / wide));
            bodyAcc += 0.05 * exp(-0.5 * (distOut / (wide * 2.15)) * (distOut / (wide * 2.15)));
        } else {
            bodyAcc += exp(-0.5 * (distIn / wide) * (distIn / wide));
            bodyAcc += 0.16 * exp(-0.5 * (distIn / (wide * 2.15)) * (distIn / (wide * 2.15)));
        }
    }
    vec2 pinch = uLens + axis2 * (uRadius * 0.38);
    vec2 fromPinch = frag - pinch;
    float alongP = dot(fromPinch, axis2);
    if (alongP > 0.0) {
        float perpP = length(fromPinch - axis2 * alongP);
        float coreSigma = max(8.0, uRadius * 0.036) + alongP * 0.015;
        bodyAcc += exp(-0.5 * (perpP / coreSigma) * (perpP / coreSigma)) * 16.0;
    }
    float spotSigma = max(10.0, uRadius * 0.05);
    float spot = exp(-0.5 * dot(fromPinch, fromPinch) / (spotSigma * spotSigma));
    float dense = bodyAcc / (bodyAcc + 6.4);
    vec3 warm = vec3(0.98, 0.91, 0.78);
    vec3 lit = mix(vec3(0.93, 0.41, 0.06), warm, dense) * dense;
    lit = mix(lit, warm * min(dense + 0.34, 0.94), spot * 0.58);

    float nd = length(rel) / max(uRadius, 1.0);
    float outerLip = smoothstep(0.968, 0.99, nd) * smoothstep(1.0, 0.997, nd);
    float innerCatch = smoothstep(0.93, 0.952, nd) * smoothstep(0.972, 0.958, nd);
    float groove = smoothstep(0.952, 0.968, nd) * smoothstep(0.986, 0.972, nd);
    float lightSide = pow(clamp(dot(normal, normalize(light - surf)), 0.0, 1.0), 0.55);
    float rim = outerLip * mix(0.06, 0.74, lightSide) + innerCatch * mix(0.012, 0.11, lightSide) + fres * mix(0.01, 0.07, lightSide);

    vec2 pinSize = max(uBuffer * uCssScale, vec2(1.0));
    vec2 suv = lensUv(frag, pinSize);
    vec2 dx = dFdx(suv);
    vec2 dy = dFdy(suv);
    vec3 glyph = vec3(0.0);
    float wsum = 0.0;
    for (int gy = -1; gy <= 1; gy++) {
        for (int gx = -1; gx <= 1; gx++) {
            vec2 tap = vec2(float(gx), float(gy));
            float w = exp(-dot(tap, tap) * 0.62);
            vec2 offset = (dx * tap.x + dy * tap.y) * 1.8;
            glyph += texture(uGlyphs, clamp(suv + offset, 0.0, 1.0)).rgb * w;
            wsum += w;
        }
    }
    vec3 through = (glyph / wsum) * 0.48;

    float specSoft = pow(clamp(dot(specDir, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 7.0);
    vec3 glass = through;
    glass *= mix(1.0, 0.9, groove);
    glass += vec3(0.04, 0.025, 0.012) * facing * 0.35;
    glass += lit;
    glass += vec3(0.96, 0.97, 0.99) * rim;
    glass += vec3(1.0, 0.98, 0.95) * spec * 0.42;
    glass += vec3(0.94, 0.95, 0.97) * specSoft * 0.02;

    vec3 color = clamp(mix(beamRgb, glass, cover), 0.0, 0.97);
    float alpha = clamp(mix(beamA, 1.0, cover), 0.0, 1.0);
    fragColor = vec4(color * alpha, alpha);
}
`;

        const compositeSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D uBeam;
uniform vec2 uBuffer;
void main() {
    fragColor = texture(uBeam, gl_FragCoord.xy / uBuffer);
}
`;

        const compile = (type, source, label) => {
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

        const link = (source, label) => {
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

        const locations = (program, names) => {
            const found = {};
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
        } catch (error) {
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

        const makeTarget = (width, height) => {
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

        const setOptics = (loc, scene, bufferW, bufferH, scaleX, scaleY) => {
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

        const drawCssRect = (x0, y0, x1, y1) => {
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
            render(scene, opticsMoved) {
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

    if (!reducedMotion && window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        window.ScrollTrigger.create({
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
        glCanvas.dataset.lensError = error && error.message ? error.message : String(error);
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
