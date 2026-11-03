import * as THREE from 'three'

const HOLD = new Set()

function keyName(event) {
  if (event.key === '[' || event.key === ']') return event.key
  return event.key.length === 1 ? event.key.toLowerCase() : event.key
}

function cameraBasis(camera) {
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
  const forward = new THREE.Vector3()
  camera.getWorldDirection(forward)
  return { right, up, forward }
}

function pixelsToMillimetres(camera, canvas, focus) {
  const distance = Math.max(40, camera.position.distanceTo(focus))
  const span = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
  return span / canvas.clientHeight
}

export function bindControls({ canvas, camera, orbit, lens, lamp, state, reset }) {
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let drag = null

  window.addEventListener('keydown', (event) => {
    const name = keyName(event)
    if (name === 'r' && !HOLD.has(name)) state.ring = !state.ring
    HOLD.add(name)
    if (name === 'p') reset()
    if (name === '[') state.ambient = Math.max(0.2, state.ambient - 0.1)
    if (name === ']') state.ambient = Math.min(2.4, state.ambient + 0.1)
    if (event.key.startsWith('Arrow') || name === ' ') event.preventDefault()
  })
  window.addEventListener('keyup', (event) => {
    HOLD.delete(keyName(event))
  })
  window.addEventListener('blur', () => HOLD.clear())

  canvas.addEventListener('contextmenu', (event) => event.preventDefault())

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects([lens, lamp], true).filter((hit) => hit.object.visible)
    if (!hits.length) return
    orbit.enabled = false
    event.stopImmediatePropagation()
    event.preventDefault()
    drag = {
      kind: hits[0].object.userData.kind,
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
    canvas.setPointerCapture(event.pointerId)
  }, true)

  canvas.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    drag.x = event.clientX
    drag.y = event.clientY
    const { right, up, forward } = cameraBasis(camera)
    if (drag.kind === 'lens') {
      if (event.altKey) {
        lens.position.addScaledVector(forward, -dy * 0.45)
      } else {
        const scale = pixelsToMillimetres(camera, canvas, lens.position)
        lens.position.addScaledVector(right, dx * scale)
        lens.position.addScaledVector(up, -dy * scale)
      }
      return
    }
    if (event.shiftKey) {
      const scale = pixelsToMillimetres(camera, canvas, state.beamAnchor)
      const slideRight = right.clone().addScaledVector(state.beamDir, -right.dot(state.beamDir))
      const slideUp = up.clone().addScaledVector(state.beamDir, -up.dot(state.beamDir))
      state.beamAnchor.addScaledVector(slideRight, dx * scale)
      state.beamAnchor.addScaledVector(slideUp, -dy * scale)
      return
    }
    const width = canvas.clientHeight || 1
    const yaw = (-dx / width) * Math.PI
    const pitch = (-dy / width) * Math.PI
    const worldUp = new THREE.Vector3(0, 1, 0)
    state.beamDir.applyAxisAngle(worldUp, yaw)
    const hinge = new THREE.Vector3().crossVectors(state.beamDir, worldUp)
    if (hinge.lengthSq() < 1e-6) hinge.set(1, 0, 0)
    hinge.normalize()
    state.beamDir.applyAxisAngle(hinge, pitch).normalize()
  })

  const endDrag = (event) => {
    if (!drag || (event && event.pointerId !== drag.pointerId)) return
    drag = null
    orbit.enabled = true
  }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)

  return {
    update(dt) {
      const { right, up, forward } = cameraBasis(camera)
      const flat = forward.clone()
      flat.y = 0
      if (flat.lengthSq() < 1e-6) flat.set(0, 0, -1)
      flat.normalize()
      const cameraStep = 160 * dt
      const move = new THREE.Vector3()
      if (HOLD.has('w')) move.addScaledVector(flat, cameraStep)
      if (HOLD.has('s')) move.addScaledVector(flat, -cameraStep)
      if (HOLD.has('a')) move.addScaledVector(right, -cameraStep)
      if (HOLD.has('d')) move.addScaledVector(right, cameraStep)
      if (HOLD.has('q')) move.y -= cameraStep
      if (HOLD.has('e')) move.y += cameraStep
      if (move.lengthSq() > 0) {
        camera.position.add(move)
        orbit.target.add(move)
      }

      const lensStep = 70 * dt
      if (HOLD.has('ArrowRight')) lens.position.addScaledVector(right, lensStep)
      if (HOLD.has('ArrowLeft')) lens.position.addScaledVector(right, -lensStep)
      if (HOLD.has('ArrowUp')) lens.position.addScaledVector(up, lensStep)
      if (HOLD.has('ArrowDown')) lens.position.addScaledVector(up, -lensStep)

      const spin = 0.9 * dt
      if (HOLD.has('z')) lens.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), spin)
      if (HOLD.has('x')) lens.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -spin)
      const tiltAxis = right.clone().normalize()
      if (HOLD.has('c')) lens.rotateOnWorldAxis(tiltAxis, spin)
      if (HOLD.has('v')) lens.rotateOnWorldAxis(tiltAxis, -spin)

      const aim = 0.7 * dt
      const worldUp = new THREE.Vector3(0, 1, 0)
      if (HOLD.has('j')) state.beamDir.applyAxisAngle(worldUp, aim)
      if (HOLD.has('l')) state.beamDir.applyAxisAngle(worldUp, -aim)
      const hinge = new THREE.Vector3().crossVectors(state.beamDir, worldUp)
      if (hinge.lengthSq() < 1e-8) hinge.set(1, 0, 0)
      hinge.normalize()
      if (HOLD.has('i')) state.beamDir.applyAxisAngle(hinge, aim)
      if (HOLD.has('k')) state.beamDir.applyAxisAngle(hinge, -aim)
      state.beamDir.normalize()

      const slide = 70 * dt
      const slideAxis = right.clone().addScaledVector(state.beamDir, -right.dot(state.beamDir))
      if (slideAxis.lengthSq() > 1e-6) {
        slideAxis.normalize()
        if (HOLD.has('u')) state.beamAnchor.addScaledVector(slideAxis, -slide)
        if (HOLD.has('o')) state.beamAnchor.addScaledVector(slideAxis, slide)
      }

      if (HOLD.has(',')) state.blur = Math.max(0, state.blur - 1.1 * dt)
      if (HOLD.has('.')) state.blur = Math.min(6, state.blur + 1.1 * dt)
      if (HOLD.has('-')) state.darken = Math.max(0, state.darken - 0.22 * dt)
      if (HOLD.has('=')) state.darken = Math.min(0.85, state.darken + 0.22 * dt)
    },
  }
}
