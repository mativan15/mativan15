import test from 'node:test'
import assert from 'node:assert/strict'
import { sellmeier, traceRay, axisCrossing, fresnelUnpolarized } from './optics.js'

test('BK7 index at the d line', () => {
  const n = sellmeier(587.6)
  assert.ok(Math.abs(n - 1.5168) < 0.00015, `n = ${n}`)
})

test('normal-incidence Fresnel for n = 1.52 is about 4.3 percent', () => {
  const r = fresnelUnpolarized(1, 1, 1.52)
  assert.ok(Math.abs(r - 0.0426) < 0.001, `R = ${r}`)
})

test('a paraxial ray focuses about 46 mm past the back face', () => {
  const hit = traceRay([0, 1, -80], [0, 0, 1], 1.52)
  assert.equal(hit.hit, true)
  const cross = axisCrossing(hit.exit, hit.transmit)
  assert.ok(cross, 'ray should cross the axis')
  assert.ok(Math.abs(cross.pastBack - 46) < 0.5, `past back = ${cross.pastBack}`)
  assert.ok(cross.miss < 0.05)
})

test('a rim ray focuses about 32 mm past the back face, closer than the center', () => {
  const center = axisCrossing(
    traceRay([0, 1, -80], [0, 0, 1], 1.52).exit,
    traceRay([0, 1, -80], [0, 0, 1], 1.52).transmit,
  )
  const rimHit = traceRay([0, 19.6, -80], [0, 0, 1], 1.52)
  const rim = axisCrossing(rimHit.exit, rimHit.transmit)
  assert.ok(Math.abs(rim.pastBack - 32) < 0.5, `past back = ${rim.pastBack}`)
  assert.ok(rim.pastBack < center.pastBack - 10)
})

test('a ray outside the opening does not bend', () => {
  const hit = traceRay([0, 25, -80], [0, 0, 1], 1.52)
  assert.equal(hit.hit, false)
  assert.equal(hit.transmit, null)
})
