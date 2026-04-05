#pragma once
#include "Move.h"
#include "Types.h"

#include <std>
#include <vector>

class BarricadeAI {
public:
  Move findBestMove(BarricadeBoard &board, int depth);

private:
  int evaluate(BarricadeBoard &board);

  int minimax(BarricadeBoard &board, int depth, int alpha, int beta,
              bool maximizing);
};

class BarricadeBoard : BarricadeAI {
public:
  static constexpr char8_t BOARD_SIZE = 9;
  static constexpr char8_t MAX_WALLS = 10;

  BarricadeBoard();

  Player turn() const;

  bool move(const Move &move);
  void undo();

  std::vector<Move> generateMoves() const;

  bool isLegalMove(const Move &move) const;

  bool isGameOver() const;
  Player winner() const;
  int distanceToGoal(Player player) const;

private:
  struct Player {
    uint8_t file;
    uint8_t rank;
  };

  Player red{std::floor(BOARD_SIZE / 2), 1};
  Player blue{std::floor(BOARD_SIZE / 2), BOARD_SIZE};

  uint8_t redBarricades;
  uint8_t blueBarricades;

  Player turn;

  bool horizontalWalls[8][9];
  bool verticalWalls[9][8];

  struct History {
    Move move;
    Player red;
    Player blue;
    int redWalls;
    int blueWalls;
  };

  std::vector<History> history;

  bool canMove(int file, int rank, Direction dir) const;

  bool pathExists(Player player) const;

  int bfsShortestPath(Player player) const;
};