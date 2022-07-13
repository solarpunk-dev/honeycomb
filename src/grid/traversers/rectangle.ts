import { Compass, CompassDirection } from '../../compass'
import { createHex, Hex, HexCoordinates, hexToOffset, OffsetCoordinates } from '../../hex'
import { isOffset, isTuple, tupleToCube } from '../../utils'
import { TraverserOptions } from '../types'
import { lineGenerator } from './line'

// todo: add in docs: only 90° corners for cardinal directions
// todo: when passed opposing corners:
//       maybe add option to determine if row or col is traversed first
//       maybe accept an object: { at, start, until, through }, similar to line()
// export function rectangle<T extends Hex>(options: RectangleOptions): Traverser<T, T[]>
// export function rectangle<T extends Hex>(
//   cornerA: HexCoordinates,
//   cornerB: HexCoordinates,
//   includeCornerA?: boolean,
// ): Traverser<T, T[]>
// export function rectangle<T extends Hex>(
//   optionsOrCornerA: RectangleOptions | HexCoordinates,
//   cornerB?: HexCoordinates,
//   includeCornerA = true,
// ): Traverser<T, T[]> {
//   return (cursor, createHex) => {
//     const {
//       width,
//       height,
//       start,
//       at,
//       direction = CompassDirection.E,
//     } = cornerB
//       ? optionsFromOpposingCorners(
//           optionsOrCornerA as HexCoordinates,
//           cornerB,
//           cursor.isPointy,
//           cursor.offset,
//           includeCornerA,
//         )
//       : (optionsOrCornerA as RectangleOptions)
//     const firstHex = start ? createHex(start) : at ? createHex(at) : cursor
//     const hexes = branch<T>(
//       line({ start: firstHex, direction: Compass.rotate(direction, 2), length: height - 1 }),
//       line({ direction, length: width - 1 }),
//     )(firstHex, createHex)

//     return start ? hexes : hexes.slice(1)
//   }
// }

export interface RectangleOptions extends TraverserOptions {
  width: number
  height: number
  direction?: CompassDirection
}

function optionsFromOpposingCorners(
  cornerA: HexCoordinates,
  cornerB: HexCoordinates,
  isPointy: boolean,
  offset: number,
  includeCornerA: boolean,
): RectangleOptions {
  const { col: cornerACol, row: cornerARow } = assertOffsetCoordinates(cornerA, isPointy, offset)
  const { col: cornerBCol, row: cornerBRow } = assertOffsetCoordinates(cornerB, isPointy, offset)
  const smallestCol = cornerACol < cornerBCol ? 'A' : 'B'
  const smallestRow = cornerARow < cornerBRow ? 'A' : 'B'
  const smallestColRow = (smallestCol + smallestRow) as keyof typeof RULES_FOR_SMALLEST_COL_ROW
  const { swapWidthHeight, direction } = RULES_FOR_SMALLEST_COL_ROW[smallestColRow]
  const width = Math.abs(cornerACol - cornerBCol) + 1
  const height = Math.abs(cornerARow - cornerBRow) + 1

  return {
    width: swapWidthHeight ? height : width,
    height: swapWidthHeight ? width : height,
    [includeCornerA ? 'start' : 'at']: cornerA,
    direction,
  }
}

function assertOffsetCoordinates(coordinates: HexCoordinates, isPointy: boolean, offset: number): OffsetCoordinates {
  if (isOffset(coordinates)) {
    return coordinates
  }
  const { q, r } = isTuple(coordinates) ? tupleToCube(coordinates) : coordinates
  return hexToOffset({ q, r, isPointy, offset })
}

const RULES_FOR_SMALLEST_COL_ROW = {
  AA: {
    swapWidthHeight: false,
    direction: CompassDirection.E,
  },
  AB: {
    swapWidthHeight: true,
    direction: CompassDirection.N,
  },
  BA: {
    swapWidthHeight: true,
    direction: CompassDirection.S,
  },
  BB: {
    swapWidthHeight: false,
    direction: CompassDirection.W,
  },
}

