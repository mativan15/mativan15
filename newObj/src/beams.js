import * as THREE from 'three'
import beamSource from './shaders/beam.glsl?raw'
import { LENS, sellmeier, traceRay } from './optics.js'

const [vertexShader, fragmentShader] = beamSource.split('// --- fragment ---')
const BEAM_IOR = sellmeier(450)
const RED_IOR = sellmeier(656.3)
const DEEP_IOR = sellmeier(405)
const CORE_COUNT = 11
const COLOR_COUNT = 5
const GLOW_COUNT = 72
const BLUE = new THREE.Color(0.16, 0.48, 1)
const BLUE_WHITE = new THREE.Color(0.72, 0.9, 1)

function basis(direction) {
  const dir = direction.clone().normalize()
  const up = Math.abs(dir.y) < 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const tangent = new THREE.Vector3().crossVectors(up, dir).normalize()
  const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize()
  return { dir, tangent, bitangent }
}

function vogel(i, count, radius) {
  const angle = (i + 0.5) * 2.39996323
  const rad = Math.sqrt((i + 0.5) / count) * radius
  return [Math.cos(angle) * rad, Math.sin(angle) * rad]
}

function makeRibbon(maxQuads, width, sharp, gain, color = BLUE, white = BLUE_WHITE) {
  const verts = maxQuads * 6
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(new Float32Array(verts * 3), 3))
  geometry.setAttribute('aDir', new THREE.BufferAttribute(new Float32Array(verts * 3), 3))
  geometry.setAttribute('aSide', new THREE.BufferAttribute(new Float32Array(verts), 1))
  geometry.setAttribute('aPower', new THREE.BufferAttribute(new Float32Array(verts), 1))
  for (const attribute of Object.values(geometry.attributes)) {
    attribute.setUsage(THREE.DynamicDrawUsage)
  }
  geometry.setDrawRange(0, 0)

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uWidth: { value: width },
      uSharp: { value: sharp },
      uGain: { value: gain },
      uColor: { value: color },
      uWhite: { value: white },
    },
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = 2
  return { mesh, quads: 0 }
}

function writeQuad(ribbon, a, b, power) {
  const delta = new THREE.Vector3().subVectors(b, a)
  if (delta.lengthSq() < 1e-4) return
  const dir = delta.normalize()
  const centers = ribbon.mesh.geometry.attributes.aCenter
  const dirs = ribbon.mesh.geometry.attributes.aDir
  const sides = ribbon.mesh.geometry.attributes.aSide
  const powers = ribbon.mesh.geometry.attributes.aPower
  const corners = [
    [a, -1],
    [b, -1],
    [b, 1],
    [a, -1],
    [b, 1],
    [a, 1],
  ]
  let v = ribbon.quads * 6
  for (const [point, side] of corners) {
    centers.setXYZ(v, point.x, point.y, point.z)
    dirs.setXYZ(v, dir.x, dir.y, dir.z)
    sides.setX(v, side)
    powers.setX(v, power)
    v += 1
  }
  ribbon.quads += 1
}

function toWorld(point, matrix, target) {
  return target.set(point[0], point[1], point[2]).applyMatrix4(matrix)
}

export function createBeams() {
  const glow = makeRibbon(GLOW_COUNT * 3, 10.5, 4.2, 0.034)
  const core = makeRibbon(CORE_COUNT * 4, 0.85, 6.5, 0.85)
  const red = makeRibbon(
    COLOR_COUNT * 3,
    0.78,
    9,
    1.45,
    new THREE.Color(1, 0.07, 0.03),
    new THREE.Color(1, 0.24, 0.12),
  )
  const deep = makeRibbon(
    COLOR_COUNT * 3,
    0.78,
    9,
    1.35,
    new THREE.Color(0.12, 0.16, 1),
    new THREE.Color(0.32, 0.38, 1),
  )
  const inverse = new THREE.Matrix4()
  const localOrigin = new THREE.Vector3()
  const localDir = new THREE.Vector3()
  const worldA = new THREE.Vector3()
  const worldB = new THREE.Vector3()

  function traceWorld(lens, origin, direction, ior) {
    inverse.copy(lens.matrixWorld).invert()
    localOrigin.copy(origin).applyMatrix4(inverse)
    localDir.copy(direction).transformDirection(inverse)
    return traceRay(
      [localOrigin.x, localOrigin.y, localOrigin.z],
      [localDir.x, localDir.y, localDir.z],
      ior,
    )
  }

  function addRay(ribbon, lens, origin, direction, withReflection, ior) {
    const result = traceWorld(lens, origin, direction, ior)
    const far = origin.clone().addScaledVector(direction, 320)
    if (!result.hit || !result.transmit) {
      writeQuad(ribbon, origin, far, 0.55)
      return
    }
    const entry = toWorld(result.entry, lens.matrixWorld, worldA).clone()
    const exit = toWorld(result.exit, lens.matrixWorld, worldB).clone()
    const leave = new THREE.Vector3(...result.transmit).transformDirection(lens.matrixWorld)
    const after = exit.clone().addScaledVector(leave, 170)
    writeQuad(ribbon, origin, entry, 1)
    writeQuad(ribbon, entry, exit, result.transmitPower)
    writeQuad(ribbon, exit, after, result.transmitPower)
    if (withReflection && result.reflect) {
      const bounce = new THREE.Vector3(...result.reflect).transformDirection(lens.matrixWorld)
      const reflected = entry.clone().addScaledVector(bounce, 70)
      writeQuad(ribbon, entry, reflected, result.fresnelEntry)
    }
  }

  function update(lens, beamDir, beamAnchor) {
    lens.updateMatrixWorld()
    const { dir, tangent, bitangent } = basis(beamDir)
    for (const ribbon of [glow, core, red, deep]) ribbon.quads = 0

    const launch = (ox, oy, ribbon, reflection, ior) => {
      const origin = beamAnchor
        .clone()
        .addScaledVector(tangent, ox)
        .addScaledVector(bitangent, oy)
        .addScaledVector(dir, -150)
      addRay(ribbon, lens, origin, dir, reflection, ior)
    }

    for (let i = 0; i < CORE_COUNT; i++) {
      const y = (i - (CORE_COUNT - 1) / 2) * 3.6
      launch(0, y, core, true, BEAM_IOR)
    }
    const redHeights = [-12.6, -5.4, 1.8, 9, 16.2]
    const deepHeights = [-16.2, -9, -1.8, 5.4, 12.6]
    for (let i = 0; i < COLOR_COUNT; i++) {
      launch(0, redHeights[i], red, false, RED_IOR)
      launch(0, deepHeights[i], deep, false, DEEP_IOR)
    }
    for (let i = 0; i < GLOW_COUNT; i++) {
      const [x, y] = vogel(i, GLOW_COUNT, LENS.aperture * 0.96)
      launch(x, y, glow, false, BEAM_IOR)
    }

    for (const ribbon of [glow, core, red, deep]) {
      const geometry = ribbon.mesh.geometry
      geometry.setDrawRange(0, ribbon.quads * 6)
      geometry.attributes.aCenter.needsUpdate = true
      geometry.attributes.aDir.needsUpdate = true
      geometry.attributes.aSide.needsUpdate = true
      geometry.attributes.aPower.needsUpdate = true
    }
  }

  return { glow: glow.mesh, core: core.mesh, red: red.mesh, deep: deep.mesh, update }
}
