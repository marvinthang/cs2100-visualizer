/** biome-ignore-all lint/suspicious/noBitwiseOperators: bit-field decode */
/* oxlint-disable unicorn/consistent-function-scoping, unicorn/number-literal-case */
/* eslint-disable no-bitwise */
'use client'
import { X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { Step } from '@/features/datapath/generated/stepTraces'
import type {
  ControlSignalId,
  DatapathInspectID,
  DatapathSegment,
  DatapathValueId,
  EncodedField,
  EncodedInstruction,
  RuntimeControlSignals
} from '@/features/datapath/ref-demo/ref-types'
import type { ControlSignals } from '@/features/mips/types'
import { activePaths } from '@/features/datapath/generated/stepTraces'
import { getDatapathHighlightState, getHighlightSvgFill } from '@/features/datapath/ref-demo/ref-highlight'
import StaticDatapathSvg from '@/features/datapath/ref-demo/static-datapath-svg'
import { PATH_SEGMENTS } from '@/features/datapath/scene-2d/datapath-graph'

const ACTIVE = '#dc2626'
const BASE = { h: 880, w: 1320, x: -40, y: -40 }
const INSPECT: Record<string, { sub: string; title: string }> = {
  ADD4: { sub: 'Adds 4 to the current PC to get the next sequential instruction address.', title: 'PC + 4 Adder' },
  ALU: { sub: 'Computes arithmetic or logic results from two input operands.', title: 'Arithmetic Logic Unit (ALU)' },
  ALUSRC_MUX: { sub: 'Selects the second input to the ALU.', title: 'ALUSrc MUX' },
  BRANCH_ADDER: { sub: 'Adds PC + 4 to the shifted offset to compute the branch target.', title: 'Branch Adder' },
  DATA_MEMORY: { sub: 'Reads from or writes to memory using the ALU result as address.', title: 'Data Memory' },
  INSTRUCTION_MEMORY: {
    sub: 'Uses the PC as an address and outputs the instruction stored there.',
    title: 'Instruction Memory'
  },
  INSTRUCTION_REGISTER: {
    sub: 'Holds the fetched instruction and exposes its bit fields to the datapath.',
    title: 'Instruction Register'
  },
  LEFT_SHIFT_2: {
    sub: 'Shifts the sign-extended immediate left by 2 for branch target calculation.',
    title: 'Left Shift 2'
  },
  MEMTOREG_MUX: { sub: 'Selects the data written back to the register file.', title: 'MemToReg MUX' },
  PC: { sub: 'Stores the address of the current instruction.', title: 'Program Counter (PC)' },
  PCSRC_MUX: { sub: 'Selects the next value written into the PC.', title: 'PCSrc MUX' },
  REGDST_MUX: { sub: 'Selects which instruction field becomes the register-file write address.', title: 'RegDst MUX' },
  REGISTER_FILE: {
    sub: 'Reads two source registers and optionally writes one destination register.',
    title: 'Register File'
  },
  SIGN_EXTEND: { sub: 'Extends the 16-bit immediate field into a 32-bit signed value.', title: 'Sign Extend' }
}
const field = (value: number, width: number): EncodedField => {
  const v = Math.trunc(value)
  return { bin: v.toString(2).padStart(width, '0').slice(-width), dec: String(v), hex: `0x${v.toString(16)}` }
}
const buildBits = (word: number): EncodedInstruction => ({
  address: field(word & 0x3_ff_ff_ff, 26),
  full: field(word, 32),
  funct: field(word & 0x3f, 6),
  immediate: field(word & 0xff_ff, 16),
  opcode: field((word >>> 26) & 0x3f, 6),
  rd: field((word >>> 11) & 0x1f, 5),
  rs: field((word >>> 21) & 0x1f, 5),
  rt: field((word >>> 16) & 0x1f, 5),
  shamt: field((word >>> 6) & 0x1f, 5)
})
const toRefSignals = (c: ControlSignals): RuntimeControlSignals => ({
  ALUOp: c.ALUOp === 0 ? '00' : c.ALUOp === 1 ? '01' : '10',
  ALUSrc: c.ALUSrc,
  Branch: c.Branch,
  BranchNE: c.BranchNE,
  MemRead: c.MemRead,
  MemToReg: c.MemToReg,
  MemWrite: c.MemWrite,
  RegDst: c.RegDst,
  RegWrite: c.RegWrite
})
const RefDatapath2D = ({
  control,
  step,
  word
}: {
  control: ControlSignals
  step: Step
  word: number
}): React.JSX.Element => {
  const [focused, setFocused] = useState<DatapathInspectID | null>(null)
  const [view, setView] = useState(BASE)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<null | { ox: number; oy: number; vx: number; vy: number }>(null)
  const rafRef = useRef(0)
  const prevRef = useRef(BASE)
  const bits = useMemo(() => buildBits(word), [word])
  const signals = useMemo(() => toRefSignals(control), [control])
  const activeSegs = useMemo(() => {
    const s = new Set<string>()
    for (const id of activePaths(control, step)) for (const seg of PATH_SEGMENTS[id] ?? []) s.add(seg)
    return s
  }, [control, step])
  const highlight = useMemo(() => getDatapathHighlightState(step, signals, signals, {}), [step, signals])
  const animateTo = (target: typeof BASE): void => {
    cancelAnimationFrame(rafRef.current)
    const from = view
    const t0 = performance.now()
    const tick = (t: number): void => {
      const k = Math.min(1, (t - t0) / 260)
      const e = 1 - (1 - k) ** 3
      setView({
        h: from.h + (target.h - from.h) * e,
        w: from.w + (target.w - from.w) * e,
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e
      })
      if (k < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  const onInspect = (id: DatapathInspectID, el?: null | SVGGraphicsElement): void => {
    if (focused === id) {
      setFocused(null)
      animateTo(prevRef.current)
      return
    }
    if (focused === null) prevRef.current = view
    setFocused(id)
    if (el) {
      const b = el.getBBox()
      const w = BASE.w / 1.8
      const h = BASE.h / 1.8
      animateTo({ h, w, x: b.x + b.width / 2 - w * 0.42, y: b.y + b.height / 2 - h / 2 })
    }
  }
  const onWheel = (e: React.WheelEvent): void => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (r === undefined) return
    const f = e.deltaY > 0 ? 1.1 : 0.9
    const sx = view.x + ((e.clientX - r.left) / r.width) * view.w
    const sy = view.y + ((e.clientY - r.top) / r.height) * view.h
    const w = Math.min(1800, Math.max(150, view.w * f))
    const h = w / (BASE.w / BASE.h)
    setView({ h, w, x: sx - ((e.clientX - r.left) / r.width) * w, y: sy - ((e.clientY - r.top) / r.height) * h })
  }
  const onMove = (e: React.PointerEvent): void => {
    const d = dragRef.current
    const r = wrapRef.current?.getBoundingClientRect()
    if (d === null || r === undefined) return
    setView(v => ({
      ...v,
      x: d.vx - ((e.clientX - d.ox) / r.width) * v.w,
      y: d.vy - ((e.clientY - d.oy) / r.height) * v.h
    }))
  }
  const wireStroke = (id: DatapathSegment): string => (activeSegs.has(id) ? ACTIVE : 'black')
  const wireStrokeWidth = (id: DatapathSegment): number => (activeSegs.has(id) ? 2.3 : 1.5)
  const wireArrow = (id: DatapathSegment): string => (activeSegs.has(id) ? 'url(#arrow-red)' : 'url(#arrow-black)')
  const signalFill = (): string => '#2C1AF4'
  const muxFill = (s: ControlSignalId): string => getHighlightSvgFill(highlight.controls[s] ?? 'normal')
  const valueFill = (id: DatapathValueId): string => getHighlightSvgFill(highlight.values[id] ?? 'normal')
  const info = focused === null ? undefined : INSPECT[focused]
  return (
    <div className='absolute inset-0 overflow-hidden' data-testid='datapath-canvas'>
      <div
        className='size-full cursor-grab touch-none active:cursor-grabbing'
        onPointerDown={e => {
          dragRef.current = { ox: e.clientX, oy: e.clientY, vx: view.x, vy: view.y }
        }}
        onPointerLeave={() => {
          dragRef.current = null
        }}
        onPointerMove={onMove}
        onPointerUp={() => {
          dragRef.current = null
        }}
        onWheel={onWheel}
        ref={wrapRef}>
        <StaticDatapathSvg
          bits={bits}
          muxFill={muxFill}
          onInspect={onInspect}
          selectedInspectId={focused}
          signalFill={signalFill}
          signals={signals}
          valueFill={valueFill}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          wireArrow={wireArrow}
          wireFill={wireStroke}
          wireStroke={wireStroke}
          wireStrokeWidth={wireStrokeWidth}
        />
      </div>
      {info === undefined ? undefined : (
        <div className='absolute bottom-6 left-6 w-72 rounded-xl border bg-background/90 p-4 shadow-lg backdrop-blur-md'>
          <div className='flex items-start justify-between gap-2'>
            <span className='font-medium text-sm'>{info.title}</span>
            <button
              aria-label='close'
              onClick={() => {
                if (focused !== null) onInspect(focused)
              }}
              type='button'>
              <X className='size-4' />
            </button>
          </div>
          <p className='mt-1 text-muted-foreground text-xs'>{info.sub}</p>
        </div>
      )}
    </div>
  )
}
export default RefDatapath2D
