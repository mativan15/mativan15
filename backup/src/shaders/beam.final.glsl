#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uBuffer;
uniform vec2 uCssScale;
uniform float uViewHeight;
uniform vec2 uLens;
uniform float uRadius;
uniform vec3 uLight;
uniform float uIor;
uniform float uYaw;
uniform float uEdge;
uniform float uCurve;
uniform float uGain;
uniform float uSigmaK;
uniform float uDenseKnee;
uniform float uBeamAlpha;
uniform vec3 uBeamCool;
uniform vec3 uBeamWarm;
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

float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float d2 = dot(ab, ab);
    float t = d2 < 1.0e-4 ? 0.0 : clamp(dot(p - a, ab) / d2, 0.0, 1.0);
    return length(p - (a + ab * t));
}
vec2 toScreen(vec3 world) {
    return vec2(world.x, uViewHeight - world.y);
}
void main() {
    vec2 frag = vec2(gl_FragCoord.x, uBuffer.y - gl_FragCoord.y) * uCssScale;
    if (abs(frag.y - uLens.y) > uRadius * 3.4) {
        fragColor = vec4(0.0);
        return;
    }
    vec3 center = vec3(uLens.x, uViewHeight - uLens.y, 0.0);
    vec3 lamp = vec3(uLight.x, uViewHeight - uLight.y, uLight.z);
    vec3 toward = center - lamp;
    float span = max(length(toward), 1.0);
    vec3 axis = toward / span;
    vec3 helper = abs(axis.y) < 0.85 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(helper, axis));
    vec3 ty = cross(axis, tx);
    float sigma = max(7.0, uRadius * uSigmaK);
    float acc = 0.0;

    for (int i = 0; i < 40; i++) {
        float fi = float(i) + 0.5;
        float ang = fi * 2.39996323;
        float rad = sqrt(fi / 40.0) * uRadius * 0.92;
        vec3 aim = center + (tx * cos(ang) + ty * sin(ang)) * rad;
        vec3 dir = normalize(aim - lamp);
        vec3 origin = worldToLens(lamp - center, uYaw);
        vec3 localDir = worldToLens(dir, uYaw);
        vec3 entry;
        vec3 exitPoint;
        vec3 outgoing;
        if (!traceLens(origin, localDir, uRadius, uCurve, uEdge, uIor, entry, exitPoint, outgoing)) {
            continue;
        }
        vec3 entryW = center + lensToWorld(entry, uYaw);
        vec3 exitW = center + lensToWorld(exitPoint, uYaw);
        vec3 outW = normalize(lensToWorld(outgoing, uYaw));
        vec3 dirW = normalize(entryW - lamp);
        float approach = min(length(entryW - lamp), uRadius * 3.1);
        vec3 incoming = entryW - dirW * approach;
        vec2 a = toScreen(incoming);
        vec2 b = toScreen(entryW);
        vec2 c = toScreen(exitW);
        vec2 d = toScreen(exitW + outW * (uRadius * 7.5));
        float nearIn = segDist(frag, a, b);
        float nearGlass = segDist(frag, b, c);
        float nearOut = segDist(frag, c, d);
        float coreIn = exp(-0.5 * (nearIn / sigma) * (nearIn / sigma));
        float bodyIn = exp(-0.5 * (nearIn / (sigma * 2.15)) * (nearIn / (sigma * 2.15)));
        float coreGlass = exp(-0.5 * (nearGlass / (sigma * 0.72)) * (nearGlass / (sigma * 0.72)));
        float coreOut = exp(-0.5 * (nearOut / sigma) * (nearOut / sigma));
        float bodyOut = exp(-0.5 * (nearOut / (sigma * 2.15)) * (nearOut / (sigma * 2.15)));
        acc += (coreIn + bodyIn * 0.16) * 0.55 + coreGlass * 0.35 + coreOut + bodyOut * 0.16;
    }

    acc *= uGain / 2.7;
    float dense = acc / (acc + uDenseKnee);
    vec3 rgb = mix(uBeamCool, uBeamWarm, dense);
    fragColor = vec4(rgb * dense, dense) * uBeamAlpha;
}
