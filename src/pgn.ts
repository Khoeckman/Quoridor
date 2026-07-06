import type { Game, Move, Token } from './types/pgn'

export default class GameParser {
  #pgn = ''
  #valid = false
  #results: Set<string>
  #delimiters = new Set(['[', ']', '{', '}', '(', ')'])

  games: Game[] = []
  error?: Error

  constructor(pgn: string = '', results: Set<string> = new Set(['1-0', '0-1', '1/2-1/2', '*'])) {
    this.#results = results
    this.pgn = pgn
  }

  get pgn(): string {
    return this.#pgn
  }

  set pgn(value: string) {
    if (typeof value !== 'string') throw TypeError('PGN must be a string')

    this.#pgn = value
    this.#valid = false
    this.games = []
    this.error = undefined

    try {
      this.#parseDatabase(value)
      this.#valid = true
    } catch (inError) {
      this.error = inError instanceof Error ? inError : new Error(String(inError))
    }
  }

  isValid(): boolean {
    return this.#valid
  }

  toString(): string {
    return this.#pgn
  }

  #parseDatabase(pgn: string): void {
    let i = 0

    while (i < pgn.length) {
      i = this.#skipWhitespaceAndEscape(pgn, i)

      if (i >= pgn.length) return

      const tokens: Token[] = []
      let inMovetext = false

      while (i < pgn.length) {
        i = this.#skipWhitespaceAndEscape(pgn, i)

        if (i >= pgn.length) break

        const char = pgn[i]

        if (char === '[' && !inMovetext) {
          i = this.#tokenizeTag(pgn, i, tokens)
        } else if (char === '[' && inMovetext) {
          break
        } else {
          inMovetext = true
          const nextI = this.#tokenizeMovetext(pgn, i, tokens)
          if (nextI === i) break
          i = nextI
        }
      }

      if (tokens.length > 0) {
        const game = this.#parseGame(tokens)
        this.games.push(game)
      }
    }
  }

  #skipWhitespaceAndEscape(pgn: string, start: number): number {
    let i = start

    while (i < pgn.length) {
      if (/\s/.test(pgn[i])) {
        i++
      } else if (pgn[i] === '%') {
        const newline = pgn.indexOf('\n', i)
        i = newline === -1 ? pgn.length : newline + 1
      } else {
        break
      }
    }

    return i
  }

  #tokenizeTag(pgn: string, start: number, ioTokens: Token[]): number {
    const end = pgn.indexOf(']', start)

    if (end === -1) throw SyntaxError('Unclosed tag')

    const raw = pgn.slice(start + 1, end).trim()
    const match = raw.match(/^([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"$/)

    if (!match) throw SyntaxError(`Invalid tag: ${raw}`)

    const value = this.#unescapeString(match[2])

    ioTokens.push({
      type: 'tag',
      name: match[1],
      value: value,
    })

    return end + 1
  }

  #unescapeString(str: string): string {
    let result = ''
    let i = 0

    while (i < str.length) {
      if (str[i] === '\\' && i + 1 < str.length) {
        result += str[i + 1]
        i += 2
      } else {
        result += str[i]
        i++
      }
    }

    return result
  }

  #tokenizeMovetext(pgn: string, start: number, ioTokens: Token[]): number {
    const char = pgn[start]

    if (char === '{') {
      const end = pgn.indexOf('}', start)
      if (end === -1) throw SyntaxError('Unclosed comment')

      ioTokens.push({
        type: 'comment',
        value: pgn.slice(start + 1, end).trim(),
      })

      return end + 1
    }

    if (char === ';') {
      const end = pgn.indexOf('\n', start)
      ioTokens.push({
        type: 'comment',
        value: pgn.slice(start + 1, end === -1 ? pgn.length : end).trim(),
      })

      return end === -1 ? pgn.length : end
    }

    if (char === '(') {
      ioTokens.push({ type: 'variation-start' })
      return start + 1
    }

    if (char === ')') {
      ioTokens.push({ type: 'variation-end' })
      return start + 1
    }

    let end = start
    while (end < pgn.length && !/\s/.test(pgn[end]) && !this.#delimiters.has(pgn[end])) end++

    const raw = pgn.slice(start, end)
    this.#tokenizeSymbol(raw, ioTokens)

    return end
  }

  #tokenizeSymbol(raw: string, ioTokens: Token[]): void {
    const moveNumberMatch = raw.match(/^(\d+)\.+$/)
    if (moveNumberMatch) {
      const moveNum = parseInt(moveNumberMatch[1], 10)
      const isBlack = raw.includes('...')
      ioTokens.push({ type: 'movenumber', value: moveNum, isBlack })
      return
    }

    if (/^\$[0-9]+$/.test(raw)) {
      ioTokens.push({ type: 'nag', value: raw })
    } else if (this.#results.has(raw)) {
      ioTokens.push({ type: 'result', value: raw })
    } else {
      ioTokens.push({ type: 'move', value: raw })
    }
  }

  #parseGame(tokens: Token[]): Game {
    const game: Game = {
      tags: {},
      moves: [],
      result: undefined,
      error: undefined,
    }

    const root: Move[] = []
    const stack: Move[][] = [root]
    let lastMove: Move | undefined
    let expectedNextMoveNumber: number | undefined

    for (const token of tokens) {
      const current = stack.at(-1)

      if (!current) {
        const err = Error('Parser stack corruption')
        game.error = err
        throw err
      }

      switch (token.type) {
        case 'tag':
          game.tags[token.name] = token.value
          break

        case 'movenumber':
          if (!token.isBlack) {
            if (expectedNextMoveNumber !== undefined && token.value !== expectedNextMoveNumber) {
              const err = Error(`Invalid move number: expected ${expectedNextMoveNumber}, got ${token.value}`)
              game.error = err
              throw err
            }
            expectedNextMoveNumber = token.value + 1
          }
          break

        case 'move': {
          const move: Move = { move: token.value }
          current.push(move)
          lastMove = move

          if (expectedNextMoveNumber === undefined) expectedNextMoveNumber = 1

          break
        }

        case 'comment':
          if (lastMove) lastMove.comment = lastMove.comment ? `${lastMove.comment}\n${token.value}` : token.value
          break

        case 'nag':
          if (lastMove) lastMove.comment = lastMove.comment ? `${lastMove.comment} ${token.value}` : token.value
          break

        case 'variation-start':
          if (!lastMove) {
            const err = SyntaxError('Variation without previous move')
            game.error = err
            throw err
          }

          lastMove.variations ??= []
          const variation: Move[] = []
          lastMove.variations.push(variation)
          stack.push(variation)
          lastMove = undefined
          expectedNextMoveNumber = undefined
          break

        case 'variation-end':
          if (stack.length === 1) {
            const err = SyntaxError('Unexpected variation end')
            game.error = err
            throw err
          }

          stack.pop()
          lastMove = stack.at(-1)?.at(-1)
          expectedNextMoveNumber = undefined
          break

        case 'result':
          game.result = token.value
          break
      }
    }

    if (stack.length !== 1) {
      const err = SyntaxError('Unclosed variation')
      game.error = err
      throw err
    }

    if (game.result && game.tags['Result'] && game.result !== game.tags['Result']) {
      const err = Error(
        `Result mismatch: Result tag is "${game.tags['Result']}" but movetext ends with "${game.result}"`
      )
      game.error = err
      throw err
    }

    game.moves = root

    return game
  }
}
