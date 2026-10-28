import type { SiteI18n } from "../i18n";
import {
    SHELF_BOOKS,
    shelfLanguage,
    type ShelfBook,
    type ShelfCopy,
    type ShelfLang
} from "./shelf-books";
import {
    circularOffset,
    nearestTurn,
    loopRepeats,
    shelfCruise,
    shelfShade,
    shelfMetrics,
    shelfPose,
    visibleBooks,
    wrapIndex,
    type ShelfMetrics
} from "./shelf-motion";

const TAU_MS = 170;
const CLICK_GLIDE_MS = 75;

function copyOf(book: ShelfBook, lang: ShelfLang): ShelfCopy {
    return book.copy[lang];
}

function element(tag: string, className: string): HTMLElement {
    const node = document.createElement(tag);
    node.className = className;
    return node;
}

function addText(parent: HTMLElement, className: string, text: string): HTMLElement {
    const node = element("p", className);
    node.textContent = text;
    parent.appendChild(node);
    return node;
}

function decorate(front: HTMLElement, layout: ShelfBook["layout"]): void {
    if (layout === "digit") {
        const num = element("span", "shelf-num");
        num.textContent = "8";
        front.appendChild(num);
    } else if (layout === "mlp") {
        const list = document.createElement("ol");
        list.className = "shelf-stack";
        ["784", "512", "256", "128", "64", "10"].forEach((value) => {
            const item = document.createElement("li");
            item.textContent = value;
            list.appendChild(item);
        });
        front.appendChild(list);
    } else if (layout === "emit") {
        const strata = element("div", "shelf-strata");
        for (let i = 0; i < 3; i += 1) {
            strata.appendChild(element("i", ""));
        }
        front.appendChild(strata);
    } else if (layout === "pace") {
        front.appendChild(element("div", "shelf-horizon"));
    } else if (layout === "clip") {
        front.appendChild(element("div", "shelf-badge"));
    } else if (layout === "term") {
        front.appendChild(element("div", "shelf-lamp"));
    } else if (layout === "manual" || layout === "news") {
        front.appendChild(element("div", "shelf-rule"));
    } else if (layout === "ledger") {
        front.appendChild(element("div", "shelf-lines"));
    } else if (layout === "cube") {
        const stickers = element("div", "shelf-stickers");
        for (let i = 0; i < 4; i += 1) {
            stickers.appendChild(element("i", ""));
        }
        front.appendChild(stickers);
    } else if (layout === "myth") {
        const gem = element("div", "shelf-gem");
        gem.textContent = "◆";
        front.appendChild(gem);
    } else if (layout === "tank") {
        front.appendChild(element("div", "shelf-band"));
    }
}

function placeDecoration(front: HTMLElement, layout: ShelfBook["layout"]): void {
    const mark = front.querySelector(
        ".shelf-num, .shelf-stack, .shelf-strata, .shelf-horizon, .shelf-badge, .shelf-lamp, .shelf-rule, .shelf-lines, .shelf-stickers, .shelf-gem, .shelf-band"
    );
    if (!mark) {
        return;
    }
    const late = layout === "manual" || layout === "term" || layout === "tank";
    const afterTitle = layout === "news";
    const afterKicker = layout === "myth" || layout === "mlp";
    const title = front.querySelector(".shelf-name");
    const kicker = front.querySelector(".shelf-kicker");
    const deck = front.querySelector(".shelf-deck");
    if (layout === "cube" && title) {
        front.insertBefore(mark, title);
        return;
    }
    if (late) {
        front.appendChild(mark);
        return;
    }
    if (afterTitle && title) {
        const after = title.nextSibling;
        if (after) {
            front.insertBefore(mark, after);
        }
        return;
    }
    if (afterKicker && kicker) {
        const after = kicker.nextSibling;
        if (after) {
            front.insertBefore(mark, after);
        }
        return;
    }
    if (deck && layout === "shop") {
        return;
    }
    front.insertBefore(mark, front.firstChild);
}

