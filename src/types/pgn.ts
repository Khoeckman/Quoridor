export interface Move {
  move: string
  comment?: string
  variations?: Move[][]
}

export type Token =
  | { type: 'tag'; name: string; value: string }
  | { type: 'move'; value: string }
  | { type: 'comment'; value: string }
  | { type: 'variation-start' }
  | { type: 'variation-end' }
  | { type: 'result'; value: string }
  | { type: 'nag'; value: string }
  | { type: 'movenumber'; value: number; isBlack: boolean }

export interface Game {
  tags: Record<string, string>
  moves: Move[]
  result?: string
  error?: Error
}
