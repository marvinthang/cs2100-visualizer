interface GrammarToken {
  pattern: string
  scope: string
}
interface MonarchLanguage {
  tokenizer: { root: [string, string][] }
}
const monarchFromTokens = (tokens: readonly GrammarToken[]): MonarchLanguage => ({
  tokenizer: { root: tokens.map(t => [t.pattern, t.scope] as [string, string]) }
})
interface ThemeRule {
  foreground: string
  token: string
}
const themeFromTokens = (palette: Readonly<Record<string, string>>): { base: string; rules: ThemeRule[] } => ({
  base: 'vs-dark',
  rules: Object.entries(palette).map(([token, foreground]) => ({
    foreground: foreground.replace('#', ''),
    token
  }))
})
interface Diagnostic {
  endColumn: number
  line: number
  message: string
  severity: Severity
  startColumn: number
}
interface MonacoMarker {
  endColumn: number
  endLineNumber: number
  message: string
  severity: number
  startColumn: number
  startLineNumber: number
}
type Severity = 'error' | 'hint' | 'info' | 'warning'
const SEVERITY: Record<Severity, number> = { error: 8, hint: 1, info: 2, warning: 4 }
const toMonacoMarkers = (diags: readonly Diagnostic[]): MonacoMarker[] =>
  diags.map(d => ({
    endColumn: d.endColumn,
    endLineNumber: d.line,
    message: d.message,
    severity: SEVERITY[d.severity],
    startColumn: d.startColumn,
    startLineNumber: d.line
  }))
export { monarchFromTokens, SEVERITY, themeFromTokens, toMonacoMarkers }
export type { Diagnostic, GrammarToken, MonacoMarker, MonarchLanguage, Severity, ThemeRule }
