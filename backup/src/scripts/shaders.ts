import lensBody from "../shaders/biconvex.glsl?raw";
import beamTemplate from "../shaders/beam.frag.glsl?raw";
import glassTemplate from "../shaders/glass.frag.glsl?raw";
import vertexSource from "../shaders/quad.vert.glsl?raw";
import blurSource from "../shaders/blur.frag.glsl?raw";
import compositeSource from "../shaders/composite.frag.glsl?raw";

const LENS_SLOT = "/*__LENS__*/";

export function shaderSources(): {
    vertexSource: string;
    blurSource: string;
    compositeSource: string;
    beamSource: string;
    glassSource: string;
} {
    return {
        vertexSource,
        blurSource,
        compositeSource,
        beamSource: beamTemplate.replace(LENS_SLOT, lensBody),
        glassSource: glassTemplate.replace(LENS_SLOT, lensBody)
    };
}
