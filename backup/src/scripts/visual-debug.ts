import {
    TUNE_FIELDS,
    applyTuneCss,
    exportTuneText,
    isTuneDefault,
    onTune,
    resetTune,
    setTune,
    tuneChanges,
    tuneValue,
    type TuneField
} from "./visual-tune";

const FLAG_KEY = "mativan15-visual-debug";
const OPEN_KEY = "mativan15-visual-debug-open";

const styles = `
:host { all: initial; }
* { box-sizing: border-box; }
.tab, .panel { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #f4efe6; }
.tab {
    border: 0;
    border-radius: 999px;
    padding: 10px 14px;
    background: #17191c;
    color: #f4efe6;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    cursor: pointer;
    font: 600 13px/1 Inter, ui-sans-serif, system-ui, sans-serif;
    letter-spacing: 0.04em;
}
.panel {
    width: min(380px, calc(100vw - 24px));
    max-height: min(78vh, 820px);
    display: flex;
    flex-direction: column;
    background: rgba(16, 17, 19, 0.96);
    border: 1px solid rgba(244, 239, 230, 0.14);
    border-radius: 16px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
    overflow: hidden;
}
.head, .tools, .search { padding: 12px 12px 0; }
.head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    cursor: grab;
    user-select: none;
    touch-action: none;
}
.head:active { cursor: grabbing; }
.tab { cursor: grab; touch-action: none; }
.head h2 { margin: 0; font-size: 15px; letter-spacing: 0; }
.head p, .status { margin: 4px 0 0; color: #b7b1a6; font-size: 12px; line-height: 1.4; }
.icon {
    border: 0;
    background: transparent;
    color: #f4efe6;
    cursor: pointer;
    font: 600 12px/1 Inter, ui-sans-serif, system-ui, sans-serif;
}
.tools, .row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.tools { padding-bottom: 8px; }
button.action, button.link {
    border: 1px solid rgba(244, 239, 230, 0.16);
    background: #23262b;
    color: #f4efe6;
    border-radius: 999px;
    padding: 6px 10px;
    cursor: pointer;
    font: 600 11px/1 Inter, ui-sans-serif, system-ui, sans-serif;
}
button.link { background: transparent; padding: 0; border: 0; color: #e8a04a; }
.search input, .num input[type="number"], .color input[type="text"] {
    width: 100%;
    border: 1px solid rgba(244, 239, 230, 0.16);
    background: #101113;
    color: #f4efe6;
    border-radius: 8px;
    padding: 8px 10px;
    font: 13px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace;
}
.list { overflow: auto; padding: 0 12px 12px; }
details { border-top: 1px solid rgba(244, 239, 230, 0.1); padding: 8px 0; }
summary { cursor: pointer; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #e8a04a; }
.row { padding: 8px 0 2px; }
.row label { display: block; font-size: 13px; font-weight: 650; }
.hint { margin: 2px 0 6px; color: #b7b1a6; font-size: 12px; line-height: 1.35; }
.slider { display: flex; align-items: center; gap: 8px; }
.slider input[type="range"] { flex: 1; }
.num { width: 92px; }
.color { display: flex; gap: 8px; align-items: center; }
.color input[type="color"] { width: 42px; height: 32px; padding: 0; border: 0; background: transparent; }
.toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.changed { color: #e8a04a; }
.status { min-height: 1.2em; padding: 0 12px 10px; }
.empty { color: #b7b1a6; font-size: 13px; padding: 8px 0; }
`;

const wantsDebug = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1" || params.get("debug") === "visual" || window.location.hash === "#debug") {
        return true;
    }
    try {
        return localStorage.getItem(FLAG_KEY) === "1";
    } catch {
        return false;
    }
};

const remember = (enabled: boolean): void => {
    try {
        if (enabled) {
            localStorage.setItem(FLAG_KEY, "1");
        } else {
            localStorage.removeItem(FLAG_KEY);
        }
    } catch {
        /* The panel still works for this visit. */
    }
};

const rememberOpen = (expanded: boolean): void => {
    try {
        localStorage.setItem(OPEN_KEY, expanded ? "1" : "0");
    } catch {
        /* The panel still works for this visit. */
    }
};

