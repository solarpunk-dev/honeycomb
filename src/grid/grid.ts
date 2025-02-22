import { AxialCoordinates, defineHex, Hex, HexConstructor, HexCoordinates, Point, pointToCube } from '../hex'
import { isFunction } from '../utils'
import { distance, neighborOf } from './functions'
import { concat } from './traversers'
import { Direction, GridAsJSON, HexIterable, HexTraversable, Traverser } from './types'

export class Grid<T extends Hex> implements HexIterable<T>, HexTraversable<T> {
  static fromIterable<T extends Hex>(hexes: Iterable<T>): Grid<T> {
    const firstHex = hexes[Symbol.iterator]().next().value as T | undefined

    if (!firstHex) {
      throw new TypeError(`Can't create grid from empty iterable: ${JSON.stringify(hexes)}`)
    }

    return new Grid(firstHex.constructor as HexConstructor<T>, hexes)
  }

  static fromJSON<T extends AxialCoordinates, R extends Hex>(
    { hexSettings, coordinates }: GridAsJSON<T>,
    hexFactory?: (coordinates: T, index: number, allCoordinates: T[]) => R,
  ): Grid<R> {
    if (hexFactory) {
      const hexes = coordinates.map(hexFactory)
      // get the constructor from calling the hex factory; if instead `defineHex(hexSettings)` is used to get the constructor,
      // the constructor will be an anonymous function (constructor.name will be '') and getHex() won't work
      const HexClass = (
        hexes.length > 0
          ? hexes[0].constructor
          : hexFactory({ q: 0, r: 0 } as T, 0, [{ q: 0, r: 0 }] as T[]).constructor
      ) as HexConstructor<R>
      return new Grid<R>(HexClass, hexes)
    }

    const HexClass = defineHex(hexSettings) as unknown as HexConstructor<R>
    return new Grid<R>(
      HexClass,
      coordinates.map((coordinates) => new HexClass(coordinates)),
    )
  }

  get size(): number {
    return this.#hexes.size
  }

  get pixelWidth(): number {
    if (this.size === 0) return 0

    const { isPointy, width } = this.hexPrototype
    const hexes = this.toArray()
    // sort hexes from left to right and take the first and last
    const {
      0: mostLeft,
      length,
      [length - 1]: mostRight,
    } = isPointy ? hexes.sort((a, b) => b.s - a.s || a.q - b.q) : hexes.sort((a, b) => a.q - b.q)

    return mostRight.x - mostLeft.x + width
  }

  get pixelHeight(): number {
    if (this.size === 0) return 0

    const { isPointy, height } = this.hexPrototype
    const hexes = this.toArray()
    // sort hexes from left to right and take the first and last
    const {
      0: mostTop,
      length,
      [length - 1]: mostBottom,
    } = isPointy ? hexes.sort((a, b) => a.r - b.r) : hexes.sort((a, b) => b.s - a.s || a.r - b.r)

    return mostBottom.y - mostTop.y + height
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.#hexes.values()
  }

  get hexPrototype(): T {
    return this.#hexClass.prototype as T
  }

  readonly #hexClass: HexConstructor<T>

  #hexes = new Map<string, T>()

