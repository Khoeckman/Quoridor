import BarricadeGame, { type Color } from './Quoridor'

export class Minimax {
  maxDepth: number

  constructor({ maxDepth = 3 } = {}) {
    this.maxDepth = maxDepth
  }

  evaluate(game: BarricadeGame, player: Color) {
    return 0
  }

  findBestMove(game: BarricadeGame, player: Color) {
    let bestScore = -Infinity
    let bestMove = null

    const moves = game.moves(player)

    for (const move of moves) {
      const nextState = game.clone()
      nextState.move(move)

      const score = this.#minimax(nextState, this.maxDepth - 1, false, player)

      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }

  #minimax(game: BarricadeGame, depth: number, maximizingPlayer: boolean, rootPlayer: Color) {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluate(game, rootPlayer)
    }

    const currentPlayer = maximizingPlayer ? rootPlayer : state.getOpponent(rootPlayer)

    const moves = state.moves(currentPlayer)

    if (maximizingPlayer) {
      let bestScore = -Infinity

      for (const move of moves) {
        const nextState = state.clone()
        nextState.move(move)

        const score = this.#minimax(nextState, depth - 1, false, rootPlayer)

        bestScore = Math.max(bestScore, score)
      }

      return bestScore
    } else {
      let bestScore = Infinity

      for (const move of moves) {
        const nextState = state.clone()
        nextState.move(move)

        const score = this.#minimax(nextState, depth - 1, true, rootPlayer)

        bestScore = Math.min(bestScore, score)
      }

      return bestScore
    }
  }
}
