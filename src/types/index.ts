export type Color = 'r' | 'b' | 'y' | 'g'
export type PlayerCount = 2 | 3 | 4

export type Square = [number, number]
export type Barricade = { color: Color; pos: Square }
export type Move = Square | Barricade

export type Player = { pos: Square; barricades: number }
