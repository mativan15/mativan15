
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
