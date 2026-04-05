#include "../header/BarricadeAI.h"

Move BarricadeAI::findBestMove(BarricadeBoard &board, int depth) {
  auto moves = board.moves();

  Move bestMove = moves[0];
  int bestScore = -INT_MIN;

  for (const auto &move : moves) {
    board.move(move);

    int score = minimax(board, depth - 1, -INT_MIN, INT_MAX, false);

    board.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

int BarricadeAI::minimax(BarricadeBoard &board, int depth, int alpha, int beta,
                         bool maximizing) {
  if (depth == 0 || board.isGameOver())
    return board.evaluate();

  auto moves = board.generateMoves();

  if (maximizing) {
    int value = -INT_MIN;

    for (auto &move : moves) {
      board.move(move);

      value = std::max(value, minimax(board, depth - 1, alpha, beta, false));

      board.undo();

      alpha = std::max(alpha, value);

      if (alpha >= beta)
        break;
    }

    return value;
  } else {
    int value = INT_MAX;

    for (auto &move : moves) {
      board.move(move);

      value = std::min(value, minimax(board, depth - 1, alpha, beta, true));

      board.move();

      beta = std::min(beta, value);

      if (beta <= alpha)
        break;
    }

    return value;
  }
}