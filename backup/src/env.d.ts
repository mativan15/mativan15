/// <reference types="astro/client" />

interface Window {
    ScrollTrigger?: { refresh: () => void };
    siteI18n?: {
        readonly lang: string;
        t: (key: string) => string;
        set: (lang: string) => void;
        apply: () => void;
    };
}
