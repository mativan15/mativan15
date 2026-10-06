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
    navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            navMenu.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
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
const raySvg = document.getElementById("lens-rays");
const scrollScene = document.querySelector(".canopy-scroll");

if (pin && rig && canvas && canopyName && raySvg && scrollScene) {
    const glyphSet = ["{", "}", "(", ")", ";", "->", "=>", "0x", "[", "]", "fn", "#", "&", "*", "/", "="];
    const ctx = canvas.getContext("2d");
    const mouse = { x: -9999, y: -9999, on: false };
    const svgNS = "http://www.w3.org/2000/svg";
    const rayCount = 18;
    const rays = [];
    let glyphs = [];
    let scrollProgress = reducedMotion ? 1 : 0;
    let tideX = 8;
    let tideY = 1.2;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let sawPointer = false;

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

    const landY = (heightOnLens, lensX, lensY, screenX, focal) => {
        const theta = -heightOnLens / focal;
        const dx = -Math.cos(theta);
        const dy = Math.sin(theta);
        const travel = (screenX - lensX) / dx;
        return lensY + heightOnLens + travel * dy;
    };

    for (let i = 0; i < rayCount; i += 1) {
        const glow = document.createElementNS(svgNS, "line");
        const core = document.createElementNS(svgNS, "line");
        glow.setAttribute("stroke", "#E8A04A");
        glow.setAttribute("stroke-linecap", "round");
        glow.setAttribute("stroke-width", "4.5");
        core.setAttribute("stroke", "#F6D7A2");
        core.setAttribute("stroke-linecap", "round");
        core.setAttribute("stroke-width", "1.35");
        raySvg.appendChild(glow);
        raySvg.appendChild(core);
        rays.push({
            glow,
            core,
            unit: -0.86 + (i / (rayCount - 1)) * 1.72
        });
    }

    const buildGlyphs = () => {
        const next = random(20261006);
        const count = window.matchMedia("(max-width: 720px)").matches ? 320 : 700;
        glyphs = [];
        for (let i = 0; i < count; i += 1) {
            const angle = next() * Math.PI * 2;
            const reach = Math.sqrt(next());
            glyphs.push({
                nx: 0.5 + Math.cos(angle) * 0.46 * reach,
                ny: 0.5 + Math.sin(angle) * 0.46 * reach,
                glyph: glyphSet[i % glyphSet.length],
                amber: i % 5 === 0,
                size: 8 + next() * 3,
                phase: next() * Math.PI * 2,
                amp: 3 + next() * 2,
                alpha: 0.5 + next() * 0.42
            });
        }
    };

    const fitCanvas = () => {
        if (!ctx) {
            return { w: 0, h: 0 };
        }
        const width = rig.clientWidth;
        const height = rig.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        return { w: width, h: height };
    };

    const placeLens = (progress) => {
        const width = pin.clientWidth;
        const height = pin.clientHeight;
        const diameter = rig.offsetWidth || Math.min(height * 0.46, 520);
        const radius = diameter / 2;
        const pinRect = pin.getBoundingClientRect();
        const nameRect = canopyName.getBoundingClientRect();
        const nameRight = nameRect.right - pinRect.left;
        const focal = 1.35 * radius;
        const focusX = nameRight + focal;
        const x = focusX + (0.5 - progress) * width * 0.06;
        const startY = Math.min(height * 0.78, height - radius - 16);
        const endY = headerOffset() + radius + 14;
        const y = startY + (endY - startY) * progress;
        rig.style.left = Math.max(radius + 12, Math.min(width - radius - 12, x)) + "px";
        rig.style.top = Math.max(radius + 8, Math.min(height - radius - 8, y)) + "px";
    };

    const paintScene = () => {
        placeLens(scrollProgress);
        const pinRect = pin.getBoundingClientRect();
        const nameRect = canopyName.getBoundingClientRect();
        const rigRect = rig.getBoundingClientRect();
        const lensX = rigRect.left + rigRect.width / 2 - pinRect.left;
        const lensY = rigRect.top + rigRect.height / 2 - pinRect.top;
        const radius = rigRect.width / 2;
        const focal = Math.max(1, 1.35 * radius);
        const nameRight = nameRect.right - pinRect.left;
        const nameTop = nameRect.top - pinRect.top;
        const nameBottom = nameRect.bottom - pinRect.top;
        const gap = lensX - nameRight;
        const axisY = landY(0, lensX, lensY, nameRight, focal);
        const highY = landY(radius * 0.85, lensX, lensY, nameRight, focal);
        const lowY = landY(-radius * 0.85, lensX, lensY, nameRight, focal);
        const spreadPx = Math.abs(highY - lowY) / 2;
        const spreadPct = Math.max(7, Math.min(42, (spreadPx / Math.max(nameRect.height, 1)) * 100));
        const causticY = ((axisY - nameTop) / Math.max(nameRect.height, 1)) * 100;
        const align = 1 - Math.min(1, Math.abs(axisY - (nameTop + nameRect.height / 2)) / (nameRect.height * 0.75));
        const focus = 1 - Math.min(1, Math.abs(Math.abs(gap) - focal) / (focal * 0.85));
        const strength = 0.12 + 0.88 * align * (0.45 + 0.55 * focus);

        canopyName.style.setProperty("--caustic-y", causticY.toFixed(1) + "%");
        canopyName.style.setProperty("--caustic-band", spreadPct.toFixed(1) + "%");
        canopyName.style.setProperty("--beam", strength.toFixed(3));
        raySvg.setAttribute("viewBox", "0 0 " + pin.clientWidth + " " + pin.clientHeight);

        for (const ray of rays) {
            const heightOnLens = ray.unit * radius;
            const rim = Math.sqrt(Math.max(0, radius * radius - heightOnLens * heightOnLens));
            const x1 = lensX - rim;
            const y1 = lensY + heightOnLens;
            const y2 = landY(heightOnLens, lensX, lensY, nameRight, focal);
            const onName = y2 >= nameTop - 8 && y2 <= nameBottom + 8;
            const coreOpacity = onName ? 0.92 : 0.18;
            const glowOpacity = onName ? 0.32 : 0.07;
            ray.core.setAttribute("x1", x1.toFixed(1));
            ray.core.setAttribute("y1", y1.toFixed(1));
            ray.core.setAttribute("x2", nameRight.toFixed(1));
            ray.core.setAttribute("y2", y2.toFixed(1));
            ray.core.setAttribute("stroke-opacity", coreOpacity.toFixed(2));
            ray.glow.setAttribute("x1", x1.toFixed(1));
            ray.glow.setAttribute("y1", y1.toFixed(1));
            ray.glow.setAttribute("x2", nameRight.toFixed(1));
            ray.glow.setAttribute("y2", y2.toFixed(1));
            ray.glow.setAttribute("stroke-opacity", glowOpacity.toFixed(2));
        }

        if (!ctx) {
            return;
        }

        const { w, h } = { w: rig.clientWidth, h: rig.clientHeight };
        if (w < 2 || h < 2) {
            return;
        }

        if (!reducedMotion) {
            tideX += (8 - tideX) * 0.012;
            tideY += (1.2 - tideY) * 0.012;
        }

        const tideAngle = Math.atan2(tideY, tideX);
        const tideCos = Math.cos(tideAngle);
        const tideSin = Math.sin(tideAngle);
        const time = reducedMotion ? 0 : performance.now() / 1000;
        const pushRadius = 168;
        const push = 86;
        const localX = mouse.x - rigRect.left;
        const localY = mouse.y - rigRect.top;

        ctx.clearRect(0, 0, w, h);
        for (const item of glyphs) {
            let x = item.nx * w;
            let y = item.ny * h;
            let alpha = item.amber ? Math.min(1, item.alpha + 0.15) : item.alpha;

            if (!reducedMotion) {
                const drift = Math.sin(time * 0.75 + item.phase) * item.amp;
                const cross = Math.cos(time * 0.42 + item.phase * 1.6) * item.amp * 0.35;
                x += tideCos * drift - tideSin * cross;
                y += tideSin * drift + tideCos * cross;
            }

            if (mouse.on) {
                const dx = x - localX;
                const dy = y - localY;
                const distance = Math.hypot(dx, dy) || 0.001;
                if (distance < pushRadius) {
                    const force = (pushRadius - distance) / pushRadius;
                    x += (dx / distance) * force * push;
                    y += (dy / distance) * force * push;
                    alpha *= 0.12 + 0.88 * (distance / pushRadius);
                }
            }

            ctx.globalAlpha = alpha;
            ctx.fillStyle = item.amber ? "#E8A04A" : "#E7E1D6";
            ctx.font = item.size.toFixed(1) + "px ui-monospace, SFMono-Regular, Menlo, monospace";
            ctx.fillText(item.glyph, x, y);
        }
        ctx.globalAlpha = 1;
    };

    const frame = () => {
        paintScene();
        if (!reducedMotion) {
            requestAnimationFrame(frame);
        }
    };

    pin.addEventListener("pointermove", (event) => {
        if (sawPointer) {
            tideX = tideX * 0.82 + (event.clientX - lastPointerX) * 0.55;
            tideY = tideY * 0.82 + (event.clientY - lastPointerY) * 0.55;
        }
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        sawPointer = true;
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.on = true;
        if (reducedMotion) {
            paintScene();
        }
    });

    pin.addEventListener("pointerleave", () => {
        mouse.on = false;
        sawPointer = false;
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
        if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
        }
        paintScene();
    });

    buildGlyphs();
    fitCanvas();
    requestAnimationFrame(frame);
}
