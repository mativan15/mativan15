#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uBuffer;
uniform vec2 uCssScale;
uniform float uViewHeight;
uniform vec2 uLens;
uniform float uRadius;
uniform vec3 uLight;
uniform vec2 uNameSpan;
uniform float uNameRight;
uniform float uGain;
/*__OPTICS__*/
void main() {
    vec2 frag = vec2(gl_FragCoord.x, uBuffer.y - gl_FragCoord.y) * uCssScale;
    vec2 rel = frag - uLens;
    float nameMid = (uNameSpan.x + uNameSpan.y) * 0.5;
    float band = abs(uLens.y - nameMid) + uRadius * 3.2;
    if (frag.y < min(uLens.y, nameMid) - band || frag.y > max(uLens.y, nameMid) + band) {
        fragColor = vec4(0.0);
        return;
    }

    vec3 center = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec3 light = vec3(uLight.x, uViewHeight - uLight.y, uLight.z);
    vec3 axis = normalize(center - light);
    vec3 helper = abs(axis.y) < 0.85 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(helper, axis));
    vec3 ty = cross(axis, tx);
    vec2 axis2 = vec2(axis.x, -axis.y);
    axis2 = length(axis2) > 1.0e-4 ? normalize(axis2) : vec2(-1.0, 0.0);
    float side = dot(rel, axis2);
    float dist = length(rel);
    bool inside = dist < uRadius;
    bool incomingLip = inside && dist > uRadius - 12.0 && side < 0.0;
    if (inside && !incomingLip) {
        fragColor = vec4(0.0);
        return;
    }
    float sigma = max(12.0, uRadius * 0.055);
    float acc = 0.0;
    vec3 target = center + axis * (uRadius * 0.72);

    for (int i = 0; i < 48; i++) {
        float fi = float(i) + 0.5;
        float ang = fi * 2.39996323;
        float rad = sqrt(fi / 48.0) * uRadius * 0.36;
        vec3 sampleP = center + (tx * cos(ang) + ty * sin(ang)) * rad;
        vec3 dir = normalize(target - sampleP);
        vec3 origin = sampleP - dir * (uRadius * 5.0);
        vec3 entry;
        vec3 exitPoint;
        vec3 outgoing;
        if (!transmit(origin, dir, center, uRadius, entry, exitPoint, outgoing)) {
            continue;
        }
        if (outgoing.x > -0.02) {
            continue;
        }
        float page = clamp(1.0 - abs(outgoing.z) * 1.2, 0.0, 1.0);
        vec2 entry2 = vec2(entry.x, uViewHeight - entry.y);
        vec2 exitScreen = vec2(exitPoint.x, uViewHeight - exitPoint.y);
        vec2 chord = exitScreen - entry2;
        vec2 relA = entry2 - uLens;
        float a11 = dot(chord, chord);
        float a12 = dot(chord, axis2);
        float den = a11 - a12 * a12;
        float tFocus = abs(den) < 1.0e-4 ? 0.5 : clamp((a12 * dot(axis2, relA) - dot(chord, relA)) / den, 0.0, 1.0);
        vec2 waist = entry2 + chord * tFocus;
        vec2 leave = exitScreen - waist;
        float leaveLen = length(leave);
        vec2 leaveDir = leaveLen > 1.0e-4 ? leave / leaveLen : axis2;
        vec2 tight = normalize(mix(leaveDir, axis2, 0.60));
        vec2 relW = waist - uLens;
        float hitB = dot(relW, tight);
        float hitC = dot(relW, relW) - uRadius * uRadius;
        float hitD = hitB * hitB - hitC;
        float hitT = leaveLen;
        if (hitD > 0.0) {
            hitT = max(-hitB + sqrt(hitD), 0.0);
        }
        vec2 exit2 = waist + tight * hitT;
        vec2 fromCenter = entry2 - uLens;
        if (dot(fromCenter, axis2) < 0.0) {
            vec2 inDir = normalize(fromCenter);
            vec2 deltaIn = frag - entry2;
            float alongOut = dot(deltaIn, inDir);
            if (alongOut > 1.0 && (!inside || incomingLip)) {
                float perp = length(deltaIn - inDir * alongOut);
                float outside = max(dist - uRadius, 0.0);
                if (outside < 16.0 && perp < sigma * 3.2) {
                    float hug = 1.0 - smoothstep(0.0, 16.0, outside);
                    perp *= mix(1.0, 0.82, hug);
                }
                float reach = 1.0 / (1.0 + alongOut / (uRadius * 26.0));
                float core = exp(-0.5 * (perp / sigma) * (perp / sigma));
                float body = exp(-0.5 * (perp / (sigma * 2.15)) * (perp / (sigma * 2.15)));
                acc += (core + body * 0.16) * page * reach;
            }
        }

        vec2 delta = frag - exit2;
        float along = dot(delta, tight);
        if (!inside && along > 1.0) {
            float perp = length(delta - tight * along);
            float reach = 1.0 / (1.0 + along / (uRadius * 26.0));
            float baseSigma = max(10.0, uRadius * 0.046);
            float exitSigma = max(baseSigma, (along + uRadius * 0.55) * 0.042);
            float soft = exp(-0.5 * (perp / exitSigma) * (perp / exitSigma));
            acc += soft * 0.22 * page * reach;
        }
    }

    vec2 fromLens = frag - uLens;
    float alongAxis = dot(fromLens, axis2);
    if (!inside && alongAxis > uRadius * 0.2) {
        float perpAxis = length(fromLens - axis2 * alongAxis);
        float fromPinch = max(alongAxis - uRadius * 0.38, 0.0);
        float coreSigma = max(8.0, uRadius * 0.036) + fromPinch * 0.015;
        float spine = exp(-0.5 * (perpAxis / coreSigma) * (perpAxis / coreSigma));
        float spineReach = 1.0 / (1.0 + max(alongAxis - uRadius, 0.0) / (uRadius * 34.0));
        acc += spine * 14.0 * spineReach;
    }

    acc *= uGain / 2.7;
    float dense = acc / (acc + 6.4);
    vec3 rgb = mix(vec3(0.93, 0.41, 0.06), vec3(0.98, 0.91, 0.78), dense);
    fragColor = vec4(rgb * dense, dense);
}
