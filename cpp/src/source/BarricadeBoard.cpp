#include "../header/BarricadeBoard.h"

int BarricadeBoard::evaluate() const {
  int red = shortestPath(Player::Red);
  int blue = shortestPath(Player::Blue);

  if (turn == Player::Red)
    return blue - red;

  return red - blue;
}