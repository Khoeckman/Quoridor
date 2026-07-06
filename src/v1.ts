export type BoardSize = 9
export type ColorMap = {
  2: 'r' | 'b'
  3: 'r' | 'b' | 'y'
  4: 'r' | 'b' | 'y' | 'g'
}
export type PlayerCount = keyof ColorMap
export type Color<P extends PlayerCount> = ColorMap[P]
export type Square = [number, number]
export type Player = { position: Square; barricades: number }
export type Barricade<P extends PlayerCount> = { color: Color<P>; position: Square }
export type Move<P extends PlayerCount> = Square | Barricade<P>

const directions = Object.freeze([
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
])

export default class Quoridor<P extends PlayerCount> {
  static readonly BOARD_SIZE: BoardSize = 9
  static readonly TURN_ORDER = 'rbyg'

  static posToCoord(pos: string): Square {
    const file = pos.charCodeAt(0) - 97
    const rank = parseInt(pos[1]) - 1
    return [rank, file]
  }

  static coordToPos(coord: Square) {
    const [rank, file] = coord
    return String.fromCharCode(97 + file) + (rank + 1)
  }

  static moveToString(move: Move<PlayerCount>): string {
    if (Array.isArray(move)) return Quoridor.coordToPos(move)

    const dir = move.position[0] % 2 === 0 ? 'h' : 'v'
    return `${move.color}${dir}${Math.floor(move.position[0] / 2) + 1}${Math.floor(move.position[1] / 2) + 1}`
  }

  static stringToMove<P extends PlayerCount>(str: string, players: P): Move<P> {
    if (str.length === 2) return Quoridor.posToCoord(str)
    Quoridor.assertValidColor<P>(str[0], players)

    const color = str[0]
    const dir = str[1]
    const row = parseInt(str[2]) - 1
    const col = parseInt(str[3]) - 1
    const pos: Square = dir === 'h' ? [row * 2, col * 2 + 1] : [row * 2 + 1, col * 2]
    return { color, position: pos }
  }

  static isValidColor<P extends PlayerCount>(color: string, players: P): color is Color<P> {
    const turnIdx = Quoridor.TURN_ORDER.indexOf(color)
    return turnIdx !== -1 && turnIdx < players
  }

  isValidColor(color: string, players: P): color is Color<P> {
    return Quoridor.isValidColor(color, players)
  }

  static assertValidColor<P extends PlayerCount>(color: string, players: P): asserts color is Color<P> {
    if (!Quoridor.isValidColor(color, players))
      throw new Error(`Color "${color}" is not one of: ${Quoridor.TURN_ORDER.split(', ')}`)
  }

  assertValidColor(color: string, players: P): asserts color is Color<P> {
    Quoridor.assertValidColor(color, players)
  }

  playerCount: P

  red!: Player
  blue!: Player
  yellow: Player | null = null // Only for 3 and 4-player variant
  green: Player | null = null // Only for 4-player variant

  barricades!: Barricade<P>[]
  turn!: Color<P>
  moves: Move<P>[] = []

  historyCursor: number = -1
  history: Move<P>[] = []

  constructor(playerCount: P, pgn: string = '') {
    this.playerCount = playerCount
    this.loadPgn(pgn)
  }

  /**
   * Getters & Setters
   */

  get player(): Player {
    switch (this.turn) {
      case 'r':
        return this.red
      case 'b':
        return this.blue
      case 'y':
        return this.yellow!
      case 'g':
        return this.green!
    }
  }

  /**
   * Turn
   */

  setTurn(turn: Color<P>) {
    Quoridor.assertValidColor<P>(turn, this.playerCount)
    this.turn = turn
  }

  nextTurn() {
    let turnIdx = Quoridor.TURN_ORDER.indexOf(this.turn)
    turnIdx++
    turnIdx %= this.playerCount
    this.turn = Quoridor.TURN_ORDER[turnIdx] as Color<P>
  }

  /**
   * Moves
   */

  buildPlayerMove(move: Move<P>): Move<P> {
    if (
      !Array.isArray(move) ||
      move.length !== 2 ||
      typeof move[0] !== 'number' ||
      typeof move[1] !== 'number' ||
      move[0] < 0 ||
      move[0] >= Quoridor.BOARD_SIZE ||
      move[1] < 0 ||
      move[1] >= Quoridor.BOARD_SIZE
    )
      throw new Error('Not a valid player move')
    return move
  }

  buildBarricadeMove(color: Color<P>, position: Square): Barricade<P> {
    return { color, position }
  }

  getPlayerMoves(): Square[] {
    this.red.position
    return []
  }

  getBarricadeMoves(): Barricade<P>[] {
    return []
  }

  // This result should be cached and updated incrementally
  // Problem: Getting all legal moves is expensive, and might not be requested.
  // Solution: Don't calculate legal moves until requested
  getLegalMoves(): Move<P>[] {
    if (this.moves.length > 0) return this.moves

    // Step 2A: If not cached, calculate legal moves and store in cache
    const moves: Move<P>[] = this.getPlayerMoves()
    moves.push(...this.getBarricadeMoves())
    this.moves = moves
    return moves
  }

  isLegalMove(move: Move<P>): boolean {
    // Check is getLegalMoves() is cached
    // If not, calculate only if 'move' is legal
    move
    return false
  }

  move(move: Move<P>, legalOnly = true): void {
    if (legalOnly) {
      if (!this.isLegalMove(move)) throw new Error('Illegal move')
    }

    if (Array.isArray(move)) {
      this.player.position = move
    } else {
      this.barricades.push(move)
      this.player.barricades--
    }
    this.nextTurn()
  }

  undo(moves: number = 1) {
    // Nothing more to undo
    if (this.historyCursor === -1) return

    for (let i = 0; i < moves; i++) {
      const moveToUndo = this.history[this.historyCursor--]
    }
  }

  redo(moves: number = 1) {
    // Nothing to redo
    if (this.historyCursor >= this.history.length - 1) return

    for (let i = 0; i < moves; i++) {
      const move = this.moves.shift()
      if (!move) break
    }
  }

  /**
   * Game state
   */

  isGameOver(): Color<P> | false {
    if (this.red.position[0] === Quoridor.BOARD_SIZE - 1) return 'r'
    if (this.blue.position[0] === 0) return 'b'
    if (this.yellow && this.yellow.position[1] === 0) return 'y' as Color<P>
    if (this.green && this.green.position[1] === Quoridor.BOARD_SIZE - 1) return 'g' as Color<P>
    return false
  }

  reset() {
    this.red = { position: [0, 4], barricades: 10 } // e1
    this.blue = { position: [8, 4], barricades: 10 } // e9
    this.yellow = this.playerCount >= 3 ? { position: [4, 0], barricades: 10 } : null // a5
    this.green = this.playerCount === 4 ? { position: [4, 8], barricades: 10 } : null // i5

    this.barricades = []
    this.turn = 'r'

    this.history = []
  }

  /**
   * Import & Export
   */

  pgn(): string {
    // TODO: Implement PGN generation
    return ''
  }

  loadPgn(pgn: string): void {
    this.reset()
    if (!pgn) return

    // TODO: Implement PGN parsing
    return
  }
}
