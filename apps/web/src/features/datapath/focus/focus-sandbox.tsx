'use client'
import { cn } from '@a/ui'
import { ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { Field } from '@/features/datapath/build-instruction'
import type { Step } from '@/features/datapath/generated/stepTraces'
import type { View } from '@/features/datapath/use-view-mode'
import type { RegisterNumber } from '@/features/mips/types'
import DatapathA11yProxies from '@/features/datapath/a11y/proxies'
import { buildInstruction, decodeFields, formatOf } from '@/features/datapath/build-instruction'
import DatapathCanvas from '@/features/datapath/datapath-canvas'
import DatapathPanel from '@/features/datapath/datapath-panel'
import { activePaths, componentsForPaths, STEPS } from '@/features/datapath/generated/stepTraces'
import { glossaryFor } from '@/features/datapath/glossary'
import useViewMode from '@/features/datapath/use-view-mode'
import { datapathValues } from '@/features/datapath/values'
import {
  controlFor,
  createInitialState,
  decodeInstruction,
  encodeInstruction,
  executeStep,
  writeRegister
} from '@/features/mips'
import { DATAPATH_INSTRUCTIONS } from '@/lib/nav'

const PANEL = 'rounded-xl border bg-background/80 shadow-lg backdrop-blur-md'
const REG_NAMES = [
  '$zero',
  '$at',
  '$v0',
  '$v1',
  '$a0',
  '$a1',
  '$a2',
  '$a3',
  '$t0',
  '$t1',
  '$t2',
  '$t3',
  '$t4',
  '$t5',
  '$t6',
  '$t7',
  '$s0',
  '$s1',
  '$s2',
  '$s3',
  '$s4',
  '$s5',
  '$s6',
  '$s7',
  '$t8',
  '$t9',
  '$k0',
  '$k1',
  '$gp',
  '$sp',
  '$fp',
  '$ra'
]
const REG_OPTS = REG_NAMES.map((nm, n) => ({ label: `${nm} ($${n})`, n }))
const RegSelect = ({
  label,
  value,
  set
}: {
  label: string
  set: (r: RegisterNumber) => void
  value: RegisterNumber
}): React.JSX.Element => (
  <label className='flex items-center justify-between gap-2'>
    <span className='text-muted-foreground'>{label}</span>
    <select
      aria-label={label}
      className='rounded border bg-background px-1 py-0.5'
      onChange={e => set(Number(e.target.value) as RegisterNumber)}
      value={value}>
      {REG_OPTS.map(o => (
        <option key={o.n} value={o.n}>
          {REG_NAMES[o.n]}
        </option>
      ))}
    </select>
  </label>
)
const NumInput = ({
  label,
  value,
  set
}: {
  label: string
  set: (n: number) => void
  value: number
}): React.JSX.Element => (
  <label className='flex items-center justify-between gap-2'>
    <span className='text-muted-foreground'>{label}</span>
    <input
      aria-label={label}
      className='w-20 rounded border bg-background px-1 py-0.5'
      onChange={e => set(Number(e.target.value) || 0)}
      type='number'
      value={value}
    />
  </label>
)
const FocusSandbox = ({
  name,
  base,
  views
}: {
  base: string
  name: string
  views: readonly View[]
}): React.JSX.Element => {
  const router = useRouter()
  const fmt = useMemo(() => formatOf(name), [name])
  const [rd, setRd] = useState<RegisterNumber>(8 as RegisterNumber)
  const [rs, setRs] = useState<RegisterNumber>(9 as RegisterNumber)
  const [rt, setRt] = useState<RegisterNumber>(10 as RegisterNumber)
  const [imm, setImm] = useState(4)
  const [shamt, setShamt] = useState(2)
  const [rsVal, setRsVal] = useState(10)
  const [rtVal, setRtVal] = useState(3)
  const [step, setStep] = useState<Step>('EX')
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const model = useMemo(() => {
    const ins = buildInstruction(name, { imm, rd, rs, rt, shamt, target: 0x1_00 })
    const word = encodeInstruction(ins)
    const seeded = writeRegister(writeRegister(createInitialState(), rs, rsVal), rt, rtVal)
    const after = executeStep(seeded, word, decodeInstruction(word)).nextState
    return {
      after,
      before: seeded,
      control: controlFor(ins),
      fields: decodeFields(word, fmt.kind),
      values: datapathValues(seeded, after, ins),
      word
    }
  }, [name, fmt.kind, rd, rs, rt, imm, shamt, rsVal, rtVal])
  const activeP = useMemo(() => new Set(activePaths(model.control, step)), [model.control, step])
  const activeC = useMemo(() => new Set(componentsForPaths([...activeP])), [activeP])
  const has = (f: Field): boolean => fmt.fields.includes(f)
  const activeList = useMemo(() => [...activeC], [activeC])
  const { view, mounted } = useViewMode(views)
  return (
    <div className='absolute inset-0'>
      <DatapathCanvas
        control={model.control}
        mounted={mounted}
        onSelect={setSelected}
        selected={selected}
        step={step}
        values={model.values}
        view={view}
        word={model.word}
      />
      <div className={cn('absolute top-4 left-4 flex items-center gap-3 px-3 py-1.5 font-mono text-sm', PANEL)}>
        <h1 className='sr-only'>MIPS · {name}</h1>
        <label className='flex items-center gap-1.5'>
          <span className='text-muted-foreground'>instr</span>
          <select
            aria-label='instruction'
            className='rounded border bg-background px-2 py-1'
            onChange={e => router.push(`${base}/${e.target.value}`)}
            value={name}>
            {DATAPATH_INSTRUCTIONS.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <span className='rounded bg-muted px-1.5 text-xs text-muted-foreground'>{fmt.kind}-type</span>
        <Link className='flex items-center gap-1 text-xs text-[#22d3ee] hover:underline' href={`${base}/assembly`}>
          assembly <ArrowRight className='size-3' />
        </Link>
      </div>
      <div className={cn('absolute top-16 left-4 flex w-60 flex-col gap-1.5 p-3 font-mono text-xs', PANEL)}>
        <div className='text-muted-foreground'>operands</div>
        {has('rd') ? <RegSelect label='rd' set={setRd} value={rd} /> : undefined}
        {has('rs') ? <RegSelect label='rs' set={setRs} value={rs} /> : undefined}
        {has('rt') ? <RegSelect label='rt' set={setRt} value={rt} /> : undefined}
        {has('imm') ? <NumInput label='imm' set={setImm} value={imm} /> : undefined}
        {has('shamt') ? <NumInput label='shamt' set={setShamt} value={shamt} /> : undefined}
        <div className='mt-1 text-muted-foreground'>source values</div>
        {has('rs') ? <NumInput label={REG_NAMES[rs] ?? 'rs'} set={setRsVal} value={rsVal} /> : undefined}
        {has('rt') ? <NumInput label={REG_NAMES[rt] ?? 'rt'} set={setRtVal} value={rtVal} /> : undefined}
      </div>
      <DatapathPanel
        activeComponents={activeList}
        after={model.after}
        before={model.before}
        control={model.control}
        step={step}
        values={model.values}
      />
      {selected === undefined ? undefined : (
        <div className={cn('absolute bottom-32 left-4 w-64 p-4', PANEL)}>
          <div className='flex items-center justify-between'>
            <span className='font-mono font-bold text-[#a855f7]'>{selected}</span>
            <button onClick={() => setSelected(undefined)} type='button'>
              <X className='size-4' />
            </button>
          </div>
          {model.values[selected] === undefined ? undefined : (
            <p className='mt-2 rounded bg-muted/50 px-2 py-1 font-mono text-sm text-[#22d3ee]'>{model.values[selected]}</p>
          )}
          <p className='mt-2 font-mono text-xs text-muted-foreground'>
            active in {step}: {activeC.has(selected) ? 'yes' : 'no'}
          </p>
        </div>
      )}
      <div
        className={cn(
          '-translate-x-1/2 absolute bottom-20 left-1/2 flex items-stretch gap-px overflow-hidden rounded-lg border font-mono text-xs',
          PANEL
        )}>
        {model.fields.map(f => (
          <div className='flex flex-col items-center bg-background/60 px-3 py-1' key={f.label}>
            <span className='text-muted-foreground'>{f.label}</span>
            <span className='text-foreground'>{f.value}</span>
            <span className='text-[10px] text-muted-foreground'>{f.width}b</span>
          </div>
        ))}
        <div className='flex flex-col items-center bg-muted/40 px-3 py-1'>
          <span className='text-muted-foreground'>hex</span>
          <span className='text-[#22d3ee]'>0x{model.word.toString(16).padStart(8, '0')}</span>
        </div>
      </div>
      <div
        aria-label='datapath step'
        className={cn('-translate-x-1/2 absolute bottom-6 left-1/2 flex items-center gap-1 p-1.5', PANEL)}
        role='tablist'>
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
      <DatapathA11yProxies
        activeComponents={activeList}
        control={model.control}
        name={name}
        onSelect={setSelected}
        selected={selected}
      />
    </div>
  )
}
export default FocusSandbox
