import * as THREE from 'three'

// A dim room the glass can reflect: cool walls and one warm lamp.
// The same picture is sampled by the glass shader and by the brass ring.

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0 || 1)))
  return t * t * (3 - 2 * t)
}

function normalize(v) {
  const L = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / L, v[1] / L, v[2] / L]
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function rectMask(dir, center, halfU, halfV, softness) {
  const c = normalize(center)
  const helper = Math.abs(c[1]) > 0.85 ? [1, 0, 0] : [0, 1, 0]
  const tangent = normalize(cross(helper, c))
  const bitangent = cross(c, tangent)
  const facing = smoothstep(0.15, 0.75, Math.max(0, dot(dir, c)))
  const across = smoothstep(halfU, halfU - softness, Math.abs(dot(dir, tangent)))
  const along = smoothstep(halfV, halfV - softness, Math.abs(dot(dir, bitangent)))
  return facing * across * along
}

function shade(dir) {
  const up = dir[1]
  let r = 0.025
  let g = 0.032
  let b = 0.048
  const ceiling = smoothstep(0.05, 0.9, up)
  r += 0.035 * ceiling
  g += 0.045 * ceiling
  b += 0.07 * ceiling
  const floor = smoothstep(0.05, -0.75, up)
  r += 0.03 * floor
  g += 0.02 * floor
  b += 0.012 * floor

  const warm = rectMask(dir, [-0.35, 0.78, -0.28], 0.22, 0.16, 0.14)
  r += 0.55 * warm
  g += 0.3 * warm
  b += 0.1 * warm
  return [r, g, b]
}

export function createStudio() {
  const width = 512
  const height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const image = ctx.createImageData(width, height)
  const data = image.data
  for (let y = 0; y < height; y++) {
    const v = 1 - y / (height - 1)
    const lat = (v - 0.5) * Math.PI
    const cosLat = Math.cos(lat)
    const sinLat = Math.sin(lat)
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1)
      const lon = (u - 0.5) * Math.PI * 2
      const dir = [cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon)]
      const [r, g, b] = shade(dir)
      const i = (y * width + x) * 4
      data[i] = Math.min(255, Math.round(r * 255))
      data[i + 1] = Math.min(255, Math.round(g * 255))
      data[i + 2] = Math.min(255, Math.round(b * 255))
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.needsUpdate = true
  return texture
}
