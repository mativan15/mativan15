#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uBuffer;
uniform vec2 uCssScale;
uniform float uViewHeight;
uniform vec2 uLens;
uniform float uRadius;
uniform sampler2D uBeam;
uniform sampler2D uGlyphs;
uniform float uIor;
uniform vec3 uLight;
uniform float uYaw;
uniform float uEdge;
uniform float uCurve;
uniform float uBendNear;
uniform float uBendFar;
uniform float uGlyphGain;
uniform float uFresnelPow;
uniform float uRimScale;
uniform float uSpecPow;
uniform float uSpecGain;
uniform float uSpecSoft;
uniform float uSpecSoftGain;
uniform float uGlassCap;
// Symmetric biconvex lens. Local +Z is the optical axis. Yaw 0 faces the camera.
struct LensHit {
    float t;
    vec3 p;
    vec3 n;
    bool ok;
};

LensHit emptyHit() {
    LensHit hit;
    hit.t = 1e9;
    hit.p = vec3(0.0);
    hit.n = vec3(0.0, 0.0, 1.0);
    hit.ok = false;
    return hit;
}

LensHit nearerHit(LensHit a, LensHit b) {
    if (!a.ok) return b;
    if (!b.ok) return a;
    if (a.t <= b.t) return a;
    return b;
}

LensHit hitCap(vec3 origin, vec3 dir, vec3 center, float radius, float aperture, float facing) {
    LensHit best = emptyHit();
    vec3 oc = origin - center;
    float b = dot(oc, dir);
    float h = b * b - (dot(oc, oc) - radius * radius);
    if (h < 0.0) return best;
    float root = sqrt(h);
    for (int i = 0; i < 2; i++) {
        float t = i == 0 ? -b - root : -b + root;
        if (t < 0.002) continue;
        vec3 p = origin + dir * t;
        if (p.x * p.x + p.y * p.y > aperture * aperture) continue;
        vec3 n = normalize(p - center);
        if (facing > 0.0 && n.z <= 0.0) continue;
        if (facing < 0.0 && n.z >= 0.0) continue;
        if (t < best.t) {
            best.t = t;
            best.p = p;
            best.n = n;
            best.ok = true;
        }
    }
    return best;
}

float lensRadius(float aperture, float curve) {
    return max(curve, 1.05) * aperture;
}

float lensThickness(float aperture, float curve, float edge) {
    float radius = lensRadius(aperture, curve);
    float sagitta = radius - sqrt(max(radius * radius - aperture * aperture, 0.0));
    return max(edge, 0.02) * aperture + 2.0 * sagitta;
}

bool traceLens(vec3 origin, vec3 dir, float aperture, float curve, float edge, float ior, out vec3 entry, out vec3 exitPoint, out vec3 outgoing) {
    float radius = lensRadius(aperture, curve);
    float thickness = lensThickness(aperture, curve, edge);
    vec3 front = vec3(0.0, 0.0, thickness * 0.5 - radius);
    vec3 back = vec3(0.0, 0.0, -thickness * 0.5 + radius);
    vec3 direction = normalize(dir);
    LensHit enter = nearerHit(
        hitCap(origin, direction, front, radius, aperture, 1.0),
        hitCap(origin, direction, back, radius, aperture, -1.0)
    );
    if (!enter.ok || dot(enter.n, direction) >= 0.0) return false;
    vec3 into = refract(direction, enter.n, 1.0 / ior);
    if (dot(into, into) < 1.0e-8) return false;
    into = normalize(into);
    vec3 inside = enter.p - enter.n * 0.02;
    LensHit leave = nearerHit(
        hitCap(inside, into, front, radius, aperture, 1.0),
        hitCap(inside, into, back, radius, aperture, -1.0)
    );
    if (!leave.ok || dot(leave.n, into) <= 0.0) return false;
    vec3 outDir = refract(into, -leave.n, ior);
    if (dot(outDir, outDir) < 1.0e-8) return false;
    entry = enter.p;
    exitPoint = leave.p;
    outgoing = normalize(outDir);
    return true;
}

