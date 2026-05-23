import { describe, expect, test } from 'bun:test'
import { monarchFromTokens, SEVERITY, themeFromTokens, toMonacoMarkers } from './index'

describe('@sim/editor monarchFromTokens', () => {
  test('maps tokens to tokenizer rules', () => {
    const m = monarchFromTokens([{ pattern: '\\d+', scope: 'number' }])
    expect(m.tokenizer.root).toEqual([[String.raw`\d+`, 'number']])
  })
})
describe('@sim/editor themeFromTokens', () => {
  test('strips # and builds rules', () => {
    const t = themeFromTokens({ keyword: '#22d3ee' })
    expect(t.base).toBe('vs-dark')
    expect(t.rules[0]).toEqual({ foreground: '22d3ee', token: 'keyword' })
  })
})
describe('@sim/editor toMonacoMarkers', () => {
  test('maps severity + position', () => {
    const [mk] = toMonacoMarkers([{ endColumn: 5, line: 3, message: 'bad', severity: 'error', startColumn: 1 }])
    expect(mk).toEqual({
      endColumn: 5,
      endLineNumber: 3,
      message: 'bad',
      severity: SEVERITY.error,
      startColumn: 1,
      startLineNumber: 3
    })
  })
  test('severity ladder', () => {
    expect(SEVERITY.error).toBeGreaterThan(SEVERITY.warning)
    expect(SEVERITY.warning).toBeGreaterThan(SEVERITY.info)
    expect(SEVERITY.info).toBeGreaterThan(SEVERITY.hint)
  })
})
