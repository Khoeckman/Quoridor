import Quoridor, { type Color } from './Quoridor'

interface Player {
  player: Element
  name: Element
  barricades: Element
}

export default class BarricadeBoard {
  game = new Quoridor()
  board: Element
  red: Player
  blue: Player

  constructor(board: Element, red: Player, blue: Player) {
    if (!(board instanceof Element)) throw new TypeError('board is not a Element')
    this.board = board

    if (
      !red ||
      !(red.player instanceof Element) ||
      !(red.name instanceof Element) ||
      !(red.barricades instanceof Element)
    )
      throw new TypeError('red is not a Player')
    this.red = red

    if (
      !blue ||
      !(blue.player instanceof Element) ||
      !(blue.name instanceof Element) ||
      !(blue.barricades instanceof Element)
    )
      throw new TypeError('blue is not a Player')
    this.blue = blue

    this.createBoard()
    this.updateTurn()
    this.updateBarricadeCount()
  }

  createBoard() {
    const size = Quoridor.BOARD_SIZE
    this.board.innerHTML = ''

    for (let rank = 0; rank < size; rank++) {
      for (let file = 0; file < size; file++) {
        const square = document.createElement('div')
        square.classList.add('square')
        if (file % 2) square.classList.add('square', 'player', 'blue')
        else if (file ^ rank && rank % 2) square.classList.add('square', 'player', 'red')
        else if (!(file % 2) && rank > 4) square.classList.add('square', 'move', 'blue')
        else if (!(file ^ rank)) square.classList.add('square', 'move', 'red')
        square.dataset.rank = rank.toString()
        square.dataset.file = file.toString()

        this.board.appendChild(square)
      }
    }
  }

  updatePlayer(color: Color) {
    this.board.querySelectorAll('.player').forEach((player) => player.remove())
  }

  updateTurn(player = this.game.turn) {
    if (player === 'r') {
      this.red.player.classList.add('active')
      this.blue.player.classList.remove('active')
    } else {
      this.red.player.classList.remove('active')
      this.blue.player.classList.add('active')
    }
  }

  updateBarricadeCount() {
    const { game, red, blue } = this

    red.barricades.textContent = game.red.barricades.toString()
    blue.barricades.textContent = game.blue.barricades.toString()
  }
}
