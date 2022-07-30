import { describe, expect, test, vi } from 'vitest'
import { BoundingBox, Ellipse, Hex, HexPrototype, Orientation } from '../types'
import { cloneHex } from './cloneHex'
import { corners } from './corners'
import { createHex } from './createHex'
import { createHexPrototype } from './createHexPrototype'

vi.mock('./cloneHex')
vi.mock('./corners')

test('returns the default hex prototype when no options are passed', () => {
  const prototype = createHexPrototype()
  expect(Object.getOwnPropertyDescriptors(prototype)).toStrictEqual<TypedPropertyDescriptors<HexPrototype>>({
    dimensions: {
      value: { xRadius: 1, yRadius: 1 },
      writable: true,
      enumerable: true,
      configurable: true,
    },
    orientation: {
      value: Orientation.POINTY,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    origin: {
      value: { x: 0, y: 0 },
      writable: true,
      enumerable: true,
      configurable: true,
    },
    offset: { value: -1, writable: true, enumerable: true, configurable: true },
    equals: {
      value: expect.any(Function),
      writable: true,
      enumerable: true,
      configurable: true,
    },
    center: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    clone: {
      value: expect.any(Function),
      writable: true,
      enumerable: true,
      configurable: true,
    },
    __isHoneycombHex: {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false,
    },
    col: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    corners: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    height: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    isFlat: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    isPointy: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    row: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    s: {
      get: expect.any(Function),
      set: expect.any(Function),
      enumerable: false,
      configurable: false,
    },
    toString: {
      value: expect.any(Function),
      writable: true,
      enumerable: true,
      configurable: true,
    },
    width: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    x: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    y: {
      get: expect.any(Function),
      set: undefined,
      enumerable: false,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      configurable: false,
      enumerable: false,
      value: 'Hex',
      writable: false,
    },
  })
})

test('returns the hex prototype with clone method', () => {
  const prototype = createHexPrototype()
  const newProps = {}
  prototype.clone(newProps)

  expect(cloneHex).toBeCalledWith(prototype, newProps)
})

test('returns the hex prototype with corners getter', () => {
  const prototype = createHexPrototype()
  prototype.corners

  expect(corners).toBeCalledWith(prototype)
})

describe('equals()', () => {
  test('returns the hex prototype with equals method', () => {
    const prototype = createHexPrototype()
    expect(prototype.equals.call({ q: 1, r: 2 } as Hex, { q: 1, r: 2 })).toBe(true)
  })

  test('accepts offset coordinates', () => {
    const prototype = createHexPrototype()
    expect(prototype.equals.call({ q: 1, r: 2 } as Hex, { col: 1, row: 2 })).toBe(true)
  })
})

test('returns the hex prototype with toString method', () => {
  const prototype = createHexPrototype()
  const hex = createHex(prototype, { q: 1, r: 2 })
  const result = hex.toString()

  expect(result).toBe('1,2')
})

describe('dimensions', () => {
  test('accepts an ellipse', () => {
    const prototype = createHexPrototype({ dimensions: { xRadius: 1, yRadius: 2 } })
    expect(prototype.dimensions).toEqual({ xRadius: 1, yRadius: 2 })
  })

  test('accepts a rectangular bounding box', () => {
    const pointyPrototype = createHexPrototype({ orientation: 'pointy', dimensions: { width: 10, height: 20 } })
    expect(pointyPrototype.dimensions).toEqual({ xRadius: 5.773502691896258, yRadius: 10 })

    const flatPrototype = createHexPrototype({ orientation: 'flat', dimensions: { width: 10, height: 20 } })
    expect(flatPrototype.dimensions).toEqual({ xRadius: 5, yRadius: 11.547005383792516 })
  })

  test('accepts a radius', () => {
    const prototype = createHexPrototype({ dimensions: 1 })
    expect(prototype.dimensions).toEqual({ xRadius: 1, yRadius: 1 })
  })

  test('throws for invalid dimensions', () => {
    const invalidEllipse: Ellipse = { xRadius: -1, yRadius: -2 }
    expect(() => createHexPrototype({ dimensions: invalidEllipse })).toThrow(
      `Invalid dimensions: ${JSON.stringify(
        invalidEllipse,
      )}. Dimensions must be expressed as an Ellipse ({ xRadius: number, yRadius: number }), a Rectangle ({ width: number, height: number }) or a number.`,
    )

    const invalidBoundingBox: BoundingBox = { width: -1, height: -2 }
    expect(() => createHexPrototype({ dimensions: invalidBoundingBox })).toThrow(
      `Invalid dimensions: ${JSON.stringify(
        invalidBoundingBox,
      )}. Dimensions must be expressed as an Ellipse ({ xRadius: number, yRadius: number }), a Rectangle ({ width: number, height: number }) or a number.`,
    )

    const invalidRadius = -1
    expect(() => createHexPrototype({ dimensions: invalidRadius })).toThrow(
      `Invalid dimensions: ${JSON.stringify(
        invalidRadius,
      )}. Dimensions must be expressed as an Ellipse ({ xRadius: number, yRadius: number }), a Rectangle ({ width: number, height: number }) or a number.`,
    )
  })
})

describe('orientation', () => {
  test(`accepts Orientation, 'pointy' or 'flat'`, () => {
    expect(createHexPrototype({ orientation: Orientation.POINTY }).orientation).toBe(Orientation.POINTY)
    expect(createHexPrototype({ orientation: 'pointy' }).orientation).toBe(Orientation.POINTY)
    expect(createHexPrototype({ orientation: 'flat' }).orientation).toBe(Orientation.FLAT)
  })
})

describe('origin', () => {
  test('accepts a point', () => {
    const prototype = createHexPrototype({ origin: { x: 1, y: 2 } })
    expect(prototype.origin).toEqual({ x: 1, y: 2 })
  })

  test(`accepts 'topLeft'`, () => {
    const prototype = createHexPrototype({ origin: 'topLeft', dimensions: { width: 10, height: 10 } })
    expect(prototype.origin).toEqual({ x: -5, y: -5 })
  })

  test('accepts a function', () => {
    const callback = vi.fn(() => ({ x: 1, y: 2 }))
    const prototype = createHexPrototype({ origin: callback })

    expect(callback).toBeCalledWith(prototype)
    expect(prototype.origin).toEqual({ x: 1, y: 2 })
  })
})

// copied from internal type that Object.getOwnPropertyDescriptors() returns
type TypedPropertyDescriptors<T> = { [P in keyof T]: TypedPropertyDescriptor<T[P]> } | PropertyDescriptorMap
