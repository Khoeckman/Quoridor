import { describe, it, expect, beforeEach } from 'vitest'
import Quoridor, { type Color, Barricade } from '../src/v1'

const q = new Quoridor(2)
console.log(q)

beforeEach(() => {
  q.reset()
})

describe('Initial values', () => {
  it('starts with correct defaults', () => {
    expect(q.red.position).toEqual([0, 4])
    expect(q.blue.position).toEqual([8, 4])

    expect(q.red.barricades).toBe(10)
    expect(q.blue.barricades).toBe(10)

    expect(q.turn).toBe('r')
    expect(q.history.length).toBe(0)
  })
})

describe('Turn system', () => {
  it('toggles turn after each move', () => {
    q.move([1, 4])
    expect(q.turn).toBe('b')

    q.move([7, 4])
    expect(q.turn).toBe('r')
  })

  it('setTurn validates input', () => {
    expect(() => q.setTurn('r')).not.toThrow()
    expect(() => q.setTurn('b')).not.toThrow()

    // @ts-expect-error
    expect(() => q.setTurn('x')).toThrow()
  })
})

describe('Basic movement', () => {
  it('moves a player to a valid adjacent square', () => {
    q.move([1, 4])
    expect(q.red.position).toEqual([1, 4])
  })

  it('rejects moves outside the board', () => {
    expect(() => q.move([-1, 4])).toThrow()
    expect(() => q.move([9, 4])).toThrow()
  })

  it('rejects non-adjacent moves', () => {
    expect(() => q.move([3, 4])).toThrow()
  })
})

describe('Player interaction (jumping)', () => {
  it('allows jumping over opponent when adjacent', () => {
    q.red.position = [4, 4]
    q.blue.position = [5, 4]

    q.move([6, 4]) // jump

    expect(q.red.position).toEqual([6, 4])
  })

  it('allows diagonal move when blocked behind opponent', () => {
    q.red.position = [4, 4]
    q.blue.position = [5, 4]

    q.barricades.push({ color: 'r', position: [5, 4] })

    q.move([5, 5]) // diagonal

    expect(q.red.position).toEqual([5, 5])
  })
})

describe('Barricades', () => {
  it('places a barricade and reduces count', () => {
    const barricade: Barricade<typeof q.playerCount> = { color: 'r', position: [1, 1] }

    // q.makeBarricade()

    q.move(barricade)

    expect(q.barricades.length).toBe(1)
    expect(q.red.barricades).toBe(9)
  })

  it('prevents placing barricade when none left', () => {
    q.red.barricades = 0

    expect(() => q.move({ color: 'r', position: [1, 1] })).toThrow()
  })

  it('prevents overlapping barricades', () => {
    const b: Barricade<typeof q.playerCount> = { color: 'r', position: [1, 1] }

    q.move(b)

    expect(() => q.move(b)).toThrow()
  })
})

describe('Path validation (core rule)', () => {
  it('does not allow blocking all paths to goal', () => {
    // You’ll need pathfinding for this (BFS/DFS)
    expect(() => {
      q.move({ color: 'r', position: [1, 4] })
      q.move({ color: 'b', position: [2, 4] })
      // ...continue until path is blocked
    }).toThrow()
  })
})

describe('Game over detection', () => {
  it('detects red win', () => {
    q.red.position = [8, 4]

    expect(q.isGameOver()).toBe('r')
  })

  it('detects blue win', () => {
    q.blue.position = [0, 4]

    expect(q.isGameOver()).toBe('b')
  })

  it('returns false if game not over', () => {
    expect(q.isGameOver()).toBe(false)
  })
})

describe('History tracking', () => {
  it('stores moves in history', () => {
    q.move([1, 4])
    q.move([7, 4])

    expect(q.history.length).toBe(2)
  })

  it('can undo last move (if implemented)', () => {
    q.move([1, 4])
    // q.undo()

    // expect(q.red.position).toEqual([0, 4])
    // expect(q.turn).toBe('r')
  })
})

describe('Coordinate conversion', () => {
  it('converts pos to coord', () => {
    expect(Quoridor.posToCoord('e1')).toEqual([0, 4])
    expect(Quoridor.posToCoord('a9')).toEqual([8, 0])
  })

  it('converts coord to pos', () => {
    expect(Quoridor.coordToPos([0, 4])).toBe('e1')
    expect(Quoridor.coordToPos([8, 0])).toBe('a9')
  })
})

describe('PGN import/export', () => {
  it('exports game to PGN string', () => {
    q.move([1, 4])

    const pgn = q.pgn()

    expect(typeof pgn).toBe('string')
  })

  it('loads game from PGN string', () => {
    const pgn = 'e2 e8'

    q.loadPgn(pgn)

    expect(q.history.length).toBeGreaterThan(0)
  })
})
