export type Color = 'r' | 'b'
export type Square = [number, number]
export type Player = { position: Square; barricades: number }
export type Barricade = { color: Color; position: Square }
export type Move = Square | Barricade

export default class Quoridor {
  static readonly BOARD_SIZE = 9

  static posToCoord(pos: string): Square {
    const file = pos.charCodeAt(0) - 97
    const rank = parseInt(pos[1]) - 1
    return [rank, file]
  }

  static coordToPos(coord: Square): string {
    const [rank, file] = coord
    return String.fromCharCode(97 + file) + (rank + 1)
  }

  red: Player = { position: [0, 4], barricades: 10 } // e1
  blue: Player = { position: [8, 4], barricades: 10 } // e9
  barricades: Barricade[] = []
  turn: Color = 'r'

  moves: Move[] = []

  directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  constructor() {
    this.#getLegalMoves()
  }

  get player() {
    return this.turn === 'r' ? this.red : this.blue
  }

  #getLegalMoves() {
    this.moves = []
  }

  move(move: Move) {
    if (Array.isArray(move)) {
      this.player.position = move
    } else {
      this.barricades.push(move)
      this.player.barricades--
    }
  }

  isGameOver(): Color | false {
    if (this.red.position[0] === Quoridor.BOARD_SIZE - 1) return 'r'
    if (this.blue.position[0] === 0) return 'b'
    return false
  }
}

const game = new Quoridor()

console.log(game)