vec3 lensToWorld(vec3 local, float yaw) {
    float c = cos(yaw);
    float s = sin(yaw);
    return vec3(c * local.x + s * local.z, local.y, -s * local.x + c * local.z);
}

vec3 worldToLens(vec3 world, float yaw) {
    float c = cos(yaw);
    float s = sin(yaw);
    return vec3(c * world.x - s * world.z, world.y, s * world.x + c * world.z);
}

void main() {
    vec4 beam = texture(uBeam, gl_FragCoord.xy / uBuffer);
    float beamA = beam.a;
    vec3 beamRgb = beamA > 0.001 ? beam.rgb / beamA : vec3(0.0);
    vec2 frag = vec2(gl_FragCoord.x, uBuffer.y - gl_FragCoord.y) * uCssScale;
    vec2 rel = frag - uLens;
    float aperture = max(uRadius, 1.0);
    vec3 center = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec3 cam = vec3(frag.x, uViewHeight - frag.y, uRadius * 4.0);
    vec3 camLocal = worldToLens(cam - center, uYaw);
    vec3 viewLocal = worldToLens(vec3(0.0, 0.0, -1.0), uYaw);
    vec3 entry;
    vec3 exitPoint;
    vec3 outgoing;
    bool hit = traceLens(camLocal, viewLocal, uRadius, uCurve, uEdge, uIor, entry, exitPoint, outgoing);
    if (!hit) {
        float ndMiss = length(rel) / aperture;
        float face = abs(cos(uYaw));
        float edge = smoothstep(0.968, 0.99, ndMiss) * (1.0 - smoothstep(1.0, 1.008, ndMiss));
        vec2 o = length(rel) > 0.5 ? normalize(rel) : vec2(1.0, 0.0);
        vec3 rimN = normalize(vec3(o.x, -o.y, 0.62));
        vec3 lightW = vec3(uLight.x, uViewHeight - uLight.y, uLight.z);
        vec3 lightDir = normalize(lightW - vec3(frag.x, uViewHeight - frag.y, 0.0));
        vec3 viewW = vec3(0.0, 0.0, 1.0);
        vec3 halfV = normalize(lightDir + viewW);
        float specCatch = pow(clamp(dot(rimN, halfV), 0.0, 1.0), 12.0);
        float room = edge * face * 0.2 * uRimScale;
        float catchAmt = specCatch * edge * face * 1.35 * uRimScale;
        float rimA = clamp(room + catchAmt, 0.0, 1.0);
        vec3 rimCol = vec3(0.96, 0.97, 0.98) * room + vec3(0.99, 0.95, 0.86) * catchAmt;
        fragColor = vec4(rimCol + beam.rgb * (1.0 - rimA), rimA + beamA * (1.0 - rimA));
        return;
    }

    vec3 exitW = center + lensToWorld(exitPoint, uYaw);
    vec3 outW = normalize(lensToWorld(outgoing, uYaw));
    vec2 pinSize = max(uBuffer * uCssScale, vec2(1.0));
    vec2 straight = vec2(frag.x / pinSize.x, (uViewHeight - frag.y) / pinSize.y);
    float travel = abs(outW.z) > 0.02 ? (-uRadius * 1.15 - exitW.z) / outW.z : 0.0;
    travel = clamp(travel, 0.0, uRadius * 4.0);
    vec3 landed = exitW + outW * travel;
    vec2 bent = vec2(landed.x / pinSize.x, (uViewHeight - landed.y) / pinSize.y);
    float nd = length(rel) / aperture;
    float bend = mix(uBendNear, uBendFar, smoothstep(0.68, 0.97, nd));
    vec2 delta = bent - straight;
    float deltaPx = length(delta * pinSize);
    float maxShift = aperture * 0.28;
    if (deltaPx > maxShift) delta *= maxShift / deltaPx;
    vec2 suv = straight + delta * bend;
    vec2 dx = dFdx(suv);
    vec2 dy = dFdy(suv);
    vec3 glyph = vec3(0.0);
    float weight = 0.0;
    for (int gy = -1; gy <= 1; gy++) {
        for (int gx = -1; gx <= 1; gx++) {
            vec2 tap = vec2(float(gx), float(gy));
            float w = exp(-dot(tap, tap) * 0.62);
            vec2 stepUv = (dx * tap.x + dy * tap.y) * 1.8;
            glyph += texture(uGlyphs, clamp(suv + stepUv, 0.0, 1.0)).rgb * w;
            weight += w;
        }
    }

    float curveR = lensRadius(uRadius, uCurve);
    float curveT = lensThickness(uRadius, uCurve, uEdge);
    vec3 frontC = vec3(0.0, 0.0, curveT * 0.5 - curveR);
    vec3 backC = vec3(0.0, 0.0, -curveT * 0.5 + curveR);
    float onFront = abs(length(entry - frontC) - curveR);
    float onBack = abs(length(entry - backC) - curveR);
    vec3 nUse = onFront <= onBack ? normalize(entry - frontC) : normalize(entry - backC);
    if (dot(nUse, viewLocal) > 0.0) nUse = -nUse;
    vec3 nWorld = normalize(lensToWorld(nUse, uYaw));
    vec3 surfW = center + lensToWorld(entry, uYaw);
    vec3 lightW = vec3(uLight.x, uViewHeight - uLight.y, uLight.z);
    vec3 toLight = normalize(lightW - surfW);
    vec3 viewW = vec3(0.0, 0.0, 1.0);
    float rho = length(entry.xy) / aperture;
    vec2 outward = length(entry.xy) > 0.001 ? normalize(entry.xy) : vec2(1.0, 0.0);
    float bevelZ = mix(1.05, 0.62, smoothstep(0.86, 0.995, rho));
    vec3 bevelN = normalize(lensToWorld(normalize(vec3(outward, bevelZ)), uYaw));
    vec3 lightDir = normalize(toLight);
    vec3 halfV = normalize(lightDir + viewW);
    float specCatch = pow(clamp(dot(bevelN, halfV), 0.0, 1.0), 12.0);
    float atEdge = smoothstep(0.968, 0.992, rho);
    vec3 faceRefl = reflect(-viewW, nWorld);
    float spec = pow(clamp(dot(faceRefl, lightDir), 0.0, 1.0), uSpecPow);
    float faceOn = abs(cos(uYaw));

    vec3 color = (glyph / max(weight, 1.0e-4)) * uGlyphGain * 0.58;
    float faceLight = pow(clamp(dot(nWorld, lightDir), 0.0, 1.0), 1.7);
    color += vec3(0.95, 0.86, 0.68) * faceLight * 0.07;
    color += beamRgb * beamA * 0.45;
    color += vec3(0.96, 0.97, 0.98) * atEdge * 0.2 * uRimScale;
    color += vec3(0.99, 0.95, 0.86) * specCatch * atEdge * 1.35 * uRimScale;
    color += vec3(1.0, 0.97, 0.92) * spec * uSpecGain;
    color = clamp(color, 0.0, uGlassCap);
    float grazing = abs(dot(normalize(nUse), normalize(viewLocal)));
    float edgePixels = grazing / max(fwidth(grazing), 1.0e-3);
    float cover = smoothstep(0.0, 1.8, edgePixels);
    if (faceOn > 0.72) {
        float circle = smoothstep(aperture + 0.75, aperture - 1.5, length(rel));
        cover = min(cover, mix(cover, circle, smoothstep(0.72, 0.94, faceOn)));
    }
    fragColor = vec4(color * cover + beam.rgb * (1.0 - cover), cover + beamA * (1.0 - cover));
}