function fillBook(node: HTMLElement, book: ShelfBook, lang: ShelfLang): void {
    const copy = copyOf(book, lang);
    const kicker = node.querySelector(".shelf-kicker");
    const title = node.querySelector(".shelf-name");
    const deck = node.querySelector(".shelf-deck");
    const foot = node.querySelector(".shelf-foot");
    const spine = node.querySelector(".shelf-spine span");
    if (kicker) {
        kicker.textContent = copy.kicker;
        kicker.toggleAttribute("hidden", copy.kicker.length === 0);
    }
    if (title && book.layout === "neon") {
        title.replaceChildren();
        const first = element("span", "shelf-l1");
        first.textContent = "CYBER";
        const second = element("span", "shelf-l2");
        second.textContent = "PUNK";
        title.append(first, second);
    } else if (title) {
        title.textContent = copy.title;
    }
    if (deck) {
        deck.textContent = copy.deck;
        deck.toggleAttribute("hidden", copy.deck.length === 0 || book.layout === "shop");
    }
    if (foot) {
        foot.textContent = book.layout === "shop" ? copy.deck : "";
        foot.toggleAttribute("hidden", book.layout !== "shop");
    }
    if (spine) {
        spine.textContent = copy.spine;
    }
    const label = copy.title.replace(/\n/g, " ");
    node.setAttribute("aria-label", `${label}. ${copy.note}`);
}

function fitTitle(node: HTMLElement): void {
    const title = node.querySelector(".shelf-name");
    if (!(title instanceof HTMLElement)) {
        return;
    }
    title.style.fontSize = "";
    let size = Number.parseFloat(getComputedStyle(title).fontSize);
    let guard = 0;
    while (size > 13 && title.scrollWidth > title.clientWidth + 1 && guard < 20) {
        size -= 1;
        title.style.fontSize = `${size}px`;
        guard += 1;
    }
}

function makeBook(book: ShelfBook, index: number, lang: ShelfLang): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shelf-book";
    button.dataset.i = String(index);
    button.style.setProperty("--bg", book.bg);
    button.style.setProperty("--ink", book.ink);
    button.style.setProperty("--muted", book.muted);
    button.style.setProperty("--accent", book.accent);
    button.style.setProperty("--font", book.font);

    const shade = element("div", "shelf-shade");
    const mesh = element("div", "shelf-mesh");
    const front = element("div", `shelf-face shelf-front shelf-layout-${book.layout}`);
    addText(front, "shelf-kicker", "");
    addText(front, "shelf-name", "");
    addText(front, "shelf-deck", "");
    addText(front, "shelf-foot", "");
    decorate(front, book.layout);
    placeDecoration(front, book.layout);
    if (book.image) {
        const shot = document.createElement("img");
        shot.className = "shelf-shot";
        shot.alt = "";
        shot.src = book.image;
        front.prepend(shot);
    }

    const spine = element("div", "shelf-face shelf-spine");
    const spineText = document.createElement("span");
    spine.appendChild(spineText);
    mesh.append(
        front,
        spine,
        element("div", "shelf-face shelf-fore"),
        element("div", "shelf-face shelf-top"),
        element("div", "shelf-face shelf-back")
    );
    button.append(shade, mesh);
    fillBook(button, book, lang);
    return button;
}

