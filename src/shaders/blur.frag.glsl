#version 300 es
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
