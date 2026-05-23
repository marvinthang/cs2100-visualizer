/** biome-ignore-all lint/nursery/useGlobalThis: noise */
/* eslint-disable complexity */
'use client'
import { cn } from '@a/ui'
import { ChevronLeft, ChevronRight, Code2, Pause, Play, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { Step } from '@/features/datapath/generated/stepTraces'
import type { View } from '@/features/datapath/use-view-mode'
import type { ControlSignals, Instruction } from '@/features/mips/types'
import DatapathA11yProxies from '@/features/datapath/a11y/proxies'
import AsmEditor from '@/features/datapath/asm-editor'
import { assemble } from '@/features/datapath/asm-grammar'
import DatapathCanvas from '@/features/datapath/datapath-canvas'
import DatapathPanel from '@/features/datapath/datapath-panel'
import { createProgram, current, stepForward } from '@/features/datapath/execution'
import { activePaths, componentsForPaths, STEPS } from '@/features/datapath/generated/stepTraces'
import { COMPONENTS } from '@/features/datapath/generated/topology'
import { glossaryFor } from '@/features/datapath/glossary'
import useViewMode from '@/features/datapath/use-view-mode'
import { datapathValues } from '@/features/datapath/values'
import { controlFor, createInitialState, encodeInstruction } from '@/features/mips'
import { DATAPATH_INSTRUCTIONS } from '@/lib/nav'

const PANEL = 'rounded-xl border bg-background/80 shadow-lg backdrop-blur-md'
const ROLE = new Map(COMPONENTS.map(c => [c.id, c.role]))
const HINT_KEY = 'sim-datapath-hint-seen'
const EXAMPLES = [
  { name: 'sum', src: 'addi $t0, $zero, 5\naddi $t1, $zero, 7\nadd $t2, $t0, $t1' },
  { name: 'shift', src: 'addi $t0, $zero, 3\nsll $t1, $t0, 4\nsrl $t2, $t1, 2' },
  { name: 'mask', src: 'addi $t0, $zero, 255\nandi $t1, $t0, 15\nori $t2, $t1, 240' },
  { name: 'branch', src: 'addi $t0, $zero, 4\naddi $t1, $zero, 4\nbeq $t0, $t1, 2' }
]
const STEP_SET = new Set<string>(STEPS)
const RE_FORM = /^(?:INPUT|TEXTAREA)$/u
const readParam = (key: string): string | undefined => {
  if (typeof window === 'undefined') return
  return new URLSearchParams(window.location.search).get(key) ?? undefined
}
const writeParams = (step: string, selected: string | undefined): void => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('step', step)
  if (selected === undefined) params.delete('sel')
  else params.set('sel', selected)
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
}
const DatapathWorkspace = ({
  name,
  base,
  views,
  control,
  asmInitial,
  values
}: {
  asmInitial: string
  base: string
  control: ControlSignals
  name: string
  values: Record<string, string>
  views: readonly View[]
}): React.JSX.Element => {
  const router = useRouter()
  const [step, setStep] = useState<Step>('EX')
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [editorOpen, setEditorOpen] = useState(false)
  const [hint, setHint] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [liveProgram, setLiveProgram] = useState<readonly Instruction[]>([])
  const [insIndex, setInsIndex] = useState(0)
  const [presetSrc, setPresetSrc] = useState<string | undefined>(undefined)
  const [showHelp, setShowHelp] = useState(false)
  const [initRegs, setInitRegs] = useState<Record<number, number>>({ 10: 3, 9: 10 })
  const [initPc, setInitPc] = useState(0)
  const [initMem, setInitMem] = useState<Record<number, number>>({})
  const [memWords, setMemWords] = useState(8)
  const [memStart, setMemStart] = useState(0)
  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    if (localStorage.getItem(HINT_KEY) === null) setHint(true)
    const s = readParam('step')
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    if (s !== undefined && STEP_SET.has(s)) setStep(s as Step)
    const sel = readParam('sel')
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    if (sel !== undefined) setSelected(sel)
  }, [])
  useEffect(() => {
    const r = assemble(asmInitial)
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    if (r.diagnostics.length === 0 && r.instructions.length > 0) setLiveProgram(r.instructions)
  }, [asmInitial])
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || RE_FORM.test(t.tagName) || t.closest('.monaco-editor') !== null)) return
      const stepBy = (d: number): void =>
        setStep(s => STEPS[Math.min(STEPS.length - 1, Math.max(0, STEPS.indexOf(s) + d))] ?? 'IF')
      const insBy = (d: number): void => setInsIndex(i => Math.min(liveProgram.length - 1, Math.max(0, i + d)))
      const k = e.key
      if (k === 'Escape') setSelected(undefined)
      else if (k === ' ') {
        e.preventDefault()
        setPlaying(v => !v)
      } else if (k === 'ArrowRight') stepBy(1)
      else if (k === 'ArrowLeft') stepBy(-1)
      else if (k === '.') insBy(1)
      else if (k === ',') insBy(-1)
      else if (k >= '1' && k <= '5') setStep(STEPS[Number(k) - 1] ?? 'IF')
      else if (k === 'e' || k === 'E') setEditorOpen(v => !v)
      else if (k === '?') setShowHelp(v => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [liveProgram.length])
  useEffect(() => {
    writeParams(step, selected)
  }, [step, selected])
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep(s => {
        const si = STEPS.indexOf(s)
        if (si < STEPS.length - 1) return STEPS[si + 1] ?? 'IF'
        setInsIndex(i => {
          if (i < liveProgram.length - 1) return i + 1
          setPlaying(false)
          return i
        })
        return 'IF'
      })
    }, 900)
    return () => clearInterval(id)
  }, [playing, liveProgram.length])
  const live = useMemo(() => {
    if (liveProgram.length === 0) return
    const idx = Math.min(insIndex, liveProgram.length - 1)
    const ins = liveProgram[idx]
    if (ins === undefined) return
    const words = liveProgram.map(encodeInstruction)
    let prog = createProgram(words, 1, { memory: initMem, pc: initPc, registers: initRegs })
    for (let i = 0; i < idx; i += 1) prog = stepForward(prog)
    const before = current(prog)
    const after = current(stepForward(prog))
    return {
      after,
      before,
      control: controlFor(ins),
      count: liveProgram.length,
      idx,
      values: datapathValues(before, after, ins),
      word: words[idx] ?? 0
    }
  }, [liveProgram, insIndex, initRegs, initPc, initMem])
  const aControl = live?.control ?? control
  const aValues = live?.values ?? values
  const valueEntries = useMemo(() => Object.entries(aValues), [aValues])
  const dismissHint = (): void => {
    setHint(false)
    localStorage.setItem(HINT_KEY, '1')
  }
  const activeP = useMemo(() => new Set(activePaths(aControl, step)), [aControl, step])
  const activeC = useMemo(() => new Set(componentsForPaths([...activeP])), [activeP])
  const activeList = useMemo(() => [...activeC], [activeC])
  const { view, mounted } = useViewMode(views)
  const aAfter = live?.after ?? createInitialState()
  const aBefore = live?.before ?? createInitialState()
  const edit = useMemo(
    () => ({
      mem: initMem,
      memStart,
      memWords,
      pc: initPc,
      regs: initRegs,
      setMem: (a: number, v: number) => setInitMem(m => ({ ...m, [a]: v })),
      setMemRange: (s: number, w: number) => {
        setMemStart(s)
        setMemWords(w)
      },
      setPc: setInitPc,
      setReg: (n: number, v: number) => setInitRegs(r => ({ ...r, [n]: v }))
    }),
    [initMem, memStart, memWords, initPc, initRegs]
  )
  return (
    <div className='absolute inset-0' onPointerDown={hint ? dismissHint : undefined}>
      <DatapathCanvas
        control={aControl}
        mounted={mounted}
        onSelect={setSelected}
        selected={selected}
        step={step}
        values={aValues}
        view={view}
        word={live?.word ?? 0}
      />
      <div className={cn('absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 font-mono text-sm', PANEL)}>
        <h1>MIPS · {name}</h1>
        <select
          aria-label='go to instruction'
          className='rounded border bg-background px-2 py-1 text-xs'
          onChange={e => {
            if (e.target.value !== 'assembly') router.push(`${base}/${e.target.value}`)
          }}
          value='assembly'>
          <option value='assembly'>assembly</option>
          {DATAPATH_INSTRUCTIONS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      {editorOpen ? (
        <div
          className={cn(
            'absolute top-16 left-4 flex w-80 flex-col gap-2 p-3 max-sm:inset-x-2 max-sm:top-auto max-sm:bottom-24 max-sm:w-auto',
            PANEL
          )}>
          <div className='flex items-center justify-between'>
            <span className='font-mono text-xs text-muted-foreground'>assembly · type to drive the datapath</span>
            <button onClick={() => setEditorOpen(false)} type='button'>
              <ChevronLeft className='size-4' />
            </button>
          </div>
          <div className='flex flex-wrap gap-1'>
            {EXAMPLES.map(ex => (
              <button
                className='rounded border px-2 py-0.5 text-xs hover:bg-muted'
                key={ex.name}
                onClick={() => setPresetSrc(ex.src)}
                type='button'>
                {ex.name}
              </button>
            ))}
          </div>
          <AsmEditor
            initial={presetSrc ?? asmInitial}
            key={presetSrc ?? 'init'}
            onAssembled={ins => {
              setLiveProgram(ins)
              setInsIndex(0)
            }}
          />
        </div>
      ) : (
        <button
          className={cn('absolute top-16 left-4 flex items-center gap-2 px-3 py-2 text-sm', PANEL)}
          onClick={() => setEditorOpen(true)}
          type='button'>
          <Code2 className='size-4' /> Editor
        </button>
      )}
      {selected === undefined ? undefined : (
        <div
          className={cn(
            'absolute top-1/2 right-4 w-72 -translate-y-1/2 p-4 max-sm:inset-x-2 max-sm:top-auto max-sm:bottom-24 max-sm:w-auto max-sm:translate-y-0',
            PANEL
          )}>
          <div className='flex items-center justify-between'>
            <span className='font-mono font-bold text-[#a855f7]'>{selected}</span>
            <button onClick={() => setSelected(undefined)} type='button'>
              <X className='size-4' />
            </button>
          </div>
          <p className='mt-2 text-sm'>{ROLE.get(selected) ?? 'datapath component'}</p>
          {aValues[selected] === undefined ? undefined : (
            <p className='mt-2 rounded bg-muted/50 px-2 py-1 font-mono text-sm text-[#22d3ee]'>{aValues[selected]}</p>
          )}
          <ul className='mt-2 space-y-0.5 font-mono text-xs text-muted-foreground'>
            <li>
              active in {step}: {activeC.has(selected) ? 'yes' : 'no'}
            </li>
          </ul>
        </div>
      )}
      <DatapathPanel
        activeComponents={activeList}
        after={aAfter}
        before={aBefore}
        control={aControl}
        edit={edit}
        step={step}
        values={aValues}
      />
      {live !== undefined && live.count > 1 ? (
        <div
          className={cn(
            '-translate-x-1/2 absolute bottom-32 left-1/2 flex items-center gap-2 px-2 py-1 font-mono text-xs',
            PANEL
          )}>
          <button
            aria-label='previous instruction'
            className='rounded p-1 hover:bg-muted disabled:opacity-40'
            disabled={live.idx === 0}
            onClick={() => setInsIndex(i => Math.max(0, i - 1))}
            type='button'>
            <ChevronLeft className='size-4' />
          </button>
          <span>
            instr {live.idx + 1}/{live.count} · {liveProgram[live.idx]?.name}
          </span>
          <button
            aria-label='next instruction'
            className='rounded p-1 hover:bg-muted disabled:opacity-40'
            disabled={live.idx >= live.count - 1}
            onClick={() => setInsIndex(i => Math.min(live.count - 1, i + 1))}
            type='button'>
            <ChevronRight className='size-4' />
          </button>
        </div>
      ) : undefined}
      <div
        aria-label='datapath step'
        className={cn('-translate-x-1/2 absolute bottom-6 left-1/2 flex items-center gap-1 p-1.5', PANEL)}
        role='tablist'>
        <button
          aria-label={playing ? 'pause' : 'play'}
          className='mr-1 rounded-lg p-1.5 hover:bg-muted'
          onClick={() => setPlaying(v => !v)}
          type='button'>
          {playing ? <Pause className='size-4' /> : <Play className='size-4' />}
        </button>
        {STEPS.map(s => (
          <button
            aria-selected={s === step}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition',
              s === step ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
            key={s}
            onClick={() => setStep(s)}
            role='tab'
            title={glossaryFor(s)}
            type='button'>
            {s}
          </button>
        ))}
      </div>
      {hint ? (
        <div
          className={cn(
            '-translate-x-1/2 absolute bottom-24 left-1/2 px-4 py-2 text-center text-sm text-muted-foreground',
            PANEL
          )}>
          drag to orbit · scroll to zoom · click a component · press ? for keyboard shortcuts
        </div>
      ) : undefined}
      <div
        className={cn(
          '-translate-x-1/2 absolute bottom-20 left-1/2 flex max-w-[90vw] flex-wrap justify-center gap-x-3 gap-y-0.5 px-3 py-1.5 font-mono text-xs max-sm:hidden',
          PANEL
        )}>
        {valueEntries.map(([id, v]) => (
          <button
            className={cn('hover:text-foreground', selected === id ? 'text-[#a855f7]' : 'text-muted-foreground')}
            key={id}
            onClick={() => setSelected(id)}
            title={glossaryFor(id)}
            type='button'>
            <span className='text-foreground'>{id}</span> {v}
          </button>
        ))}
      </div>
      <button
        aria-label='keyboard shortcuts'
        className={cn('absolute right-4 bottom-6 size-8 text-sm', PANEL)}
        onClick={() => setShowHelp(v => !v)}
        type='button'>
        ?
      </button>
      {showHelp ? (
        <div
          className={cn('-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 w-72 p-4 font-mono text-xs', PANEL)}
          onPointerDown={() => setShowHelp(false)}>
          <div className='mb-2 font-bold'>keyboard</div>
          <ul className='space-y-1 [&>li]:flex [&>li]:justify-between [&>li>kbd]:rounded [&>li>kbd]:bg-muted [&>li>kbd]:px-1.5'>
            <li>
              play / pause <kbd>Space</kbd>
            </li>
            <li>
              step phase <kbd>← →</kbd>
            </li>
            <li>
              prev / next instr <kbd>, .</kbd>
            </li>
            <li>
              jump phase <kbd>1–5</kbd>
            </li>
            <li>
              editor <kbd>E</kbd>
            </li>
            <li>
              deselect <kbd>Esc</kbd>
            </li>
            <li>
              cycle components <kbd>Tab</kbd>
            </li>
            <li>
              search <kbd>⌘K</kbd>
            </li>
            <li>
              this help <kbd>?</kbd>
            </li>
          </ul>
        </div>
      ) : undefined}
      <DatapathA11yProxies
        activeComponents={activeList}
        control={aControl}
        name={name}
        onSelect={setSelected}
        selected={selected}
      />
    </div>
  )
}
export default DatapathWorkspace
