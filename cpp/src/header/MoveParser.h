#pragma once
#include "Move.h"

#include <string>

class MoveParser {
public:
  static Move fromString(const std::string &str);
  static std::string toString(const Move &move);

private:
  static int fileFromChar(char c);
  static int rankFromChar(char c);
};