import { startI18n } from "../i18n";
import { startChrome } from "./chrome";
import { startIntro } from "./intro";
import { startShelf } from "./shelf";
import { startVisualDebug } from "./visual-debug";
import { applyTuneCss, loadTune } from "./visual-tune";

export function boot(): void {
    loadTune();
    applyTuneCss();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const i18n = startI18n();
    startChrome(reducedMotion, i18n);
    startIntro(reducedMotion);
    startShelf(reducedMotion, i18n);
    startVisualDebug();
}
