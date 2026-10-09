import { describe, expect, it } from "vitest";
import en from "../i18n/en";
import es from "../i18n/es";
import { knows } from "../i18n/knows";
import pt from "../i18n/pt";
import beamFinal from "../shaders/beam.final.glsl?raw";
import blurSource from "../shaders/blur.frag.glsl?raw";
import compositeSource from "../shaders/composite.frag.glsl?raw";
import glassFinal from "../shaders/glass.final.glsl?raw";
import vertexSource from "../shaders/quad.vert.glsl?raw";
import { shaderSources } from "./shaders";

describe("shaders", () => {
    it("rebuilds the original beam and glass programs", () => {
        const sources = shaderSources();
        expect(sources.beamSource).toBe(beamFinal);
        expect(sources.glassSource).toBe(glassFinal);
        expect(sources.vertexSource).toBe(vertexSource);
        expect(sources.blurSource).toBe(blurSource);
        expect(sources.compositeSource).toBe(compositeSource);
    });
});

describe("translations", () => {
    it("gives Portuguese and Spanish every English key", () => {
        expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
        expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
        expect(knows.pt.length).toBe(knows.en.length);
        expect(knows.es.length).toBe(knows.en.length);
    });
});
