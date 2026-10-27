import { startI18n } from "../i18n";
import { startChrome } from "./chrome";
import { startIntro } from "./intro";
import { startShelf } from "./shelf";

export function boot(): void {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const i18n = startI18n();
    startChrome(reducedMotion, i18n);
    startIntro(reducedMotion);
    startShelf(reducedMotion, i18n);
}
