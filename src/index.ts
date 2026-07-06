import GameParser from './pgn'
import type { Color, PlayerCount, Square, Barricade, Move, Player } from './types'

export default class Quoridor {
  static readonly BOARD_SIZE = 9
  static readonly TURN_ORDER = 'rbyg'

  static posToCoord(pos: string): Square {
    const file = pos.charCodeAt(0) - 97
    const rank = parseInt(pos[1]) - 1
    return [rank, file]
  }

  static coordToPos(coord: Square): string {
    const [rank, file] = coord
    return String.fromCharCode(97 + file) + (rank + 1)
  }

  #pgn!: GameParser
  #player!: Record<Color, Player>

  playerCount: PlayerCount

  turnIdx: 0 | 1 | 2 | 3 = 0

  moves: Move[] = []
  barricades: Barricade[] = []

  history: Move[] = []
  historyCursor = -1

  constructor(playerCount: PlayerCount, pgn = '') {
    if (!(playerCount >= 2 && playerCount <= 4 && ~~playerCount === playerCount))
      throw RangeError('Player count must be 2, 3, or 4')
    this.playerCount = playerCount

    this.pgn = pgn
  }

  get pgn(): GameParser {
    return this.#pgn
  }

  set pgn(value: string | GameParser) {
    const pgn = String(value)

    if (String(this.#pgn) === pgn) {
      this.historyCursor = this.history.length - 1
      return
    }
    this.#pgn = new GameParser(pgn)
    this.reset()

    if (!value) return
    // Todo: parse PGN and set up game state accordingly
  }

  get turn(): Color {
    return Quoridor.TURN_ORDER[this.turnIdx] as Color
  }

  // Player getters
  get red(): Player {
    return this.#player.r
  }

  get blue(): Player {
    return this.#player.b
  }

  get yellow(): Player {
    if (this.playerCount < 3) throw Error('Yellow player only exists in a 3+ player game')
    return this.#player.y
  }

  get green(): Player {
    if (this.playerCount < 4) throw Error('Green player only exists in a 4-player game')
    return this.#player.g
  }

  // Current player getter
  get player(): Player {
    return this.#player[this.turn]
  }

  reset() {
    const barricades = this.playerCount === 2 ? 10 : 5

    this.#player = {} as Record<Color, Player>
    this.#player.r = { pos: [0, 4], barricades } // e1
    this.#player.b = { pos: [8, 4], barricades } // e9
    this.#player.y = { pos: [4, 0], barricades } // a5
    this.#player.g = { pos: [4, 8], barricades } // i5

    this.turnIdx = 0

    this.moves = []
    this.barricades = []

    this.history = []
    this.historyCursor = -1
  }
}
