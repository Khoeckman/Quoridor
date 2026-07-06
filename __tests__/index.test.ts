import { describe, it, expect, beforeEach } from 'vitest'
import Quoridor from '../src/index'
import type { Color, PlayerCount, Square, Barricade, Move, Player } from '../src/types'

const q2 = new Quoridor(2)
const q3 = new Quoridor(3)
const q4 = new Quoridor(4)

beforeEach(() => {
  q2.reset()
  q3.reset()
  q4.reset()
})

describe('Static helpers', () => {
  it('converts positions correctly (string to coordinate)', () => {
    expect(Quoridor.posToCoord('e1')).toEqual([0, 4])
    expect(Quoridor.posToCoord('e9')).toEqual([8, 4])

    expect(Quoridor.posToCoord('a1')).toEqual([0, 0])
    expect(Quoridor.posToCoord('a9')).toEqual([8, 0])
    expect(Quoridor.posToCoord('i1')).toEqual([0, 8])
    expect(Quoridor.posToCoord('i9')).toEqual([8, 8])
  })

  it('converts positions correctly (coordinate to string)', () => {
    expect(Quoridor.coordToPos([0, 4])).toEqual('e1')
    expect(Quoridor.coordToPos([8, 4])).toEqual('e9')

    expect(Quoridor.coordToPos([0, 0])).toEqual('a1')
    expect(Quoridor.coordToPos([8, 0])).toEqual('a9')
    expect(Quoridor.coordToPos([0, 8])).toEqual('i1')
    expect(Quoridor.coordToPos([8, 8])).toEqual('i9')
  })
})

describe('Initial values', () => {
  it('starts with correct defaults', () => {
    expect(q2.red.pos).toEqual(Quoridor.posToCoord('e1'))
    expect(q2.blue.pos).toEqual(Quoridor.posToCoord('e9'))

    expect(q2.red.barricades).toBe(10)
    expect(q2.blue.barricades).toBe(10)

    expect(q2.turnIdx).toBe(0)

    expect(q2.history.length).toBe(0)
    expect(q2.historyCursor).toBe(-1)
  })
})

describe('Getters & setters', () => {
  it('returns the correct values', () => {
    expect(q2.pgn).toBe('')
    expect(q2.turn).toBe('r')

    expect(q2.red).toEqual({ pos: [0, 4], barricades: 10 })
    expect(q2.blue).toEqual({ pos: [8, 4], barricades: 10 })

    expect(q3.red).toEqual({ pos: [0, 4], barricades: 5 })
    expect(q3.blue).toEqual({ pos: [8, 4], barricades: 5 })
    expect(q3.yellow).toEqual({ pos: [4, 0], barricades: 5 })

    expect(q4.red).toEqual({ pos: [0, 4], barricades: 5 })
    expect(q4.blue).toEqual({ pos: [8, 4], barricades: 5 })
    expect(q4.yellow).toEqual({ pos: [4, 0], barricades: 5 })
    expect(q4.green).toEqual({ pos: [4, 8], barricades: 5 })

    expect(() => q2.yellow).toThrow(Error)
    expect(() => q2.green).toThrow(Error)
    expect(() => q3.green).toThrow(Error)

    expect(q2.player).toBe(q2.red)
    expect(q3.player).toBe(q3.red)
    expect(q4.player).toBe(q4.red)
  })
})

describe('Portable Game Notation (PGN)', () => {
  it('initializes game state from PGN string', () => {
    const q = new Quoridor(2, '[PlayerCount "2"]\n\n1. e2 e7 2. e3 e6')
    expect(q.pgn).toBe('[PlayerCount "2"]\n\n1. e2 e7 2. e3 e6')
  })

  it('sets PGN correctly', () => {
    q2.pgn = 'some PGN string'
    expect(q2.pgn).toBe('some PGN string')
  })
})
