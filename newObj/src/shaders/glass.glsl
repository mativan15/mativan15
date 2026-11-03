// --- vertex ---
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vRadius;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vRadius = length(position.xy);
  gl_Position = projectionMatrix * viewMatrix * world;
}

// --- fragment ---
uniform mat4 uInvModel;
uniform sampler2D uLetters;
uniform float uPlaneX;
uniform float uPlaneZCenter;
uniform vec2 uPlaneSize;
uniform vec3 uIor;
uniform float uRadius;
uniform float uAperture;
uniform vec3 uFrontCenter;
uniform vec3 uBackCenter;
uniform float uAmbient;
uniform vec3 uBeamDir;
uniform float uBlur;
uniform float uDarken;
uniform sampler2D uStudio;
uniform mat4 modelMatrix;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vRadius;

float fresnelDielectric(float cosi, float n1, float n2) {
  float c = clamp(cosi, 0.0, 1.0);
  float ratio = n1 / n2;
  float sin2t = ratio * ratio * (1.0 - c * c);
  if (sin2t >= 1.0) return 1.0;
  float cost = sqrt(1.0 - sin2t);
  float rs = (n1 * c - n2 * cost) / (n1 * c + n2 * cost);
  float rp = (n1 * cost - n2 * c) / (n1 * cost + n2 * c);
  return 0.5 * (rs * rs + rp * rp);
}

vec2 sphereTs(vec3 ro, vec3 rd, vec3 center) {
  vec3 oc = ro - center;
  float halfB = dot(oc, rd);
  float cc = dot(oc, oc) - uRadius * uRadius;
  float disc = halfB * halfB - cc;
  if (disc < 0.0) return vec2(1e9, 1e9);
  float s = sqrt(disc);
  return vec2(-halfB - s, -halfB + s);
}

bool onCap(vec3 p, vec3 center, float faceSign) {
  vec3 rel = p - center;
  // A fraction of a millimetre of slack keeps oblique view rays from popping off the rim.
  if (length(rel.xy) > uAperture + 0.75) return false;
  return faceSign < 0.0 ? rel.z < 0.0 : rel.z > 0.0;
}

bool nearestCap(vec3 ro, vec3 rd, float tmin, out float bestT, out vec3 bestP, out vec3 bestOut) {
  bestT = 1e8;
  bestP = vec3(0.0);
  bestOut = vec3(0.0, 0.0, 1.0);
  bool found = false;
  for (int face = 0; face < 2; face++) {
    vec3 center = face == 0 ? uFrontCenter : uBackCenter;
    float faceSign = face == 0 ? -1.0 : 1.0;
    vec2 ts = sphereTs(ro, rd, center);
    for (int k = 0; k < 2; k++) {
      float t = k == 0 ? ts.x : ts.y;
      if (t <= tmin || t >= bestT) continue;
      vec3 p = ro + rd * t;
      if (!onCap(p, center, faceSign)) continue;
      bestT = t;
      bestP = p;
      bestOut = normalize(p - center);
      found = true;
    }
  }
  return found;
}

bool traceLens(
  vec3 ro,
  vec3 rd,
  float n,
  out vec3 exitPos,
  out vec3 transmit,
  out vec3 bounce,
  out float path,
  out float power,
  out float reflectAmount
) {
  float t;
  vec3 p;
  vec3 outward;
  exitPos = ro;
  transmit = vec3(0.0);
  bounce = rd;
  path = 0.0;
  power = 0.0;
  reflectAmount = 0.0;
  if (!nearestCap(ro, rd, 1e-4, t, p, outward)) return false;

  bool fromOutside = dot(rd, outward) < 0.0;
  vec3 nEntry = fromOutside ? outward : -outward;
  float nInc = fromOutside ? 1.0 : n;
  float nTra = fromOutside ? n : 1.0;
  float cosi = clamp(-dot(rd, nEntry), 0.0, 1.0);
  reflectAmount = fresnelDielectric(cosi, nInc, nTra);
  bounce = reflect(rd, nEntry);

  vec3 inside = refract(rd, nEntry, nInc / nTra);
  if (dot(inside, inside) < 1e-8) return true;

  float t2;
  vec3 p2;
  vec3 outward2;
  if (!nearestCap(p, inside, 1e-3, t2, p2, outward2)) return true;

  vec3 nExit = -outward2;
  float cosi2 = clamp(-dot(inside, nExit), 0.0, 1.0);
  float reflectExit = fresnelDielectric(cosi2, n, 1.0);
  vec3 leaving = refract(inside, nExit, n / 1.0);
  if (dot(leaving, leaving) < 1e-8) return true;

  exitPos = p2;
  transmit = leaving;
  path = length(p2 - p);
  power = (1.0 - reflectAmount) * (1.0 - reflectExit);
  return true;
}