export function startShelf(reducedMotion: boolean, i18n: SiteI18n): void {
    const stage = document.querySelector("[data-shelf-stage]");
    const world = document.querySelector("[data-shelf-world]");
    const filters = document.querySelector("[data-shelf-filters]");
    const captionTitle = document.querySelector("[data-shelf-title]");
    const captionNote = document.querySelector("[data-shelf-note]");
    const captionLinks = document.querySelector("[data-shelf-links]");
    const captionEyebrow = document.querySelector("[data-shelf-eyebrow]");
    if (!(stage instanceof HTMLElement) || !(world instanceof HTMLElement)) {
        return;
    }
    if (!(filters instanceof HTMLElement)) {
        return;
    }
    if (!(captionTitle instanceof HTMLElement) || !(captionNote instanceof HTMLElement)) {
        return;
    }
    if (!(captionLinks instanceof HTMLElement) || !(captionEyebrow instanceof HTMLElement)) {
        return;
    }

    let lang = shelfLanguage(i18n.lang);
    let tag = "all";
    let shown = -1;
    let focus = 0;
    let velocity = 0;
    let pointerSide: number | null = null;
    let glide: number | null = null;
    let glideMs = TAU_MS;
    let releaseAt: { x: number; y: number } | null = null;
    let last = performance.now();
    let drag: { x: number; y: number; focus: number; moved: boolean; id: number; axis: "" | "x" | "y" } | null = null;
    let fittedWidth = 0;

    const nodes = SHELF_BOOKS.map((book, index) => {
        const node = makeBook(book, index, lang);
        world.appendChild(node);
        return node;
    });

    const currentBooks = (): ShelfBook[] => visibleBooks(SHELF_BOOKS, tag);

    const centerOf = (count: number): number => (count <= 1 ? 0 : Math.floor((count - 1) / 2));

    let slots: { node: HTMLButtonElement; source: number; place: number; copy: number }[] = [];

    const rebuildSlots = (): void => {
        slots.forEach((slot) => {
            if (slot.copy > 0) {
                slot.node.remove();
            }
        });
        slots = [];
        const books = currentBooks();
        const repeats = loopRepeats(books.length);
        books.forEach((book, place) => {
            const source = SHELF_BOOKS.indexOf(book);
            const original = nodes[source];
            if (!original) {
                return;
            }
            for (let copy = 0; copy < repeats; copy += 1) {
                const node = copy === 0 ? original : original.cloneNode(true) as HTMLButtonElement;
                node.dataset.copy = String(copy);
                if (copy > 0) {
                    node.tabIndex = -1;
                    world.appendChild(node);
                }
                slots.push({ node, source, place, copy });
            }
        });
        nodes.forEach((node, index) => {
            const book = SHELF_BOOKS[index];
            if (!book || books.indexOf(book) < 0) {
                node.hidden = true;
                node.setAttribute("aria-hidden", "true");
                node.tabIndex = -1;
                node.removeAttribute("aria-current");
            }
        });
        fittedWidth = 0;
    };

    const applyFilter = (next: string): void => {
        tag = next;
        filters.querySelectorAll<HTMLButtonElement>("[data-shelf-filter]").forEach((button) => {
            const selected = button.dataset.shelfFilter === tag;
            button.setAttribute("aria-checked", selected ? "true" : "false");
            button.tabIndex = selected ? 0 : -1;
        });
        const center = centerOf(currentBooks().length);
        focus = center;
        velocity = 0;
        glide = null;
        shown = -1;
        rebuildSlots();
    };

    const paintCaption = (book: ShelfBook): void => {
        const copy = copyOf(book, lang);
        captionEyebrow.textContent = copy.eyebrow;
        captionTitle.textContent = copy.title.replace(/\n/g, " ");
        captionNote.textContent = copy.note;
        captionLinks.replaceChildren();
        book.repos.forEach((link) => {
            const anchor = document.createElement("a");
            anchor.href = link.href;
            anchor.target = "_blank";
            anchor.rel = "noreferrer";
            anchor.textContent = link.label;
            captionLinks.appendChild(anchor);
        });
    };

    const openBook = (index: number): void => {
        const link = SHELF_BOOKS[index]?.repos[0];
        if (!link) {
            return;
        }
        const anchor = document.createElement("a");
        anchor.href = link.href;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        anchor.click();
    };

    const bookUnder = (clientX: number, clientY: number, size: ShelfMetrics): { turn: number; source: number } | null => {
        const bounds = stage.getBoundingClientRect();
        const y = (clientY - bounds.top) / Math.max(bounds.height, 1);
        if (y < 0.12 || y > 0.9) {
            return null;
        }
        const books = currentBooks();
        const count = books.length;
        if (count === 0) {
            return null;
        }
        const loop = count * loopRepeats(count);
        let best: (typeof slots)[number] | null = null;
        let bestDistance = Infinity;
        let front: (typeof slots)[number] | null = null;
        slots.forEach((slot) => {
            if (slot.node.hidden) {
                return;
            }
            if (slot.node.getAttribute("aria-current") === "true") {
                front = slot;
            }
            const rect = slot.node.getBoundingClientRect();
            const distance = Math.abs(rect.left + rect.width / 2 - clientX);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = slot;
            }
        });
        if (!best) {
            return null;
        }
        if (front) {
            const frontRect = front.node.getBoundingClientRect();
            const frontDistance = Math.abs(frontRect.left + frontRect.width / 2 - clientX);
            const slack = Math.max(18, size.w * 0.16);
            if (best !== front && bestDistance > frontDistance - slack) {
                best = front;
            }
        }
        const loopIndex = best.place + best.copy * count;
        return {
            turn: count <= 1 ? focus : nearestTurn(loopIndex, focus, loop),
            source: best.source
        };
    };

    const frame = (now: number): void => {
        const bounds = stage.getBoundingClientRect();
        const size = shelfMetrics(Math.max(bounds.width, 280));
        const books = currentBooks();
        const count = books.length;
        world.style.setProperty("--w", `${size.w}px`);
        world.style.setProperty("--h", `${size.h}px`);
        world.style.setProperty("--d", `${size.d}px`);
        const shade = shelfShade(count, bounds.width, size);
        stage.style.setProperty("--shade-edge", shade.edge.toFixed(3));
        stage.style.setProperty("--shade-a", `${shade.a.toFixed(2)}%`);
        stage.style.setProperty("--shade-a-alpha", shade.aAlpha.toFixed(3));
        stage.style.setProperty("--shade-b", `${shade.b.toFixed(2)}%`);
        stage.style.setProperty("--shade-b-alpha", shade.bAlpha.toFixed(3));
        stage.style.setProperty("--shade-c", `${shade.c.toFixed(2)}%`);
        stage.style.setProperty("--shade-c-alpha", shade.cAlpha.toFixed(3));
        stage.style.setProperty("--shade-d", `${shade.d.toFixed(2)}%`);

        const dt = Math.min(34, now - last);
        const dragging = drag !== null && drag.axis === "x" && drag.moved;
        if (dragging) {
            velocity = 0;
        } else if (glide !== null) {
            if (reducedMotion) {
                focus = glide;
                glide = null;
            } else {
                focus += (glide - focus) * (1 - Math.exp(-dt / glideMs));
                if (Math.abs(glide - focus) < 0.004) {
                    focus = glide;
                    glide = null;
                }
            }
        } else if (!reducedMotion) {
            const desired = shelfCruise(releaseAt ? null : pointerSide, reducedMotion);
            velocity += (desired - velocity) * (1 - Math.exp(-dt / 120));
            focus += velocity * (dt / 1000);
        }
        if (count > 1 && Math.abs(focus) > count * 4) {
            const turns = Math.trunc(focus / count);
            focus -= turns * count;
            if (glide !== null) {
                glide -= turns * count;
            }
        }
        last = now;

        const active = count === 0 ? -1 : wrapIndex(Math.round(focus), count);
        const repeats = loopRepeats(count);
        const loop = Math.max(count, 1) * repeats;
        let frontNode: HTMLButtonElement | null = null;
        let frontAbs = Infinity;
        slots.forEach((slot) => {
            const distance = count <= 1 ? 0 : circularOffset(slot.place + slot.copy * count, focus, loop);
            const abs = Math.abs(distance);
            if (abs < frontAbs) {
                frontAbs = abs;
                frontNode = slot.node;
            }
            const place = shelfPose(distance, size);
            slot.node.hidden = false;
            slot.node.style.setProperty("--w", `${size.w}px`);
            slot.node.style.setProperty("--h", `${size.h}px`);
            slot.node.style.setProperty("--d", `${size.d}px`);
            slot.node.style.setProperty("--yaw", place.rot.toFixed(2));
            slot.node.style.transform =
                `translate3d(${place.x.toFixed(2)}px, ${place.y.toFixed(2)}px, ${place.z.toFixed(2)}px) ` +
                `rotateY(${place.rot.toFixed(2)}deg) scale(${place.scale.toFixed(3)})`;
        });
        slots.forEach((slot) => {
            const selected = slot.node === frontNode;
            if (selected) {
                slot.node.removeAttribute("aria-hidden");
                slot.node.setAttribute("aria-current", "true");
                slot.node.tabIndex = 0;
            } else {
                slot.node.setAttribute("aria-hidden", "true");
                slot.node.removeAttribute("aria-current");
                slot.node.tabIndex = -1;
            }
        });

        if (fittedWidth !== size.w) {
            fittedWidth = size.w;
            slots.forEach((slot) => {
                if (!slot.node.hidden) {
                    fitTitle(slot.node);
                }
            });
        }

        const selectedBook = active >= 0 ? books[active] : undefined;
        const selectedId = selectedBook ? SHELF_BOOKS.indexOf(selectedBook) : -1;
        if (selectedBook && selectedId !== shown) {
            shown = selectedId;
            paintCaption(selectedBook);
        }
        if (!selectedBook) {
            shown = -1;
            captionEyebrow.textContent = "";
            captionTitle.textContent = "";
            captionNote.textContent = i18n.t("shelf.empty");
            captionLinks.replaceChildren();
        }

        window.requestAnimationFrame(frame);
    };

    filters.addEventListener("click", (event) => {
        const targetNode = event.target;
        if (!(targetNode instanceof Element)) {
            return;
        }
        const button = targetNode.closest("[data-shelf-filter]");
        if (!(button instanceof HTMLButtonElement) || !filters.contains(button)) {
            return;
        }
        const next = button.dataset.shelfFilter || "all";
        if (next === tag) {
            return;
        }
        applyFilter(next);
    });

    filters.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
            return;
        }
        const buttons = [...filters.querySelectorAll<HTMLButtonElement>("[data-shelf-filter]")];
        const current = buttons.findIndex((button) => button.getAttribute("aria-checked") === "true");
        const step = event.key === "ArrowRight" ? 1 : -1;
        const next = buttons[(current + step + buttons.length) % buttons.length];
        event.preventDefault();
        next?.focus();
        next?.click();
    });

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const placePointer = (event: PointerEvent): void => {
        if (!finePointer) {
            return;
        }
        const bounds = stage.getBoundingClientRect();
        pointerSide = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
    };

    stage.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) {
            return;
        }
        placePointer(event);
        glide = null;
        drag = {
            x: event.clientX,
            y: event.clientY,
            focus,
            moved: false,
            id: event.pointerId,
            axis: ""
        };
        const current = world.querySelector<HTMLElement>("[aria-current='true']");
        if (current && document.activeElement !== current) {
            current.focus({ preventScroll: true });
        }
    });

    stage.addEventListener("pointermove", (event) => {
        const size = shelfMetrics(stage.getBoundingClientRect().width);
        if (drag && drag.id === event.pointerId) {
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (!drag.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
                if (drag.axis === "x") {
                    try {
                        stage.setPointerCapture(event.pointerId);
                    } catch {
                        /* Synthetic pointers and some browsers refuse capture. The drag still updates. */
                    }
                }
            }
            if (drag.axis !== "x") {
                return;
            }
            drag.moved = true;
            stage.classList.add("is-drag");
            const count = currentBooks().length;
            const span = Math.max(size.step + size.gap * 0.2, 1);
            focus = count <= 1 ? 0 : drag.focus - dx / span;
            velocity = 0;
            return;
        }
        if (releaseAt) {
            const dx = event.clientX - releaseAt.x;
            const dy = event.clientY - releaseAt.y;
            if (dx * dx + dy * dy > 144) {
                releaseAt = null;
            }
        }
        placePointer(event);
    });

    stage.addEventListener("pointerleave", () => {
        pointerSide = null;
        releaseAt = null;
    });

    const endDrag = (event: PointerEvent): void => {
        if (!drag || drag.id !== event.pointerId) {
            return;
        }
        const horizontal = drag.axis === "x" && drag.moved;
        stage.classList.remove("is-drag");
        if (!horizontal && !drag.moved) {
            // Rotated covers do not receive the hit, so the choice uses the pointer.
            // A side book rushes to the center. The book already there opens.
            const size = shelfMetrics(stage.getBoundingClientRect().width);
            const hit = bookUnder(event.clientX, event.clientY, size);
            if (hit && Math.abs(hit.turn - focus) < 0.45) {
                openBook(hit.source);
            } else if (hit) {
                glide = hit.turn;
                glideMs = CLICK_GLIDE_MS;
                velocity = 0;
                releaseAt = { x: event.clientX, y: event.clientY };
            }
        }
        drag = null;
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    stage.addEventListener("wheel", (event) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
            return;
        }
        event.preventDefault();
        const count = currentBooks().length;
        if (count <= 1) {
            return;
        }
        focus += event.deltaX / 420;
        glide = null;
        releaseAt = null;
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
            return;
        }
        const eventTarget = event.target;
        const shelfRoot = stage.closest("#work");
        if (!(eventTarget instanceof Node) || !shelfRoot?.contains(eventTarget)) {
            return;
        }
        if (eventTarget instanceof Element && eventTarget.closest("[data-shelf-filters], a, input, textarea")) {
            return;
        }
        const count = currentBooks().length;
        if (count <= 1) {
            return;
        }
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : -1;
        glide = Math.round(focus) + step;
        glideMs = TAU_MS;
        velocity = 0;
        releaseAt = null;
    });

    document.addEventListener("site-lang", () => {
        lang = shelfLanguage(i18n.lang);
        nodes.forEach((node, index) => {
            const book = SHELF_BOOKS[index];
            if (book) {
                fillBook(node, book, lang);
            }
        });
        rebuildSlots();
        shown = -1;
    });

    applyFilter("all");
    if (document.fonts) {
        void document.fonts.ready.then(() => {
            fittedWidth = 0;
        });
    }
    window.requestAnimationFrame(frame);
}
