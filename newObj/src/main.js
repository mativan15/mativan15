import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createLetterPlane } from './letters.js'
import { createLens } from './lens.js'
import { createBeams } from './beams.js'
import { createStudio } from './studio.js'
import { bindControls } from './controls.js'

const app = document.querySelector('#app')
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x07090d, 1)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.NoToneMapping
app.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x07090d)

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.5, 8000)
camera.position.set(168, 18, -128)

const orbit = new OrbitControls(camera, renderer.domElement)
orbit.target.set(-16, 6, 22)
orbit.enableDamping = true
orbit.dampingFactor = 0.08
orbit.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN,
}
orbit.update()
orbit.saveState()

const studio = createStudio()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromEquirectangular(studio).texture
scene.environmentIntensity = 0.9
pmrem.dispose()

const fill = new THREE.HemisphereLight(0xb7c6d6, 0x1a1612, 0.42)
const key = new THREE.DirectionalLight(0xfff1dc, 0.85)
key.position.set(50, 110, -40)
scene.add(fill, key)

const letters = createLetterPlane()
const lens = createLens(letters.texture, studio)
const beams = createBeams()
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(20.95, 0.9, 18, 96),
  new THREE.MeshStandardMaterial({
    color: 0xb8893d,
    metalness: 1,
    roughness: 0.22,
    envMapIntensity: 1.45,
  }),
)
ring.userData.kind = 'lens'
lens.add(ring)
const lamp = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 20, 14),
  new THREE.MeshBasicMaterial({ color: 0xb9dcff }),
)
lamp.userData.kind = 'lamp'

scene.add(letters.mesh, lens, lamp, beams.glow, beams.core, beams.red, beams.deep)

const state = {
  beamDir: new THREE.Vector3(0, 0, 1),
  beamAnchor: new THREE.Vector3(0, 0, 0),
  ambient: 1,
  blur: 0.45,
  darken: 0.08,
  ring: true,
}

const initial = {
  lensPosition: lens.position.clone(),
  lensQuaternion: lens.quaternion.clone(),
  beamDir: state.beamDir.clone(),
  beamAnchor: state.beamAnchor.clone(),
  cameraPosition: camera.position.clone(),
  target: orbit.target.clone(),
}

function reset() {
  lens.position.copy(initial.lensPosition)
  lens.quaternion.copy(initial.lensQuaternion)
  state.beamDir.copy(initial.beamDir)
  state.beamAnchor.copy(initial.beamAnchor)
  state.ambient = 1
  state.blur = 0.45
  state.darken = 0.08
  state.ring = true
  orbit._sphericalDelta.set(0, 0, 0)
  orbit._panOffset.set(0, 0, 0)
  orbit._scale = 1
  orbit.reset()
}

const controls = bindControls({
  canvas: renderer.domElement,
  camera,
  orbit,
  lens,
  lamp,
  state,
  reset,
})

const clock = new THREE.Clock()
const inverse = new THREE.Matrix4()

function frame() {
  const dt = Math.min(0.05, clock.getDelta())
  controls.update(dt)
  orbit.update()

  lamp.position.copy(state.beamAnchor).addScaledVector(state.beamDir, -95)
  beams.update(lens, state.beamDir, state.beamAnchor)

  lens.updateMatrixWorld()
  inverse.copy(lens.matrixWorld).invert()
  const uniforms = lens.material.uniforms
  uniforms.uInvModel.value.copy(inverse)
  uniforms.uAmbient.value = state.ambient
  uniforms.uBeamDir.value.copy(state.beamDir)
  uniforms.uBlur.value = state.blur
  uniforms.uDarken.value = state.darken
  letters.material.color.setScalar(state.ambient)
  ring.visible = state.ring
  const readout = document.querySelector('#glass')
  if (readout) {
    readout.textContent = `Through the glass: blur ${state.blur.toFixed(2)} · darkening ${Math.round(state.darken * 100)}% · ring ${state.ring ? 'on' : 'off'}`
  }

  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
