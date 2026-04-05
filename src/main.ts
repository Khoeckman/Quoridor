import BarricadeBoard from './board'
import type { Color } from './Quoridor'

const board = document.getElementById('board')!
const red = {
  player: document.getElementById('red-player')!,
  name: document.getElementById('red-name')!,
  barricades: document.getElementById('red-barricades')!,
}

const blue = {
  player: document.getElementById('blue-player')!,
  name: document.getElementById('blue-name')!,
  barricades: document.getElementById('blue-barricades')!,
}

const bb = new BarricadeBoard(board, red, blue)
export default bb