vec3 sampleStudio(vec3 dir) {
  vec3 d = normalize(dir);
  float u = atan(d.z, d.x) * 0.15915494 + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5;
  return texture2D(uStudio, vec2(u, v)).rgb;
}

vec3 roomAlong(vec3 dir) {
  vec3 room = sampleStudio(dir);
  float lamp = pow(clamp(dot(normalize(dir), normalize(-uBeamDir)), 0.0, 1.0), 18.0);
  return room + vec3(0.42, 0.66, 1.0) * lamp * 0.28;
}

vec3 sampleWall(vec3 worldRo, vec3 worldRd) {
  vec3 dark = vec3(0.012, 0.015, 0.02);
  if (abs(worldRd.x) < 1e-4) return dark;
  float t = (uPlaneX - worldRo.x) / worldRd.x;
  if (t <= 0.0) return dark;
  vec3 hit = worldRo + worldRd * t;
  // The wall is rotated 90° about Y, so its width runs along Z and its height along Y.
  float localX = uPlaneZCenter - hit.z;
  vec2 uv = vec2(localX / uPlaneSize.x + 0.5, hit.y / uPlaneSize.y + 0.5);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return dark;
  return texture2D(uLetters, uv, uBlur).rgb * uAmbient;
}

vec3 worldPoint(vec3 localPoint) {
  return (modelMatrix * vec4(localPoint, 1.0)).xyz;
}

vec3 worldDirection(vec3 localPoint, vec3 localDir) {
  if (dot(localDir, localDir) < 1e-8) return vec3(0.0, 0.0, 1.0);
  return normalize(worldPoint(localPoint + localDir) - worldPoint(localPoint));
}

void main() {
  vec3 rdWorld = normalize(vWorldPos - cameraPosition);
  vec3 roLocal = (uInvModel * vec4(cameraPosition, 1.0)).xyz;
  vec3 rdLocal = normalize((uInvModel * vec4(cameraPosition + rdWorld, 1.0)).xyz - roLocal);

  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  if (dot(N, V) < 0.0) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float facing = 1.0 - ndv;
  // Soft glass roll-off, then a thin hot line. The blue edge sits slightly wider, like a glass rim catching light.
  vec3 shine = vec3(pow(facing, 4.2), pow(facing, 3.2), pow(facing, 2.5)) * 0.55;
  shine += vec3(0.95, 0.98, 1.0) * pow(facing, 7.0) * 0.62;
  vec3 R = reflect(-V, N);
  float lampSpec = pow(clamp(dot(normalize(R), normalize(-uBeamDir)), 0.0, 1.0), 64.0);
  vec3 highlight = vec3(0.85, 0.93, 1.0) * lampSpec * 0.85;
  highlight += sampleStudio(R) * pow(facing, 1.15) * 0.62;

  vec3 exitR;
  vec3 dirR;
  vec3 bounce;
  float path;
  float power;
  float reflectAmount;
  bool hit = traceLens(roLocal, rdLocal, uIor.r, exitR, dirR, bounce, path, power, reflectAmount);

  vec3 color = vec3(0.02, 0.03, 0.045) + shine * 0.35 + highlight;
  float alpha = mix(0.15, 0.95, clamp(pow(facing, 2.2) * 1.6, 0.0, 1.0));
  if (hit && power > 0.0) {
    vec3 exitG;
    vec3 dirG;
    vec3 exitB;
    vec3 dirB;
    vec3 bounceG;
    float pathG;
    float powerG;
    float reflectG;
    traceLens(roLocal, rdLocal, uIor.g, exitG, dirG, bounceG, pathG, powerG, reflectG);
    traceLens(roLocal, rdLocal, uIor.b, exitB, dirB, bounce, path, power, reflectAmount);

    vec3 transmitted = vec3(
      sampleWall(worldPoint(exitR), worldDirection(exitR, dirR)).r,
      sampleWall(worldPoint(exitG), worldDirection(exitG, dirG)).g,
      sampleWall(worldPoint(exitB), worldDirection(exitB, dirB)).b
    );
    transmitted *= powerG * (1.0 - uDarken);
    transmitted *= exp(-pathG * vec3(0.010, 0.008, 0.006));

    vec3 worldBounce = worldDirection(exitG, bounceG);
    color = transmitted + roomAlong(worldBounce) * reflectG * 2.6;
    color += shine + highlight;
    alpha = 1.0;
  } else if (hit) {
    vec3 worldBounce = worldDirection(exitR, bounce);
    color = roomAlong(worldBounce) * max(reflectAmount, 0.35) + shine + highlight;
    alpha = 1.0;
  }

  gl_FragColor = linearToOutputTexel(vec4(min(color, vec3(0.97)), alpha));
}