export function rectangleGenerator<T extends Hex>(
  hexPrototype: T,
  options: RectangleOptions,
): Generator<T, T | undefined, void>
export function rectangleGenerator<T extends Hex>(
  hexPrototype: T,
  cornerA: HexCoordinates,
  cornerB: HexCoordinates,
  includeCornerA?: boolean,
): Generator<T, T | undefined, void>
export function* rectangleGenerator<T extends Hex>(
  hexPrototype: T,
  optionsOrCornerA: RectangleOptions | HexCoordinates,
  cornerB?: HexCoordinates,
  includeCornerA = true,
): Generator<T, T | undefined, void> {
  const {
    width,
    height,
    start,
    at,
    direction = CompassDirection.E,
  } = cornerB
    ? optionsFromOpposingCorners(
        optionsOrCornerA as HexCoordinates,
        cornerB,
        hexPrototype.isPointy,
        hexPrototype.offset,
        includeCornerA,
      )
    : (optionsOrCornerA as RectangleOptions)
  const verticalLine = lineGenerator(hexPrototype, {
    start: createHex(hexPrototype, start ?? at),
    direction: Compass.rotate(direction, 2),
    length: height,
  })
  let lastHex: T | undefined

  for (const verticalHex of verticalLine) {
    lastHex = yield* lineGenerator(hexPrototype, { start: verticalHex, direction, length: width })
  }

  return lastHex
}

/**
 * This is the "old way" of creating rectangles. It's less performant (up until ~40x slower with 200x200 rectangles), but it's able to create
 * actual rectangles (with 90° corners) for the ordinal directions. But because I assume people mostly need rectangles in the cardinal directions,
 * I've decided to drop "true ordinal rectangle" support for now.
 */

// export const RECTANGLE_DIRECTIONS_POINTY = [
//   null, // ambiguous
//   ['q', 's', 'r'], // NE
//   ['q', 'r', 's'], // E
//   ['r', 'q', 's'], // SE
//   null, // ambiguous
//   ['r', 's', 'q'], // SW
//   ['s', 'r', 'q'], // W
//   ['s', 'q', 'r'], // NW
// ] as [keyof CubeCoordinates, keyof CubeCoordinates, keyof CubeCoordinates][]

// export const RECTANGLE_DIRECTIONS_FLAT = [
//   ['s', 'q', 'r'], // N
//   ['q', 's', 'r'], // NE
//   null,
//   ['q', 'r', 's'], // SE
//   ['r', 'q', 's'], // S
//   ['r', 's', 'q'], // SW
//   null,
//   ['s', 'r', 'q'], // NW
// ] as [keyof CubeCoordinates, keyof CubeCoordinates, keyof CubeCoordinates][]

// export const rectangle = <T extends Hex>(
//   hexPrototype: T,
//   {
//     width,
//     height,
//     start = { q: 0, r: 0 },
//     direction = hexPrototype.isPointy ? CompassDirection.E : CompassDirection.SE,
//   }: RectangleOptions,
// ) => {
//   const result: T[] = []
//   const _start: CubeCoordinates = { q: start.q, r: start.r, s: -start.q - start.r }
//   const [firstCoordinate, secondCoordinate, thirdCoordinate] = (hexPrototype.isPointy
//     ? RECTANGLE_DIRECTIONS_POINTY
//     : RECTANGLE_DIRECTIONS_FLAT)[direction]
//   const [firstStop, secondStop] = hexPrototype.isPointy ? [width, height] : [height, width]

//   for (let second = 0; second < secondStop; second++) {
//     // for (let second = 0; second > -secondStop; second--) {
//     const secondOffset = offsetFromZero(hexPrototype.offset, second)

//     for (let first = -secondOffset; first < firstStop - secondOffset; first++) {
//       const nextCoordinates = {
//         [firstCoordinate]: first + _start[firstCoordinate],
//         [secondCoordinate]: second + _start[secondCoordinate],
//         [thirdCoordinate]: -first - second + _start[thirdCoordinate],
//       } as unknown
//       result.push(createHex<T>(hexPrototype, nextCoordinates as CubeCoordinates))
//     }
//   }

//   return result
// }
