#pragma once
#include "Types.h"

struct Move {
public:
  enum class Type { PawnMove, WallPlacement };

  Type type;

  int file;
  int rank;

  Direction direction;
  WallOrientation orientation;

  static Move pawn(Direction dir);
  static Move wall(int file, int rank, WallOrientation orientation);
};