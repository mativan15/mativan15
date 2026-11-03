// --- vertex ---
attribute vec3 aCenter;
attribute vec3 aDir;
attribute float aSide;
attribute float aPower;

varying float vSide;
varying float vPower;

uniform float uWidth;

void main() {
  vec3 toCam = cameraPosition - aCenter;
  vec3 side = cross(aDir, toCam);
  float sideLen = length(side);
  side = sideLen < 1e-4 ? vec3(1.0, 0.0, 0.0) : side / sideLen;
  vec3 pos = aCenter + side * aSide * uWidth;
  vSide = aSide;
  vPower = aPower;
  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
}

// --- fragment ---
varying float vSide;
varying float vPower;

uniform float uSharp;
uniform float uGain;
uniform vec3 uColor;
uniform vec3 uWhite;

void main() {
  float g = exp(-uSharp * vSide * vSide);
  float dense = g * vPower * uGain;
  float hot = dense / (dense + 0.55);
  vec3 color = min(mix(uColor, uWhite, clamp(hot, 0.0, 1.0)) * hot, vec3(0.92));
  gl_FragColor = vec4(color, 1.0);
}
