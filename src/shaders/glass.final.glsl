#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uBuffer;
uniform vec2 uCssScale;
uniform float uViewHeight;
uniform vec2 uLens;
uniform float uRadius;
uniform vec3 uLight;
uniform sampler2D uBeam;
uniform sampler2D uGlyphs;

const float ETA_IN = 1.0 / 1.52;
const float ETA_OUT = 1.52;

vec2 sphereHits(vec3 origin, vec3 dir, vec3 center, float radius) {
    vec3 oc = origin - center;
    float b = dot(oc, dir);
    float c = dot(oc, oc) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) {
        return vec2(-1.0);
    }
    float s = sqrt(h);
    return vec2(-b - s, -b + s);
}

bool transmit(vec3 origin, vec3 dir, vec3 center, float radius, out vec3 entry, out vec3 exitPoint, out vec3 outgoing) {
    vec2 span = sphereHits(origin, dir, center, radius);
    if (span.x < 0.001) {
        return false;
    }
    entry = origin + dir * span.x;
    vec3 normalIn = normalize(entry - center);
    vec3 into = refract(dir, normalIn, ETA_IN);
    if (dot(into, into) < 1.0e-8) {
        return false;
    }
    into = normalize(into);
    vec2 spanB = sphereHits(entry + into, into, center, radius);
    float tBack = max(spanB.x, spanB.y);
    if (tBack < 0.01) {
        return false;
    }
    exitPoint = entry + into * tBack;
    vec3 normalOut = normalize(center - exitPoint);
    outgoing = refract(into, normalOut, ETA_OUT);
    if (dot(outgoing, outgoing) < 1.0e-8) {
        vec3 bounced = normalize(reflect(into, normalOut));
        vec2 spanC = sphereHits(exitPoint + bounced, bounced, center, radius);
        float tExit = max(spanC.x, spanC.y);
        if (tExit < 0.01) {
            return false;
        }
        vec3 third = exitPoint + bounced * tExit;
        vec3 normalThird = normalize(center - third);
        outgoing = refract(bounced, normalThird, ETA_OUT);
        if (dot(outgoing, outgoing) < 1.0e-8) {
            return false;
        }
        exitPoint = third;
    }
    outgoing = normalize(outgoing);
    return true;
}

