// Millimetre lens optics shared by the CPU beam tracer and the tests.
// The glass shader repeats these formulas with the same constants.

export const BK7 = {
  B: [1.03961212, 0.231792344, 1.01046945],
  C: [0.00600069867, 0.0200179144, 103.560653],
}

export const LENS = {
  radius: 50,
  thickness: 12,
  aperture: 20,
}

export function lensFrame(lens = LENS) {
  const frontVertex = -lens.thickness / 2
  const backVertex = lens.thickness / 2
  return {
    frontVertex,
    backVertex,
    frontCenter: [0, 0, frontVertex + lens.radius],
    backCenter: [0, 0, backVertex - lens.radius],
    axis: [0, 0, 1],
  }
}

export function sellmeier(wavelengthNm, glass = BK7) {
  const um = wavelengthNm / 1000
  const l2 = um * um
  let n2 = 1
  for (let i = 0; i < 3; i++) {
    n2 += (glass.B[i] * l2) / (l2 - glass.C[i])
  }
  return Math.sqrt(n2)
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function scale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s]
}

function length(a) {
  return Math.hypot(a[0], a[1], a[2])
}

export function normalize(a) {
  const L = length(a) || 1
  return scale(a, 1 / L)
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x))
}

// N faces the incident side. eta is n_incident / n_transmitted.
// Returns null on total internal reflection.
export function refractDir(incident, normal, eta) {
  const I = normalize(incident)
  const N = normalize(normal)
  const cosi = clamp(-dot(I, N), 0, 1)
  const k = 1 - eta * eta * (1 - cosi * cosi)
  if (k < 0) return null
  const cost = Math.sqrt(k)
  return normalize([
    eta * I[0] + (eta * cosi - cost) * N[0],
    eta * I[1] + (eta * cosi - cost) * N[1],
    eta * I[2] + (eta * cosi - cost) * N[2],
  ])
}

export function reflectDir(incident, normal) {
  const I = normalize(incident)
  const N = normalize(normal)
  const d = dot(I, N)
  return [I[0] - 2 * d * N[0], I[1] - 2 * d * N[1], I[2] - 2 * d * N[2]]
}

export function fresnelUnpolarized(cosi, n1, n2) {
  const c = clamp(cosi, 0, 1)
  const sin2t = (n1 / n2) * (n1 / n2) * (1 - c * c)
  if (sin2t >= 1) return 1
  const cost = Math.sqrt(1 - sin2t)
  const rs = (n1 * c - n2 * cost) / (n1 * c + n2 * cost)
  const rp = (n1 * cost - n2 * c) / (n1 * cost + n2 * c)
  return 0.5 * (rs * rs + rp * rp)
}

function hitSphere(origin, direction, center, radius) {
  const oc = sub(origin, center)
  const halfB = dot(oc, direction)
  const c = dot(oc, oc) - radius * radius
  const disc = halfB * halfB - c
  if (disc < 0) return null
  const s = Math.sqrt(disc)
  return [-halfB - s, -halfB + s]
}

function capHit(origin, direction, center, face, lens, tmin) {
  const ts = hitSphere(origin, direction, center, lens.radius)
  if (!ts) return null
  let best = null
  for (const t of ts) {
    if (t <= tmin) continue
    const point = add(origin, scale(direction, t))
    const rel = sub(point, center)
    const axial = rel[2]
    const radial = Math.hypot(rel[0], rel[1])
    const onFace = face === 'front' ? axial < 0 : axial > 0
    if (!onFace || radial > lens.aperture + 1e-4) continue
    if (!best || t < best.t) {
      best = { t, point, center, face, outward: normalize(rel) }
    }
  }
  return best
}

function nearestCap(origin, direction, lens, tmin) {
  const frame = lensFrame(lens)
  const hits = [
    capHit(origin, direction, frame.frontCenter, 'front', lens, tmin),
    capHit(origin, direction, frame.backCenter, 'back', lens, tmin),
  ].filter(Boolean)
  hits.sort((a, b) => a.t - b.t)
  return hits[0] || null
}

// Trace one ray in lens-local space. Light along +z enters the front cap.
export function traceRay(origin, direction, n, lens = LENS) {
  const dir = normalize(direction)
  const entry = nearestCap(origin, dir, lens, 1e-4)
  if (!entry) {
    return {
      hit: false,
      incoming: dir,
      entry: null,
      exit: null,
      transmit: null,
      reflect: null,
      fresnelEntry: 0,
      fresnelExit: 0,
      transmitPower: 1,
    }
  }

  const entering = dot(dir, entry.outward) < 0
  const nEntry = entering ? entry.outward : scale(entry.outward, -1)
  const nIncident = entering ? 1 : n
  const nTransmit = entering ? n : 1
  const cosi = clamp(-dot(dir, nEntry), 0, 1)
  const fresnelEntry = fresnelUnpolarized(cosi, nIncident, nTransmit)
  const reflect = reflectDir(dir, nEntry)
  const inside = refractDir(dir, nEntry, nIncident / nTransmit)
  if (!inside) {
    return {
      hit: true,
      incoming: dir,
      entry: entry.point,
      exit: null,
      transmit: null,
      reflect,
      fresnelEntry: 1,
      fresnelExit: 0,
      transmitPower: 0,
    }
  }

  const exit = nearestCap(entry.point, inside, lens, 1e-3)
  if (!exit) {
    return {
      hit: true,
      incoming: dir,
      entry: entry.point,
      exit: null,
      transmit: null,
      reflect,
      fresnelEntry,
      fresnelExit: 0,
      transmitPower: 0,
    }
  }

  const nExit = scale(exit.outward, -1)
  const cosiExit = clamp(-dot(inside, nExit), 0, 1)
  const fresnelExit = fresnelUnpolarized(cosiExit, n, 1)
  const transmit = refractDir(inside, nExit, n)
  return {
    hit: true,
    incoming: dir,
    entry: entry.point,
    exit: exit.point,
    transmit,
    reflect,
    fresnelEntry,
    fresnelExit,
    transmitPower: transmit ? (1 - fresnelEntry) * (1 - fresnelExit) : 0,
  }
}

// Where a transmitted ray crosses the optical axis. Null when it misses the axis.
export function axisCrossing(point, direction, lens = LENS) {
  if (!direction) return null
  const radialSlope = Math.hypot(direction[0], direction[1])
  if (radialSlope < 1e-8) return null
  // Meridional rays (x = 0) cross when y = 0. General rays: closest approach.
  const t = -(point[0] * direction[0] + point[1] * direction[1]) / (direction[0] ** 2 + direction[1] ** 2)
  if (t < 0) return null
  const z = point[2] + t * direction[2]
  const miss = Math.hypot(point[0] + t * direction[0], point[1] + t * direction[1])
  return {
    z,
    pastBack: z - lensFrame(lens).backVertex,
    miss,
  }
}
