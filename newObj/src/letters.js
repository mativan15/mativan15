import * as THREE from 'three'

// The lens and the lamp stay on the Z axis. This wall is the ZY plane (constant X),
// set back on the far side so the glass and the beam sit in front of it.
export const PLANE_X = -24
export const PLANE_Z_CENTER = 30
export const PLANE_SIZE = new THREE.Vector2(760, 460)

const PHRASE = 'LIGHT BENDS AT EACH SURFACE'

export function createLetterPlane() {
  const canvas = document.createElement('canvas')
  // Four times the old pixel count, while the type is drawn at one tenth of its old size,
  // so the smaller letters stay sharp on the same wall.
  const detail = 4
  const letter = detail / 10
  canvas.width = 2048 * detail
  canvas.height = 1236 * detail
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0c1016'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#d5dde6'
  ctx.font = `600 ${72 * letter}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  const row = 110 * letter
  for (let y = row * 0.65; y < canvas.height; y += row) {
    const shift = (Math.round(y / row) % 2) * 180 * letter
    for (let x = -420 * letter + shift; x < canvas.width + 40; x += 920 * letter) {
      ctx.fillText(PHRASE, x, y)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.anisotropy = 8
  texture.needsUpdate = true

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_SIZE.x, PLANE_SIZE.y), material)
  mesh.position.set(PLANE_X, 0, PLANE_Z_CENTER)
  mesh.rotation.y = Math.PI / 2
  mesh.userData.kind = 'wall'

  return { mesh, texture, material }
}