vec2 lensUv(vec2 fragPx, vec2 pinSize) {
    vec3 centerP = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec2 relP = fragPx - uLens;
    float ndP = length(relP) / max(uRadius, 1.0);
    vec2 straightP = vec2(fragPx.x / pinSize.x, (uViewHeight - fragPx.y) / pinSize.y);
    vec3 camP = vec3(fragPx.x, uViewHeight - fragPx.y, uRadius * 3.2);
    vec3 inP;
    vec3 exitP;
    vec3 outP;
    if (!transmit(camP, vec3(0.0, 0.0, -1.0), centerP, uRadius, inP, exitP, outP)) {
        return straightP;
    }
    float travelP = abs(outP.z) > 0.02 ? (-uRadius * 1.15 - exitP.z) / outP.z : 0.0;
    travelP = clamp(travelP, 0.0, uRadius * 3.0);
    vec3 hitP = exitP + outP * travelP;
    vec2 bentP = vec2(hitP.x / pinSize.x, hitP.y / pinSize.y);
    float bendP = mix(0.08, 0.38, smoothstep(0.48, 0.9, ndP));
    return mix(straightP, bentP, bendP);
}
float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float d2 = dot(ab, ab);
    float t = d2 < 1.0e-4 ? 0.0 : clamp(dot(p - a, ab) / d2, 0.0, 1.0);
    return length(p - (a + ab * t));
}
void main() {
    vec4 beam = texture(uBeam, gl_FragCoord.xy / uBuffer);
    float beamA = beam.a;
    vec3 beamRgb = beamA > 0.001 ? beam.rgb / beamA : vec3(0.0);
    vec2 frag = vec2(gl_FragCoord.x, uBuffer.y - gl_FragCoord.y) * uCssScale;
    vec2 rel = frag - uLens;
    float cover = smoothstep(uRadius + 0.75, uRadius - 1.5, length(rel));
    if (cover <= 0.001) {
        fragColor = vec4(beam.rgb, beamA);
        return;
    }

    float z = sqrt(max(uRadius * uRadius - dot(rel, rel), 0.0));
    vec3 center = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec3 light = vec3(uLight.x, uViewHeight - uLight.y, uLight.z);
    vec3 surf = vec3(frag.x, uViewHeight - frag.y, z);
    vec3 normal = normalize(surf - center);
    float fres = pow(1.0 - clamp(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.5);
    vec3 specDir = reflect(normalize(surf - light), normal);
    float spec = pow(clamp(dot(specDir, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 34.0);
    float facing = pow(clamp(dot(normal, normalize(light - surf)), 0.0, 1.0), 1.8);

    vec3 axis = normalize(center - light);
    vec3 helper = abs(axis.y) < 0.85 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(helper, axis));
    vec3 ty = cross(axis, tx);
    vec3 target = center + axis * (uRadius * 0.72);
    vec2 axis2 = vec2(axis.x, -axis.y);
    axis2 = length(axis2) > 1.0e-4 ? normalize(axis2) : vec2(-1.0, 0.0);
    float wide = max(12.0, uRadius * 0.055);
    float bodyAcc = 0.0;
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
        vec2 a = vec2(entry.x, uViewHeight - entry.y);
        vec2 b = vec2(exitPoint.x, uViewHeight - exitPoint.y);
        vec2 ab = b - a;
        vec2 relA = a - uLens;
        float a11 = dot(ab, ab);
        float a12 = dot(ab, axis2);
        float den = a11 - a12 * a12;
        float tFocus = abs(den) < 1.0e-4 ? 0.5 : clamp((a12 * dot(axis2, relA) - dot(ab, relA)) / den, 0.0, 1.0);
        vec2 waist = a + ab * tFocus;
        vec2 leave = b - waist;
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
        vec2 bTight = waist + tight * hitT;
        float distIn = segDist(frag, a, waist);
        float distOut = segDist(frag, waist, bTight);
        if (distOut < distIn) {
            bodyAcc += 0.2 * exp(-0.5 * (distOut / wide) * (distOut / wide));
            bodyAcc += 0.05 * exp(-0.5 * (distOut / (wide * 2.15)) * (distOut / (wide * 2.15)));
        } else {
            bodyAcc += exp(-0.5 * (distIn / wide) * (distIn / wide));
            bodyAcc += 0.16 * exp(-0.5 * (distIn / (wide * 2.15)) * (distIn / (wide * 2.15)));
        }
    }
    vec2 pinch = uLens + axis2 * (uRadius * 0.38);
    vec2 fromPinch = frag - pinch;
    float alongP = dot(fromPinch, axis2);
    if (alongP > 0.0) {
        float perpP = length(fromPinch - axis2 * alongP);
        float coreSigma = max(8.0, uRadius * 0.036) + alongP * 0.015;
        bodyAcc += exp(-0.5 * (perpP / coreSigma) * (perpP / coreSigma)) * 16.0;
    }
    float spotSigma = max(10.0, uRadius * 0.05);
    float spot = exp(-0.5 * dot(fromPinch, fromPinch) / (spotSigma * spotSigma));
    float dense = bodyAcc / (bodyAcc + 6.4);
    vec3 warm = vec3(0.98, 0.91, 0.78);
    vec3 lit = mix(vec3(0.93, 0.41, 0.06), warm, dense) * dense;
    lit = mix(lit, warm * min(dense + 0.34, 0.94), spot * 0.58);

    float nd = length(rel) / max(uRadius, 1.0);
    float outerLip = smoothstep(0.968, 0.99, nd) * smoothstep(1.0, 0.997, nd);
    float innerCatch = smoothstep(0.93, 0.952, nd) * smoothstep(0.972, 0.958, nd);
    float groove = smoothstep(0.952, 0.968, nd) * smoothstep(0.986, 0.972, nd);
    float lightSide = pow(clamp(dot(normal, normalize(light - surf)), 0.0, 1.0), 0.55);
    float rim = outerLip * mix(0.06, 0.74, lightSide) + innerCatch * mix(0.012, 0.11, lightSide) + fres * mix(0.01, 0.07, lightSide);

    vec2 pinSize = max(uBuffer * uCssScale, vec2(1.0));
    vec2 suv = lensUv(frag, pinSize);
    vec2 dx = dFdx(suv);
    vec2 dy = dFdy(suv);
    vec3 glyph = vec3(0.0);
    float wsum = 0.0;
    for (int gy = -1; gy <= 1; gy++) {
        for (int gx = -1; gx <= 1; gx++) {
            vec2 tap = vec2(float(gx), float(gy));
            float w = exp(-dot(tap, tap) * 0.62);
            vec2 offset = (dx * tap.x + dy * tap.y) * 1.8;
            glyph += texture(uGlyphs, clamp(suv + offset, 0.0, 1.0)).rgb * w;
            wsum += w;
        }
    }
    vec3 through = (glyph / wsum) * 0.48;

    float specSoft = pow(clamp(dot(specDir, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 7.0);
    vec3 glass = through;
    glass *= mix(1.0, 0.9, groove);
    glass += vec3(0.04, 0.025, 0.012) * facing * 0.35;
    glass += lit;
    glass += vec3(0.96, 0.97, 0.99) * rim;
    glass += vec3(1.0, 0.98, 0.95) * spec * 0.42;
    glass += vec3(0.94, 0.95, 0.97) * specSoft * 0.02;

    vec3 color = clamp(mix(beamRgb, glass, cover), 0.0, 0.97);
    float alpha = clamp(mix(beamA, 1.0, cover), 0.0, 1.0);
    fragColor = vec4(color * alpha, alpha);
}
