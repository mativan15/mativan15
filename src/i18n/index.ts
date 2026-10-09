import en from "./en";
import es from "./es";
import { knows } from "./knows";
import pt from "./pt";

export const SITE_LANGS = ["en", "pt", "es"] as const;
export type Lang = (typeof SITE_LANGS)[number];
const SITE_LANG_KEY = "site-lang";

const copy: Record<Lang, Record<string, string>> = { en, pt, es };

const isLang = (value: string): value is Lang => (SITE_LANGS as readonly string[]).includes(value);

const languageBase = (tag: string): string => {
    const base = String(tag || "").toLowerCase().split("-")[0] ?? "";
    return isLang(base) ? base : "";
};

const languageFromList = (list: readonly string[] | string): Lang => {
    const values = Array.isArray(list) ? list : [list];
    for (const tag of values) {
        const base = languageBase(tag);
        if (base && isLang(base)) {
            return base;
        }
    }
    return "en";
};

const readSavedLanguage = (): string => {
    try {
        const saved = localStorage.getItem(SITE_LANG_KEY) || "";
        return isLang(saved) ? saved : "";
    } catch {
        return "";
    }
};

const languageFromUrl = (): string => {
    const value = new URLSearchParams(window.location.search).get("lang") || "";
    return isLang(value) ? value : "";
};

const startingLanguage = (): Lang => {
    const saved = readSavedLanguage();
    if (isLang(saved)) {
        return saved;
    }
    const fromUrl = languageFromUrl();
    if (isLang(fromUrl)) {
        return fromUrl;
    }
    return languageFromList(navigator.languages || [navigator.language]);
};

let current: Lang = "en";

export function text(key: string | undefined): string {
    if (typeof key !== "string") {
        return "";
    }
    const translated = copy[current]?.[key];
    if (typeof translated === "string") {
        return translated;
    }
    const fallback = copy.en[key];
    return typeof fallback === "string" ? fallback : key;
}

function applyLanguage(): void {
    document.documentElement.lang = current;

    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
        const owner = node.closest("[aria-expanded]");
        const expanded = node.dataset.i18nExpanded && owner && owner.getAttribute("aria-expanded") === "true";
        node.textContent = text(expanded ? node.dataset.i18nExpanded : node.dataset.i18n);
    });

    document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((node) => {
        node.innerHTML = text(node.dataset.i18nHtml);
    });

    document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((node) => {
        node.setAttribute("aria-label", text(node.dataset.i18nAria));
    });

    document.querySelectorAll<HTMLImageElement>("[data-i18n-alt]").forEach((node) => {
        node.alt = text(node.dataset.i18nAlt);
    });

    document.querySelectorAll<HTMLElement>("[data-i18n-content]").forEach((node) => {
        node.setAttribute("content", text(node.dataset.i18nContent));
    });

    document.querySelectorAll<HTMLButtonElement>("[data-set-lang]").forEach((button) => {
        const selected = button.dataset.setLang === current;
        button.setAttribute("aria-checked", selected ? "true" : "false");
        button.tabIndex = selected ? 0 : -1;
    });

    const personData = document.getElementById("person-data");
    if (personData) {
        try {
            const data = JSON.parse(personData.textContent || "") as {
                jobTitle?: string;
                birthPlace?: string;
                knowsAbout?: readonly string[];
            };
            data.jobTitle = text("meta.jobTitle");
            data.birthPlace = text("meta.birthPlace");
            data.knowsAbout = knows[current] || knows.en;
            personData.textContent = JSON.stringify(data, null, 4);
        } catch {
            personData.dataset.langError = "invalid-json";
        }
    }
}

function setLanguage(next: string, persist: boolean): void {
    if (!isLang(next)) {
        return;
    }

    const changed = next !== current;
    current = next;

    if (persist) {
        try {
            localStorage.setItem(SITE_LANG_KEY, next);
        } catch {
            /* The page still switches for this visit when storage is blocked. */
        }
    }

    applyLanguage();

    if (persist && changed) {
        const status = document.querySelector("[data-lang-status]");
        if (status) {
            status.textContent = text("lang.changed");
        }
    }

    if (window.ScrollTrigger) {
        window.requestAnimationFrame(() => {
            window.ScrollTrigger?.refresh();
        });
    }
}

function bindLanguageSwitch(): void {
    const group = document.querySelector(".lang-switch");
    if (!(group instanceof HTMLElement)) {
        return;
    }

    group.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const button = target.closest("[data-set-lang]");
        if (!(button instanceof HTMLButtonElement) || !group.contains(button)) {
            return;
        }
        setLanguage(button.dataset.setLang || "", true);
    });

    group.addEventListener("keydown", (event) => {
        const order = SITE_LANGS;
        const index = order.indexOf(current);
        let nextIndex: number;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            nextIndex = (index + 1) % order.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            nextIndex = (index - 1 + order.length) % order.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = order.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        const next = order[nextIndex] ?? "en";
        setLanguage(next, true);
        const nextButton = group.querySelector(`[data-set-lang="${next}"]`);
        if (nextButton instanceof HTMLElement) {
            nextButton.focus();
        }
    });
}

function reportMissingCopy(): void {
    const gaps: string[] = [];
    const englishKeys = Object.keys(copy.en);

    SITE_LANGS.forEach((lang) => {
        englishKeys.forEach((key) => {
            if (typeof copy[lang][key] !== "string" || !copy[lang][key]?.trim()) {
                gaps.push(`${lang}:${key}`);
            }
        });
        Object.keys(copy[lang]).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(copy.en, key)) {
                gaps.push(`extra ${lang}:${key}`);
            }
        });
        if (!Array.isArray(knows[lang]) || knows[lang].length !== knows.en.length) {
            gaps.push(`${lang}:knows`);
        }
    });

    if (gaps.length) {
        console.warn("Missing translations", gaps);
    }
}

export interface SiteI18n {
    t: (key: string) => string;
}

export function startI18n(): SiteI18n {
    reportMissingCopy();
    setLanguage(startingLanguage(), false);
    bindLanguageSwitch();

    const api = {
        get lang() {
            return current;
        },
        t: text,
        set: (lang: string) => setLanguage(lang, true),
        apply: applyLanguage
    };
    window.siteI18n = api;
    return api;
}
