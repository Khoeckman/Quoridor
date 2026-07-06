import { describe, it, expect } from 'vitest'
import GameParser from '../src/pgn'

describe('GameParser', () => {
  describe('basic construction', () => {
    it('constructs with empty string', () => {
      const parser = new GameParser('')
      expect(parser.games).toHaveLength(0)
      expect(parser.isValid()).toBe(true)
      expect(parser.error).toBeUndefined()
    })

    it('constructs with undefined pgn', () => {
      const parser = new GameParser()
      expect(parser.games).toHaveLength(0)
      expect(parser.isValid()).toBe(true)
    })

    it('throws on non-string pgn input', () => {
      expect(() => {
        const parser = new GameParser()
        // @ts-ignore - intentional type violation for testing
        parser.pgn = 123
      }).toThrow(TypeError)
    })

    it('accepts custom result set', () => {
      const customResults = new Set(['win', 'loss', 'draw'])
      const parser = new GameParser('1. win', customResults)
      expect(parser.games).toHaveLength(1)
      expect(parser.games[0].result).toBe('win')
    })
  })

  describe('single game parsing', () => {
    it('parses minimal game with just tags', () => {
      const pgn = '[Event "Test"]\n[Result "1-0"]'
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(1)
      expect(parser.games[0].tags['Event']).toBe('Test')
      expect(parser.games[0].tags['Result']).toBe('1-0')
    })

    it('parses game with moves', () => {
      const pgn = '[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0'
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(1)
      expect(parser.games[0].moves).toHaveLength(3)
      expect(parser.games[0].moves[0].move).toBe('e4')
      expect(parser.games[0].moves[1].move).toBe('e5')
      expect(parser.games[0].result).toBe('1-0')
    })

    it('parses game without move numbers', () => {
      const pgn = '[Result "*"]\n\ne4 e5 Nf3 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves).toHaveLength(3)
      expect(parser.games[0].moves[0].move).toBe('e4')
    })

    it('parses custom moves for non-chess games', () => {
      const pgn = '[Event "Checkers"]\n\n1. some random 2. values yes *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves).toHaveLength(4)
      expect(parser.games[0].moves[0].move).toBe('some')
      expect(parser.games[0].moves[1].move).toBe('random')
      expect(parser.games[0].moves[2].move).toBe('values')
      expect(parser.games[0].moves[3].move).toBe('yes')
    })
  })

  describe('tags', () => {
    it('parses standard seven-tag roster', () => {
      const pgn = `[Event "Test Event"]
[Site "Earth"]
[Date "2024.01.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "1/2-1/2"]

1/2-1/2`
      const parser = new GameParser(pgn)
      const game = parser.games[0]

      expect(game.tags['Event']).toBe('Test Event')
      expect(game.tags['Site']).toBe('Earth')
      expect(game.tags['Date']).toBe('2024.01.01')
      expect(game.tags['Round']).toBe('1')
      expect(game.tags['White']).toBe('Player A')
      expect(game.tags['Black']).toBe('Player B')
      expect(game.tags['Result']).toBe('1/2-1/2')
    })

    it('parses supplemental tags', () => {
      const pgn = `[Event "Test"]
[WhiteElo "2600"]
[BlackElo "2500"]
[TimeControl "40/5400"]

*`
      const parser = new GameParser(pgn)
      const game = parser.games[0]

      expect(game.tags['WhiteElo']).toBe('2600')
      expect(game.tags['BlackElo']).toBe('2500')
      expect(game.tags['TimeControl']).toBe('40/5400')
    })

    it('handles escaped quotes in tag values', () => {
      const pgn = '[Event "He said \\"Hello\\" to me"]\n\n*'
      const parser = new GameParser(pgn)

      expect(parser.games[0].tags['Event']).toBe('He said "Hello" to me')
    })

    it('handles escaped backslashes in tag values', () => {
      const pgn = '[Event "Path: C:\\\\Users\\\\test"]\n\n*'
      const parser = new GameParser(pgn)

      expect(parser.games[0].tags['Event']).toBe('Path: C:\\Users\\test')
    })

    it('handles multiple escapes', () => {
      const pgn = '[Event "Test \\\\ \\" value"]\n\n*'
      const parser = new GameParser(pgn)

      expect(parser.games[0].tags['Event']).toBe('Test \\ " value')
    })

    it('rejects malformed tags', () => {
      const pgn = '[Event Test]\n\n*'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error).toBeDefined()
      expect(parser.error?.message).toContain('Invalid tag')
    })

    it('rejects unclosed tags', () => {
      const pgn = '[Event "Test"'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Unclosed tag')
    })
  })

  describe('comments', () => {
    it('parses brace comments', () => {
      const pgn = '[Result "*"]\n\n1. e4 {Great opening} e5 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].comment).toBe('Great opening')
    })

    it('parses semicolon comments', () => {
      const pgn = '[Result "*"]\n\n1. e4 e5\n; Black responds\n*'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[1].comment).toBe('Black responds')
    })

    it('parses multiple comments on same move', () => {
      const pgn = '[Result "*"]\n\n1. e4 {First} $1 {Second} *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].comment).toContain('First')
      expect(parser.games[0].moves[0].comment).toContain('Second')
      expect(parser.games[0].moves[0].comment).toContain('$1')
    })

    it('rejects unclosed brace comments', () => {
      const pgn = '[Result "*"]\n\n1. e4 {unclosed *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Unclosed comment')
    })
  })

  describe('NAGs', () => {
    it('parses numeric annotation glyphs', () => {
      const pgn = '[Result "*"]\n\n1. e4 $1 e5 $2 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].comment).toBe('$1')
      expect(parser.games[0].moves[1].comment).toBe('$2')
    })

    it('parses NAG with comment', () => {
      const pgn = '[Result "*"]\n\n1. e4 $3 {Excellent} *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].comment).toContain('$3')
      expect(parser.games[0].moves[0].comment).toContain('Excellent')
    })
  })

  describe('variations', () => {
    it('parses single variation', () => {
      const pgn = '[Result "*"]\n\n1. e4 (1. d4) e5 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].variations).toBeDefined()
      expect(parser.games[0].moves[0].variations![0]).toHaveLength(1)
      expect(parser.games[0].moves[0].variations![0][0].move).toBe('d4')
    })

    it('parses multiple variations on same move', () => {
      const pgn = '[Result "*"]\n\n1. e4 (1. d4) (1. c4) e5 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].variations).toHaveLength(2)
      expect(parser.games[0].moves[0].variations![0][0].move).toBe('d4')
      expect(parser.games[0].moves[0].variations![1][0].move).toBe('c4')
    })

    it('parses nested variations', () => {
      const pgn = '[Result "*"]\n\n1. e4 (1. d4 (1... d5) 1. Nf3) e5 *'
      const parser = new GameParser(pgn)

      const mainVar = parser.games[0].moves[0].variations![0]
      expect(mainVar).toHaveLength(2)
      expect(mainVar[0].move).toBe('d4')
      expect(mainVar[0].variations).toBeDefined()
      expect(mainVar[0].variations![0][0].move).toBe('d5')
    })

    it('parses variation with comments', () => {
      const pgn = '[Result "*"]\n\n1. e4 (1. d4 {Positional} d5) e5 *'
      const parser = new GameParser(pgn)

      const variation = parser.games[0].moves[0].variations![0]
      expect(variation[0].comment).toBe('Positional')
    })

    it('parses variations without move numbers', () => {
      const pgn = '[Result "*"]\n\n1. e4 (e5) (d5) Nf3 *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(true)
      expect(parser.games[0].moves[0].variations).toHaveLength(2)
      expect(parser.games[0].moves[0].variations![0][0].move).toBe('e5')
      expect(parser.games[0].moves[0].variations![1][0].move).toBe('d5')
    })

    it('rejects variation without previous move', () => {
      const pgn = '[Result "*"]\n\n(1. e4) e5 *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Variation without previous move')
    })

    it('rejects unclosed variation', () => {
      const pgn = '[Result "*"]\n\n1. e4 (1. d4 e5 *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Unclosed variation')
    })

    it('rejects extra closing parenthesis', () => {
      const pgn = '[Result "*"]\n\n1. e4 (1. d4) e5 ) *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Unexpected variation end')
    })
  })

  describe('move numbers', () => {
    it('parses move numbers with single period', () => {
      const pgn = '[Result "*"]\n\n1. e4 2. d4 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves).toHaveLength(2)
    })

    it('parses move numbers with triple period for black', () => {
      const pgn = '[Result "*"]\n\n1. e4 1... e5 2. Nf3 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves).toHaveLength(3)
    })

    it('validates move number sequence', () => {
      const pgn = '[Result "*"]\n\n1. e4 3. e5 *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Invalid move number')
    })

    it('allows black move without white move number', () => {
      const pgn = '[Result "*"]\n\n1... e5 2. e4 *'
      const parser = new GameParser(pgn)

      console.log(parser)

      expect(parser.games[0].moves).toHaveLength(2)
      expect(parser.games[0].moves[0].move).toBe('e5')
    })

    it('treats bare numbers as moves (not move numbers)', () => {
      const pgn = '[Result "*"]\n\n1 e4 2 d4 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves).toHaveLength(4)
      expect(parser.games[0].moves[0].move).toBe('1')
      expect(parser.games[0].moves[1].move).toBe('e4')
      expect(parser.games[0].moves[2].move).toBe('2')
      expect(parser.games[0].moves[3].move).toBe('d4')
    })
  })

  describe('game termination markers', () => {
    it('recognizes white wins', () => {
      const pgn = '[Result "1-0"]\n\n1. e4 1-0'
      const parser = new GameParser(pgn)

      expect(parser.games[0].result).toBe('1-0')
    })

    it('recognizes black wins', () => {
      const pgn = '[Result "0-1"]\n\n1. e4 0-1'
      const parser = new GameParser(pgn)

      expect(parser.games[0].result).toBe('0-1')
    })

    it('recognizes draw', () => {
      const pgn = '[Result "1/2-1/2"]\n\n1. e4 1/2-1/2'
      const parser = new GameParser(pgn)

      expect(parser.games[0].result).toBe('1/2-1/2')
    })

    it('recognizes unknown result', () => {
      const pgn = '[Result "*"]\n\n1. e4 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].result).toBe('*')
    })

    it('validates result matches tag', () => {
      const pgn = '[Result "1-0"]\n\n1. e4 0-1'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Result mismatch')
    })

    it('allows missing result tag', () => {
      const pgn = '[Event "Test"]\n\n1. e4 1-0'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(true)
      expect(parser.games[0].result).toBe('1-0')
    })
  })

  describe('escape sequences', () => {
    it('ignores percent-sign escape lines', () => {
      const pgn = `[Event "Test"]
% This is a comment line
[Result "*"]

1. e4 e5 *`
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(1)
      expect(parser.games[0].tags['Event']).toBe('Test')
    })

    it('allows percent sign in non-first position', () => {
      const pgn = '[Event "50% Complete"]\n\n1. e4 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].tags['Event']).toBe('50% Complete')
    })

    it('handles multiple escape lines', () => {
      const pgn = `[Event "Test"]
% First escape
% Second escape
[Result "*"]

1. e4 *`
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(1)
    })
  })

  describe('multiple games', () => {
    it('parses two games in sequence', () => {
      const pgn = `[Event "Game 1"]
[Result "1-0"]

1. e4 1-0

[Event "Game 2"]
[Result "0-1"]

1. d4 0-1`
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(2)
      expect(parser.games[0].tags['Event']).toBe('Game 1')
      expect(parser.games[0].result).toBe('1-0')
      expect(parser.games[1].tags['Event']).toBe('Game 2')
      expect(parser.games[1].result).toBe('0-1')
    })

    it('parses multiple games with mixed content', () => {
      const pgn = `[Event "A"]
[Result "*"]

1. e4 {comment} (1. d4) e5 $1 *

[Event "B"]
[Result "1-0"]

1. c4 1-0`
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(2)
      expect(parser.games[0].moves[0].variations).toBeDefined()
      expect(parser.games[1].moves).toHaveLength(1)
    })

    it('handles empty games gracefully', () => {
      const pgn = `[Event "A"]
[Result "*"]

*

[Event "B"]
[Result "*"]

*`
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(2)
      expect(parser.games[0].moves).toHaveLength(0)
      expect(parser.games[1].moves).toHaveLength(0)
    })

    it('skips games with only tags and no moves', () => {
      const pgn = `[Event "A"]

[Event "B"]
[Result "*"]

1. e4 *`
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(1)
      expect(parser.games[0].tags['Event']).toBe('B')
    })
  })

  describe('error handling', () => {
    it('maintains isValid flag on error', () => {
      const pgn = '[Unclosed tag'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
    })

    it('reports parser stack corruption', () => {
      const pgn = '[Result "*"]\n\n1. e4 ) ) ) *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(false)
      expect(parser.error?.message).toContain('Unexpected variation end')
    })
  })

  describe('whitespace handling', () => {
    it('ignores leading whitespace', () => {
      const pgn = '  \n  [Event "Test"]\n\n1. e4 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].tags['Event']).toBe('Test')
    })

    it('handles various whitespace characters', () => {
      const pgn = '[Event "Test"]\n\n1.  \t  e4  \n  e5  *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves).toHaveLength(2)
    })

    it('trims comments', () => {
      const pgn = '[Result "*"]\n\n1. e4 {  leading and trailing  } e5 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].comment).toBe('leading and trailing')
    })
  })

  describe('special characters in moves', () => {
    it('allows alphanumeric and underscore', () => {
      const pgn = '[Result "*"]\n\n1. Move_1 move_2 *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].move).toBe('Move_1')
      expect(parser.games[0].moves[1].move).toBe('move_2')
    })

    it('stops parsing move at PGN delimiters', () => {
      const pgn = '[Result "*"]\n\n1. e[4] *'
      const parser = new GameParser(pgn)

      expect(parser.games[0].moves[0].move).toBe('e')
    })
  })

  describe('getter and setter', () => {
    it('sets pgn and parses on setter', () => {
      const parser = new GameParser()
      parser.pgn = '[Event "Test"]\n\n1. e4 *'

      expect(parser.games).toHaveLength(1)
    })

    it('returns pgn on getter', () => {
      const pgn = '[Event "Test"]\n\n1. e4 *'
      const parser = new GameParser(pgn)

      expect(parser.pgn).toBe(pgn)
    })

    it('toString returns pgn', () => {
      const pgn = '[Event "Test"]\n\n1. e4 *'
      const parser = new GameParser(pgn)

      expect(parser.toString()).toBe(pgn)
    })

    it('clears previous games on new pgn', () => {
      const parser = new GameParser('[Event "A"]\n\n*')
      expect(parser.games).toHaveLength(1)

      parser.pgn = '[Event "B"]\n\n*'
      expect(parser.games).toHaveLength(1)
      expect(parser.games[0].tags['Event']).toBe('B')
    })
  })

  describe('complex real-world scenarios', () => {
    it('parses complex annotated game', () => {
      const pgn = `[Event "World Championship"]
[Site "London"]
[Date "2024.01.15"]
[Round "10"]
[White "Player A"]
[Black "Player B"]
[Result "1/2-1/2"]

1. e4 {Classical opening} 1... c5 {Sicilian defense}
2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 {Najdorf variation}
(5... e6 {Alternative} 6. Bg5) 6. Bg5 e6 7. f4 {Aggressive}
(7. Be2 {Solid}) Be7 8. Qf3 Nbd7 $1 9. Rc1 {Rook to center}
1/2-1/2`
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(true)
      expect(parser.games).toHaveLength(1)
      const game = parser.games[0]
      expect(game.tags['White']).toBe('Player A')
      expect(game.tags['Black']).toBe('Player B')
      expect(game.result).toBe('1/2-1/2')
      expect(game.moves.length).toBeGreaterThan(10)
    })

    it('parses database with multiple complex games', () => {
      const pgn = `[Event "Tournament"]
[Round "1"]
[White "A"]
[Black "B"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 (3. Bc4) a6 4. Ba4 Nf6 1-0

[Event "Tournament"]
[Round "2"]
[White "C"]
[Black "D"]
[Result "0-1"]

1. d4 {Open game} d5 2. c4 (2. Nf3 c6) dxc4 {Capturing pawn} $1 0-1`
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(2)
      expect(parser.games[0].moves[4].variations).toBeDefined()
      expect(parser.games[1].moves[2].comment).toContain('Capturing pawn')
      expect(parser.games[1].moves[2].comment).toContain('$1')
    })

    it('handles game without result tag but with termination marker', () => {
      const pgn = '[Event "Test"]\n\n1. e4 e5 2. Nf3 *'
      const parser = new GameParser(pgn)

      expect(parser.isValid()).toBe(true)
      expect(parser.games[0].result).toBe('*')
    })
  })

  describe('edge cases', () => {
    it('handles empty pgn string', () => {
      const parser = new GameParser('')
      expect(parser.games).toHaveLength(0)
      expect(parser.isValid()).toBe(true)
    })

    it('handles pgn with only whitespace', () => {
      const parser = new GameParser('   \n\n\t  ')
      expect(parser.games).toHaveLength(0)
      expect(parser.isValid()).toBe(true)
    })

    it('handles pgn with only escape lines', () => {
      const parser = new GameParser('% Comment\n% Another comment')
      expect(parser.games).toHaveLength(0)
      expect(parser.isValid()).toBe(true)
    })

    it('handles move without preceding movetext', () => {
      const pgn = '1. e4 *'
      const parser = new GameParser(pgn)

      expect(parser.games).toHaveLength(1)
      expect(parser.games[0].moves).toHaveLength(1)
    })

    it('handles very long move sequence', () => {
      let pgn = '[Result "*"]\n\n'
      for (let i = 1; i <= 100; i++) {
        pgn += `${i}. move${i} move${i}b `
      }
      pgn += '*'

      const parser = new GameParser(pgn)
      expect(parser.games[0].moves).toHaveLength(200)
    })

    it('handles very deeply nested variations', () => {
      let pgn = '[Result "*"]\n\n1. e4'
      for (let i = 0; i < 10; i++) {
        pgn += ` (1. var${i}`
      }
      for (let i = 0; i < 10; i++) {
        pgn += ')'
      }
      pgn += ' e5 *'

      const parser = new GameParser(pgn)
      expect(parser.isValid()).toBe(true)
    })

    it('handles tag value with special characters', () => {
      const pgn = '[Event "Berlin 2024 (Final Round) - Playoff @ Site"]\n\n*'
      const parser = new GameParser(pgn)

      expect(parser.games[0].tags['Event']).toBe('Berlin 2024 (Final Round) - Playoff @ Site')
    })
  })
})
