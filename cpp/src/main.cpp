#include <emscripten/bind.h>

int add(int a, int b) { return a + b; }

EMSCRIPTEN_BINDINGS(module) { emscripten::function("add", &add); }