  constructor(hexClass: HexConstructor<T>)
  constructor(hexClass: HexConstructor<T>, traversers: Traverser<T> | Traverser<T>[])
  constructor(hexClass: HexConstructor<T>, hexes: Iterable<T | HexCoordinates>)
  constructor(grid: Grid<T>)
  constructor(
    hexClassOrGrid: HexConstructor<T> | Grid<T>,
    input: Traverser<T> | Traverser<T>[] | Iterable<T | HexCoordinates> = [],
  ) {
    if (hexClassOrGrid instanceof Grid) {
      this.#hexClass = hexClassOrGrid.#hexClass
      this.setHexes(hexClassOrGrid)
      return
    }

    this.#hexClass = hexClassOrGrid
    this.setHexes(this.#createHexesFromIterableOrTraversers(input))
  }

  createHex(coordinates?: HexCoordinates): T {
    return new this.#hexClass(coordinates)
  }

  getHex(coordinates: HexCoordinates): T | undefined {
    const hex = this.createHex(coordinates)
    return this.#hexes.get(hex.toString())
  }

  hasHex(hex: T): boolean {
    return this.#hexes.has(hex.toString())
  }

  setHexes(hexesOrCoordinates: Iterable<T | HexCoordinates>): this {
    for (const hexOrCoordinates of hexesOrCoordinates) {
      const hex = hexOrCoordinates instanceof Hex ? hexOrCoordinates : new this.#hexClass(hexOrCoordinates)
      this.#setHex(hex)
    }
    return this
  }

  filter(predicate: (hex: T) => boolean): Grid<T> {
    const result = new Grid(this.#hexClass)

    for (const hex of this) {
      if (predicate(hex)) result.#setHex(hex)
    }

    return result
  }

  map(fn: (hex: T) => T): Grid<T> {
    const result = new Grid(this.#hexClass)

    for (const hex of this) {
      result.#setHex(fn(hex))
    }

    return result
  }

  traverse(traversers: Traverser<T> | Traverser<T>[], options?: { bail?: boolean }): Grid<T>
  traverse(hexes: Iterable<T | HexCoordinates>, options?: { bail?: boolean }): Grid<T>
  traverse(grid: Grid<T>, options?: { bail?: boolean }): Grid<T>
  traverse(
    input: Traverser<T> | Traverser<T>[] | Iterable<T | HexCoordinates> | Grid<T>,
    { bail = false } = {},
  ): Grid<T> {
    const result = new Grid(this.#hexClass)

    for (const hex of this.#createHexesFromIterableOrTraversers(input)) {
      const foundHex = this.getHex(hex)
      if (foundHex) {
        result.#setHex(foundHex)
      } else if (bail) {
        return result
      }
    }

    return result
  }

  forEach(fn: (hex: T) => void): this {
    for (const hex of this) {
      fn(hex)
    }
    return this
  }

  reduce(reducer: (previousHex: T, currentHex: T) => T): T
  reduce(reducer: (previousHex: T, currentHex: T) => T, initialValue: T): T
  reduce<R>(reducer: (result: R, hex: T) => R, initialValue: R): R
  reduce<R>(reducer: (result: T | R, hex: T) => T | R, initialValue?: T | R): T | R {
    if (initialValue === undefined) {
      let result!: T, previousHex!: T, currentHex!: T
      for (const hex of this) {
        previousHex = currentHex
        currentHex = hex
        if (!previousHex) continue
        result = reducer(previousHex, currentHex) as T
      }
      return result
    }

    let result: T | R = initialValue
    for (const hex of this) {
      result = reducer(result, hex)
    }
    return result
  }

  toArray(): T[] {
    return Array.from(this)
  }

  // todo: add to docs that hexSettings don't include any custom properties
  toJSON(): GridAsJSON<T> {
    // these four properties are getters that may be present further up the prototype chain
    // JSON.stringify() ignores properties in the prototype chain
    const { dimensions, orientation, origin, offset } = this.hexPrototype
    return { hexSettings: { dimensions, orientation, origin, offset }, coordinates: this.toArray() }
  }

  toString(): string {
    return `${this.constructor.name}(${this.size})`
  }

  pointToHex(point: Point, options?: { allowOutside: true }): T
  pointToHex(point: Point, options: { allowOutside: false }): T | undefined
  pointToHex(point: Point, { allowOutside = true } = {}): T | undefined {
    const coordinates = pointToCube(this.hexPrototype, point)
    const foundHex = this.getHex(coordinates)

    return allowOutside ? foundHex ?? this.createHex(coordinates) : foundHex
  }

  distance(from: HexCoordinates, to: HexCoordinates, options?: { allowOutside: true }): number
  distance(from: HexCoordinates, to: HexCoordinates, options: { allowOutside: false }): number | undefined
  distance(from: HexCoordinates, to: HexCoordinates, { allowOutside = true } = {}): number | undefined {
    if (allowOutside) return distance(this.hexPrototype, from, to)

    const fromHex = this.getHex(from)
    const toHex = this.getHex(to)
    if (!fromHex || !toHex) return

    return distance(this.hexPrototype, fromHex, toHex)
  }

  neighborOf(coordinates: HexCoordinates, direction: Direction, options?: { allowOutside: true }): T
  neighborOf(coordinates: HexCoordinates, direction: Direction, options: { allowOutside: false }): T | undefined
  neighborOf(coordinates: HexCoordinates, direction: Direction, { allowOutside = true } = {}): T | undefined {
    const neighbor = neighborOf(this.createHex(coordinates), direction)
    const foundHex = this.getHex(neighbor)

    return allowOutside ? foundHex ?? neighbor : foundHex
  }

  #setHex(hex: T): void {
    this.#hexes.set(hex.toString(), hex)
  }

  #createHexesFromIterableOrTraversers(
    input: Traverser<T> | Traverser<T>[] | Iterable<T | HexCoordinates>,
  ): Iterable<T | HexCoordinates> {
    return this.#isTraverser(input)
      ? this.#callTraverser(input)
      : Array.isArray(input) && this.#isTraverser(input[0])
      ? this.#callTraverser(concat(input))
      : (input as Iterable<T | HexCoordinates>)
  }

  #isTraverser(value: unknown): value is Traverser<T> {
    return isFunction<Traverser<T>>(value)
  }

  #callTraverser(traverser: Traverser<T>): Iterable<T> {
    return traverser(this.createHex.bind(this))
  }
}
