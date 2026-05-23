/* oxlint-disable react/jsx-handler-names */
'use client'
import { cn } from '@a/ui'
import { ChevronLeft, PanelRight } from 'lucide-react'
import { useState } from 'react'
import type { Step } from '@/features/datapath/generated/stepTraces'
import type { ControlSignals, MachineState, RegisterNumber } from '@/features/mips/types'
import { glossaryFor } from '@/features/datapath/glossary'

const PANEL = 'border bg-background/90 shadow-lg backdrop-blur-md'
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
const TABS = ['Val', 'Reg', 'Mem', 'Ctrl', 'Info'] as const
type Tab = (typeof TABS)[number]
const FORMATS = ['dec', 'hex', 'bin'] as const
type Fmt = (typeof FORMATS)[number]
const fmtNum = (n: number, f: Fmt): string => {
  const u = Math.trunc(n)
  if (f === 'hex') return `0x${(u < 0 ? Math.trunc(u) : u).toString(16).toUpperCase()}`
  if (f === 'bin') return `0b${(u < 0 ? Math.trunc(u) : u).toString(2)}`
  return String(n)
}
const parseNum = (s: string): number => {
  const n = Number(s.trim())
  return Number.isNaN(n) ? 0 : Math.trunc(n)
}
const hexAddr = (a: number): string => `0x${Math.trunc(a).toString(16).toUpperCase().padStart(8, '0')}`
const HINT: Record<Tab, string> = {
  Ctrl: 'Control signals the Control unit decodes from the opcode.',
  Info: 'What each component does — highlighted ones are active in this stage.',
  Mem: 'Data memory contents (address → stored word).',
  Reg: 'Value held in each register ($zero–$ra); changed this run highlighted.',
  Val: 'Values flowing on the datapath this stage.'
}
const INSPECT: { id: string; sub: string; title: string }[] = [
  { id: 'PC', sub: 'Stores the address of the current instruction.', title: 'Program Counter (PC)' },
  { id: 'IM', sub: 'Uses the PC as an address and outputs the instruction stored there.', title: 'Instruction Memory' },
  {
    id: 'IR',
    sub: 'Holds the fetched instruction and exposes its bit fields to the datapath.',
    title: 'Instruction Register'
  },
  { id: 'Control', sub: 'Decodes the opcode into control signals for the datapath.', title: 'Control Unit' },
  { id: 'RF', sub: 'Reads two source registers and optionally writes one destination register.', title: 'Register File' },
  { id: 'SE', sub: 'Extends the 16-bit immediate field into a 32-bit signed value.', title: 'Sign Extend' },
  {
    id: 'RegDstMux',
    sub: 'Selects which instruction field becomes the register-file write address.',
    title: 'RegDst MUX'
  },
  { id: 'ALUSrcMux', sub: 'Selects the second input to the ALU.', title: 'ALUSrc MUX' },
  { id: 'ALUControl', sub: 'Decodes ALUOp + funct into the ALU operation.', title: 'ALU Control' },
  {
    id: 'ALU',
    sub: 'Computes arithmetic or logic results from two input operands.',
    title: 'Arithmetic Logic Unit (ALU)'
  },
  { id: 'Zero', sub: 'High when the ALU result is zero (used for branches).', title: 'Zero Flag' },
  { id: 'DM', sub: 'Reads from or writes to memory using the ALU result as address.', title: 'Data Memory' },
  { id: 'MemToRegMux', sub: 'Selects the data written back to the register file.', title: 'MemToReg MUX' },
  { id: 'Add4', sub: 'Adds 4 to the current PC to get the next sequential instruction address.', title: 'PC + 4 Adder' },
  { id: 'LS2', sub: 'Shifts the sign-extended immediate left by 2 for branch target calculation.', title: 'Left Shift 2' },
  { id: 'BranchAdder', sub: 'Adds PC + 4 to the shifted offset to compute the branch target.', title: 'Branch Adder' },
  { id: 'PCSrcMux', sub: 'Selects the next value written into the PC.', title: 'PCSrc MUX' }
]
interface Edit {
  mem: Record<number, number>
  memStart: number
  memWords: number
  pc: number
  regs: Record<number, number>
  setMem: (addr: number, v: number) => void
  setMemRange: (start: number, words: number) => void
  setPc: (v: number) => void
  setReg: (n: number, v: number) => void
}
const Row = ({ k, v, hot }: { hot?: boolean; k: string; v: string }): React.JSX.Element => (
  <div
    className={cn('flex justify-between gap-3 px-3 py-1', hot === true && 'bg-[#22d3ee]/10 text-[#22d3ee]')}
    title={glossaryFor(k)}>
    <span className='text-muted-foreground'>{k}</span>
    <span className='text-foreground'>{v}</span>
  </div>
)
const EditRow = ({
  k,
  v,
  fmt,
  onChange
}: {
  fmt: Fmt
  k: string
  onChange: (n: number) => void
  v: number
}): React.JSX.Element => (
  <label className='flex items-center justify-between gap-3 px-3 py-1' title={glossaryFor(k)}>
    <span className='text-muted-foreground'>{k}</span>
    <input
      aria-label={k}
      className='w-28 rounded border bg-background px-1 text-right'
      onChange={e => onChange(parseNum(e.target.value))}
      type='text'
      value={fmtNum(v, fmt)}
    />
  </label>
)
const DatapathPanel = ({
  control,
  values,
  after,
  before,
  activeComponents,
  step,
  edit
}: {
  activeComponents: readonly string[]
  after: MachineState
  before: MachineState
  control: ControlSignals
  edit?: Edit
  step: Step
  values: Record<string, string>
}): React.JSX.Element => {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<Tab>('Val')
  const [fmt, setFmt] = useState<Fmt>('dec')
  const [memStartDraft, setMemStartDraft] = useState('0')
  const [memWordsDraft, setMemWordsDraft] = useState('8')
  const mem = Object.entries(after.dataMemory)
  const active = new Set(activeComponents)
  const memRange =
    edit === undefined
      ? []
      : Array.from({ length: Math.max(0, Math.min(64, edit.memWords)) }, (_, i) => edit.memStart + i * 4)
  return (
    <div className='absolute top-0 right-0 bottom-0 flex items-stretch'>
      <button
        aria-label={open ? 'hide details' : 'show details'}
        className={cn('my-auto flex w-7 flex-col items-center gap-1 rounded-l-lg py-3 text-[10px] tracking-wide', PANEL)}
        onClick={() => setOpen(o => !o)}
        type='button'>
        {open ? <ChevronLeft className='size-4 rotate-180' /> : <PanelRight className='size-4' />}
        {open ? undefined : <span className='[writing-mode:vertical-rl]'>DETAILS</span>}
      </button>
      {open ? (
        <div className={cn('flex w-[27rem] flex-col overflow-hidden font-mono text-xs', PANEL)}>
          <div className='flex border-b [&>button]:flex-1 [&>button]:py-2'>
            {TABS.map(t => (
              <button
                className={cn(t === tab ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/50')}
                key={t}
                onClick={() => setTab(t)}
                title={glossaryFor(t)}
                type='button'>
                {t}
              </button>
            ))}
          </div>
          <div className='flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2'>
            <p className='text-[11px] text-muted-foreground italic'>{HINT[tab]}</p>
            {tab === 'Val' || tab === 'Reg' || tab === 'Mem' ? (
              <div className='flex shrink-0 overflow-hidden rounded border text-[10px] [&>button]:px-1.5 [&>button]:py-0.5'>
                {FORMATS.map(f => (
                  <button
                    className={cn(f === fmt ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                    key={f}
                    onClick={() => setFmt(f)}
                    type='button'>
                    {f}
                  </button>
                ))}
              </div>
            ) : undefined}
          </div>
          <div className='flex-1 divide-y overflow-auto'>
            {tab === 'Val' ? Object.entries(values).map(([k, v]) => <Row k={k} key={k} v={v} />) : undefined}
            {tab === 'Reg'
              ? edit === undefined
                ? REG_NAMES.map((nm, n) => (
                    <Row
                      hot={after.registers[n as RegisterNumber] !== before.registers[n as RegisterNumber]}
                      k={nm}
                      key={nm}
                      v={fmtNum(after.registers[n as RegisterNumber], fmt)}
                    />
                  ))
                : [
                    <EditRow fmt={fmt} k='PC (start)' key='pc' onChange={edit.setPc} v={edit.pc} />,
                    ...REG_NAMES.map((nm, n) => (
                      <EditRow fmt={fmt} k={nm} key={nm} onChange={v => edit.setReg(n, v)} v={edit.regs[n] ?? 0} />
                    ))
                  ]
              : undefined}
            {tab === 'Mem' ? (
              edit === undefined ? (
                mem.length === 0 ? (
                  <div className='px-3 py-2 text-muted-foreground'>no memory writes</div>
                ) : (
                  <table className='w-full'>
                    <thead className='sticky top-0 bg-background text-left text-[10px] text-muted-foreground [&>tr>th]:px-3 [&>tr>th]:py-1'>
                      <tr>
                        <th>Addr</th>
                        <th>Hex</th>
                        <th className='text-right'>Value</th>
                      </tr>
                    </thead>
                    <tbody className='[&>tr>td]:px-3 [&>tr>td]:py-1'>
                      {mem
                        .map(([a, v]) => ({ a: Number(a), v }))
                        .toSorted((x, y) => x.a - y.a)
                        .map(r => (
                          <tr key={r.a}>
                            <td className='text-muted-foreground'>{r.a}</td>
                            <td className='text-muted-foreground'>{hexAddr(r.a)}</td>
                            <td className='text-right'>{fmtNum(r.v, fmt)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )
              ) : (
                <div className='flex flex-col'>
                  <div className='flex items-end gap-2 px-3 py-2'>
                    <label className='flex flex-col text-[10px] text-muted-foreground'>
                      Start addr
                      <input
                        aria-label='start address'
                        className='mt-0.5 w-16 rounded border bg-background px-1'
                        onChange={e => setMemStartDraft(e.target.value)}
                        type='number'
                        value={memStartDraft}
                      />
                    </label>
                    <label className='flex flex-col text-[10px] text-muted-foreground'>
                      Words
                      <input
                        aria-label='words'
                        className='mt-0.5 w-14 rounded border bg-background px-1'
                        onChange={e => setMemWordsDraft(e.target.value)}
                        type='number'
                        value={memWordsDraft}
                      />
                    </label>
                    <button
                      className='rounded bg-primary px-2 py-1 text-primary-foreground'
                      onClick={() => edit.setMemRange(Number(memStartDraft) || 0, Number(memWordsDraft) || 1)}
                      type='button'>
                      Apply
                    </button>
                  </div>
                  <table className='w-full'>
                    <thead className='sticky top-0 bg-background text-left text-[10px] text-muted-foreground [&>tr>th]:px-3 [&>tr>th]:py-1'>
                      <tr>
                        <th>Addr</th>
                        <th>Hex</th>
                        <th className='text-right'>Value</th>
                      </tr>
                    </thead>
                    <tbody className='[&>tr>td]:px-3 [&>tr>td]:py-1'>
                      {memRange.map(addr => (
                        <tr key={addr}>
                          <td className='text-muted-foreground'>{addr}</td>
                          <td className='text-muted-foreground'>{hexAddr(addr)}</td>
                          <td className='text-right'>
                            <input
                              aria-label={`mem ${addr}`}
                              className='w-24 rounded border bg-background px-1 text-right'
                              onChange={e => edit.setMem(addr, parseNum(e.target.value))}
                              type='text'
                              value={fmtNum(edit.mem[addr] ?? 0, fmt)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : undefined}
            {tab === 'Ctrl' ? Object.entries(control).map(([k, v]) => <Row k={k} key={k} v={String(v)} />) : undefined}
            {tab === 'Info'
              ? INSPECT.map(c => (
                  <div className={cn('px-3 py-2', active.has(c.id) ? 'bg-[#dc2626]/10' : 'opacity-60')} key={c.id}>
                    <div className='flex items-center gap-2 font-medium text-foreground'>
                      {c.title}
                      {active.has(c.id) ? (
                        <span className='rounded bg-[#dc2626] px-1 text-[9px] text-white'>{step}</span>
                      ) : undefined}
                    </div>
                    <div className='text-muted-foreground'>{c.sub}</div>
                  </div>
                ))
              : undefined}
          </div>
        </div>
      ) : undefined}
    </div>
  )
}
export default DatapathPanel