const panelStartsOpen = (): boolean => {
    try {
        return localStorage.getItem(OPEN_KEY) !== "0";
    } catch {
        return true;
    }
};

const download = (text: string): void => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "visual-look.json";
    link.click();
    URL.revokeObjectURL(url);
};

const copyText = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

export function startVisualDebug(): void {
    if (typeof document === "undefined") {
        return;
    }

    const host = document.createElement("div");
    host.id = "visual-debug";
    host.style.cssText = "position:fixed;z-index:2147483000;right:12px;bottom:12px;left:auto;";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = styles;
    const mount = document.createElement("div");
    shadow.append(style, mount);
    document.body.append(host);

    let open = wantsDebug() && panelStartsOpen();
    let query = "";
    let onlyChanged = false;
    let status = "";
    let holding = false;
    let placed = false;
    let x = 12;
    let y = 12;
    const openGroups = new Set<string>();

    const applyPosition = (): void => {
        const width = host.offsetWidth || 80;
        const height = host.offsetHeight || 40;
        x = Math.min(window.innerWidth - 48, Math.max(48 - width, x));
        y = Math.min(window.innerHeight - 48, Math.max(48 - height, y));
        host.style.left = `${Math.round(x)}px`;
        host.style.top = `${Math.round(y)}px`;
        host.style.right = "auto";
        host.style.bottom = "auto";
    };

    const bindDrag = (handle: Element | null): void => {
        if (!(handle instanceof HTMLElement)) {
            return;
        }
        let drag: { dx: number; dy: number; pointer: number; moved: boolean } | null = null;
        handle.addEventListener("pointerdown", (event) => {
            const target = event.target;
            const onTab = handle.classList.contains("tab");
            if (!onTab && target instanceof Element && target.closest("button, input, a, textarea")) {
                return;
            }
            drag = {
                dx: event.clientX - x,
                dy: event.clientY - y,
                pointer: event.pointerId,
                moved: false
            };
            handle.setPointerCapture(event.pointerId);
        });
        handle.addEventListener("pointermove", (event) => {
            if (!drag || drag.pointer !== event.pointerId) {
                return;
            }
            const nextX = event.clientX - drag.dx;
            const nextY = event.clientY - drag.dy;
            if (Math.hypot(nextX - x, nextY - y) > 3) {
                drag.moved = true;
            }
            x = nextX;
            y = nextY;
            placed = true;
            applyPosition();
        });
        const endDrag = (event: PointerEvent): void => {
            if (!drag || drag.pointer !== event.pointerId) {
                return;
            }
            if (drag.moved) {
                handle.dataset.dragged = "1";
            }
            drag = null;
        };
        handle.addEventListener("pointerup", endDrag);
        handle.addEventListener("pointercancel", endDrag);
    };

    const groups = (): string[] => {
        const seen: string[] = [];
        TUNE_FIELDS.forEach((field) => {
            if (!seen.includes(field.group)) {
                seen.push(field.group);
            }
        });
        return seen;
    };

    const matches = (field: TuneField): boolean => {
        if (onlyChanged && isTuneDefault(field.id)) {
            return false;
        }
        if (!query) {
            return true;
        }
        const haystack = `${field.label} ${field.hint} ${field.id} ${field.group}`.toLowerCase();
        return haystack.includes(query);
    };

    const control = (field: TuneField): string => {
        const value = tuneValue(field.id);
        const mark = isTuneDefault(field.id) ? "" : " changed";
        if (field.kind === "toggle") {
            return `<div class="row">
                <label class="toggle${mark}"><input data-toggle="${field.id}" type="checkbox" ${value === true ? "checked" : ""}> ${field.label}</label>
                <p class="hint">${field.hint}</p>
            </div>`;
        }
        if (field.kind === "color") {
            const hex = String(value);
            return `<div class="row">
                <label for="tune-${field.id}">${field.label}</label>
                <p class="hint">${field.hint}</p>
                <div class="color">
                    <input data-color="${field.id}" type="color" value="${hex}">
                    <input data-color-text="${field.id}" type="text" value="${hex}" spellcheck="false">
                    <button class="link" type="button" data-reset="${field.id}">Reset</button>
                </div>
            </div>`;
        }
        const unit = field.unit ? ` ${field.unit}` : "";
        return `<div class="row">
            <label class="${mark}" for="tune-${field.id}">${field.label}</label>
            <p class="hint">${field.hint}</p>
            <div class="slider">
                <input id="tune-${field.id}" data-range="${field.id}" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${value}">
                <span class="num"><input data-num="${field.id}" type="number" min="${field.min}" max="${field.max}" step="${field.step}" value="${value}"></span>
            </div>
            <div class="row-actions"><span class="hint">${unit.trim()}</span><button class="link" type="button" data-reset="${field.id}">Reset</button></div>
        </div>`;
    };

    const render = (): void => {
        mount.querySelectorAll("details").forEach((details) => {
            const name = details.querySelector("summary")?.textContent?.trim() || "";
            if (!name) {
                return;
            }
            if (details.open) {
                openGroups.add(name);
            } else {
                openGroups.delete(name);
            }
        });
        const list = mount.querySelector(".list");
        const listScroll = list instanceof HTMLElement ? list.scrollTop : 0;
        if (!open) {
            mount.innerHTML = `<button class="tab" type="button" data-open>Tune visuals</button>`;
            bindDrag(mount.querySelector("[data-open]"));
            mount.querySelector("[data-open]")?.addEventListener("click", (event) => {
                const tab = event.currentTarget;
                if (tab instanceof HTMLElement && tab.dataset.dragged === "1") {
                    delete tab.dataset.dragged;
                    return;
                }
                open = true;
                remember(true);
                rememberOpen(true);
                render();
            });
            if (!placed) {
                x = window.innerWidth - host.offsetWidth - 12;
                y = window.innerHeight - host.offsetHeight - 12;
                placed = true;
            }
            applyPosition();
            return;
        }
        const changed = tuneChanges().length;
        const body = groups().map((group) => {
            const fields = TUNE_FIELDS.filter((field) => field.group === group && matches(field));
            if (!fields.length) {
                return "";
            }
            const expanded = openGroups.has(group) || query || onlyChanged ? " open" : "";
            return `<details${expanded}><summary>${group}</summary>${fields.map(control).join("")}</details>`;
        }).join("");
        mount.innerHTML = `<section class="panel">
            <div class="head">
                <div>
                    <h2>Visual tune</h2>
                    <p><span data-count>${changed}</span> changed. Drag this title to move the window. The page keeps its original look until you move a control.</p>
                </div>
                <button class="icon" type="button" data-close>Hide</button>
            </div>
            <div class="tools">
                <button class="action" type="button" data-copy>Copy export</button>
                <button class="action" type="button" data-download>Download</button>
                <button class="action" type="button" data-reset-all>Reset all</button>
                <button class="action" type="button" data-changed>${onlyChanged ? "Show all" : "Changed only"}</button>
            </div>
            <div class="search"><input data-search type="search" placeholder="Search light, speed, shadow…" value="${query.replace(/"/g, "&quot;")}"></div>
            <div class="list">${body || `<p class="empty">Nothing matches.</p>`}</div>
            <p class="status">${status}</p>
        </section>`;
        if (!placed) {
            x = window.innerWidth - host.offsetWidth - 12;
            y = window.innerHeight - host.offsetHeight - 12;
            placed = true;
        }
        applyPosition();
        const nextList = mount.querySelector(".list");
        if (nextList instanceof HTMLElement) {
            nextList.scrollTop = listScroll;
        }
        bindDrag(mount.querySelector(".head"));

        const search = mount.querySelector("[data-search]");
        if (search instanceof HTMLInputElement) {
            search.addEventListener("input", () => {
                query = search.value.trim().toLowerCase();
                const caret = search.selectionStart;
                render();
                const next = mount.querySelector("[data-search]");
                if (next instanceof HTMLInputElement) {
                    next.focus();
                    next.setSelectionRange(caret, caret);
                }
            });
        }
        mount.querySelector("[data-close]")?.addEventListener("click", () => {
            open = false;
            rememberOpen(false);
            render();
        });
        mount.querySelector("[data-changed]")?.addEventListener("click", () => {
            onlyChanged = !onlyChanged;
            render();
        });
        mount.querySelector("[data-reset-all]")?.addEventListener("click", () => {
            resetTune();
            status = "Restored the original look.";
            render();
        });
        mount.querySelector("[data-copy]")?.addEventListener("click", () => {
            void copyText(exportTuneText()).then((ok) => {
                status = ok ? "Copied. Paste it back in the chat." : "Copy was blocked. Use Download instead.";
                render();
            });
        });
        mount.querySelector("[data-download]")?.addEventListener("click", () => {
            download(exportTuneText());
            status = "Downloaded visual-look.json.";
            render();
        });
        mount.querySelectorAll("[data-range]").forEach((node) => {
            node.addEventListener("pointerdown", () => {
                holding = true;
            });
            node.addEventListener("input", () => {
                if (!(node instanceof HTMLInputElement)) {
                    return;
                }
                holding = true;
                const id = node.dataset.range || "";
                setTune(id, Number(node.value));
                const paired = mount.querySelector(`[data-num="${id}"]`);
                if (paired instanceof HTMLInputElement) {
                    paired.value = String(tuneValue(id));
                }
            });
            node.addEventListener("pointerup", () => {
                holding = false;
            });
            node.addEventListener("pointercancel", () => {
                holding = false;
            });
            node.addEventListener("change", () => {
                holding = false;
                const id = node instanceof HTMLInputElement ? node.dataset.range || "" : "";
                const label = id ? mount.querySelector(`label[for="tune-${CSS.escape(id)}"]`) : null;
                if (label) {
                    label.classList.toggle("changed", !isTuneDefault(id));
                }
                const count = mount.querySelector("[data-count]");
                if (count) {
                    count.textContent = String(tuneChanges().length);
                }
            });
        });
        mount.querySelectorAll("[data-num]").forEach((node) => {
            node.addEventListener("change", () => {
                if (node instanceof HTMLInputElement) {
                    setTune(node.dataset.num || "", Number(node.value));
                }
            });
        });
        mount.querySelectorAll("[data-color]").forEach((node) => {
            node.addEventListener("input", () => {
                if (!(node instanceof HTMLInputElement)) {
                    return;
                }
                holding = true;
                const id = node.dataset.color || "";
                setTune(id, node.value);
                const paired = mount.querySelector(`[data-color-text="${id}"]`);
                if (paired instanceof HTMLInputElement) {
                    paired.value = String(tuneValue(id));
                }
            });
            node.addEventListener("change", () => {
                holding = false;
                render();
            });
        });
        mount.querySelectorAll("[data-color-text]").forEach((node) => {
            node.addEventListener("change", () => {
                if (node instanceof HTMLInputElement) {
                    setTune(node.dataset.colorText || "", node.value);
                }
            });
        });
        mount.querySelectorAll("[data-toggle]").forEach((node) => {
            node.addEventListener("change", () => {
                if (node instanceof HTMLInputElement) {
                    setTune(node.dataset.toggle || "", node.checked);
                }
            });
        });
        mount.querySelectorAll("[data-reset]").forEach((node) => {
            node.addEventListener("click", () => {
                if (node instanceof HTMLButtonElement) {
                    resetTune(node.dataset.reset || "");
                }
            });
        });
    };

    onTune(() => {
        if (open && !holding) {
            render();
        }
    });

    window.addEventListener("keydown", (event) => {
        if (event.key !== "D" && event.key !== "d") {
            return;
        }
        if (!event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        const typing = event.composedPath().some((node) => (
            node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement
        ));
        if (typing) {
            return;
        }
        event.preventDefault();
        open = !open;
        remember(true);
        rememberOpen(open);
        render();
    });

    if (open) {
        remember(true);
    }
    window.addEventListener("resize", () => applyPosition());
    render();
}

export { applyTuneCss };
