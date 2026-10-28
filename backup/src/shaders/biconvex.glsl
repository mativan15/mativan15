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
