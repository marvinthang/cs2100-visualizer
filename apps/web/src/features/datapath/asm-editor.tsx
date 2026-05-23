/* oxlint-disable promise/prefer-await-to-then */
'use client'
import { toMonacoMarkers } from '@sim/editor'
import { useEffect, useRef, useState } from 'react'
import type { Instruction } from '@/features/mips/types'
import { assemble } from './asm-grammar'

const noop = (): undefined => undefined
const AsmEditor = ({
  initial,
  onAssembled = noop
}: {
  initial: string
  onAssembled?: (instructions: readonly Instruction[]) => void
}): React.JSX.Element => {
  const ref = useRef<HTMLDivElement | null>(null)
  const onAssembledRef = useRef(onAssembled)
  useEffect(() => {
    onAssembledRef.current = onAssembled
  }, [onAssembled])
  const [diagCount, setDiagCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  useEffect(() => {
    let disposed = false
    let editor: undefined | { dispose: () => void }
    const mount = async (): Promise<void> => {
      const monaco = await import('monaco-editor')
      if (disposed || !ref.current) return
      const model = monaco.editor.createModel(initial, 'mips')
      const ed = monaco.editor.create(ref.current, {
        automaticLayout: true,
        fontSize: 13,
        minimap: { enabled: false },
        model,
        theme: 'vs-dark'
      })
      editor = ed
      const lint = (): void => {
        const r = assemble(model.getValue())
        setDiagCount(r.diagnostics.length)
        setWordCount(r.words.length)
        if (r.diagnostics.length === 0 && r.instructions.length > 0) onAssembledRef.current(r.instructions)
        monaco.editor.setModelMarkers(
          model,
          'mips',
          toMonacoMarkers(
            r.diagnostics.map(d => ({
              endColumn: d.col + d.len + 1,
              line: d.line + 1,
              message: `${d.code}: ${d.message}`,
              severity: 'error' as const,
              startColumn: d.col + 1
            }))
          )
        )
      }
      lint()
      model.onDidChangeContent(lint)
    }
    mount().catch(() => undefined)
    return () => {
      disposed = true
      editor?.dispose()
    }
  }, [initial])
  return (
    <section aria-label='asm editor' className='flex flex-col gap-2'>
      <div className='h-64 w-full overflow-hidden rounded-lg border' ref={ref} />
      <p className='font-mono text-xs text-muted-foreground'>
        {wordCount} encoded words · {diagCount} diagnostic{diagCount === 1 ? '' : 's'}
      </p>
    </section>
  )
}
export default AsmEditor
