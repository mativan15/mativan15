import * as THREE from 'three'
import glassSource from './shaders/glass.glsl?raw'
import { LENS, lensFrame, sellmeier } from './optics.js'
import { PLANE_X, PLANE_Z_CENTER, PLANE_SIZE } from './letters.js'

const [vertexShader, fragmentShader] = glassSource.split('// --- fragment ---')

function pushVertex(positions, r, z, theta) {
  positions.push(r * Math.cos(theta), r * Math.sin(theta), z)
}

function buildGeometry() {
  const frame = lensFrame()
  const radial = 28
  const rim = 2
  const angles = 96
  const profile = []

  for (let i = 0; i <= radial; i++) {
    const r = (LENS.aperture * i) / radial
    const z = frame.frontCenter[2] - Math.sqrt(LENS.radius * LENS.radius - r * r)
    profile.push([r, z])
  }
  const frontEdgeZ = profile[profile.length - 1][1]
  const backEdgeZ = frame.backCenter[2] + Math.sqrt(LENS.radius * LENS.radius - LENS.aperture * LENS.aperture)
  for (let i = 1; i <= rim; i++) {
    profile.push([LENS.aperture, frontEdgeZ + ((backEdgeZ - frontEdgeZ) * i) / rim])
  }
  for (let i = radial - 1; i >= 0; i--) {
    const r = (LENS.aperture * i) / radial
    const z = frame.backCenter[2] + Math.sqrt(LENS.radius * LENS.radius - r * r)
    profile.push([r, z])
  }

  const positions = []
  for (let a = 0; a < angles; a++) {
    const theta = (a / angles) * Math.PI * 2
    for (const [r, z] of profile) pushVertex(positions, r, z, theta)
  }

  const cols = profile.length
  const indices = []
  const ax = (i, j) => {
    const ii = ((i % angles) + angles) % angles
    return (ii * cols + j) * 3
  }
  const corner = (i, j) => {
    const o = ax(i, j)
    return [positions[o], positions[o + 1], positions[o + 2]]
  }
  const addTri = (i0, j0, i1, j1, i2, j2) => {
    const a = corner(i0, j0)
    const b = corner(i1, j1)
    const c = corner(i2, j2)
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const n = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ]
    const mid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]
    const outward = n[0] * mid[0] + n[1] * mid[1] + n[2] * mid[2]
    const ia = (i0 % angles) * cols + j0
    const ib = (i1 % angles) * cols + j1
    const ic = (i2 % angles) * cols + j2
    if (outward >= 0) indices.push(ia, ib, ic)
    else indices.push(ia, ic, ib)
  }

  for (let a = 0; a < angles; a++) {
    for (let j = 0; j < cols - 1; j++) {
      addTri(a, j, a + 1, j, a, j + 1)
      addTri(a, j + 1, a + 1, j, a + 1, j + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createLens(letterTexture, studioTexture) {
  const frame = lensFrame()
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: true,
    toneMapped: false,
    uniforms: {
      uInvModel: { value: new THREE.Matrix4() },
      uLetters: { value: letterTexture },
      uPlaneX: { value: PLANE_X },
      uPlaneZCenter: { value: PLANE_Z_CENTER },
      uPlaneSize: { value: PLANE_SIZE.clone() },
      uIor: {
        value: new THREE.Vector3(sellmeier(656.3), sellmeier(587.6), sellmeier(486.1)),
      },
      uRadius: { value: LENS.radius },
      uAperture: { value: LENS.aperture },
      uFrontCenter: { value: new THREE.Vector3(...frame.frontCenter) },
      uBackCenter: { value: new THREE.Vector3(...frame.backCenter) },
      uAmbient: { value: 1 },
      uBeamDir: { value: new THREE.Vector3(0, 0, 1) },
      uBlur: { value: 0.45 },
      uDarken: { value: 0.08 },
      uStudio: { value: studioTexture },
    },
  })

  const mesh = new THREE.Mesh(buildGeometry(), material)
  mesh.userData.kind = 'lens'
  mesh.renderOrder = 3
  return mesh
}
