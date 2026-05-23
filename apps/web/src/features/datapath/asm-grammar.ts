/** biome-ignore-all lint/suspicious/noBitwiseOperators: noise */
/** biome-ignore-all lint/nursery/noContinue: noise */
/** biome-ignore-all lint/complexity/useMaxParams: noise */
/* oxlint-disable unicorn/number-literal-case */
/* eslint-disable no-bitwise, no-continue, complexity, @typescript-eslint/max-params */
import type { Instruction, InstructionName, RegisterNumber } from '@/features/mips/types'
import { encodeInstruction, FUNCT, OPCODE } from '@/features/mips/encode'

const RE_DEC = /^\d+$/u
const RE_HEX = /^-?0x[0-9a-fA-F]+$/u
const RE_BIN = /^-?0b[01]+$/u
const RE_INT = /^-?\d+$/u
const RE_MEM = /^(?<off>-?\w+)\((?<base>\$\w+)\)$/u
const RE_LABEL = /^(?<label>[A-Za-z_]\w*):\s*/u
interface AssembleResult {
  diagnostics: Diagnostic[]
  instructions: Instruction[]
  symbols: Record<string, number>
  words: number[]
}
interface Diagnostic {
  code: string
  col: number
  len: number
  line: number
  message: string
  severity: 'error' | 'info'
}
const ALIAS: Record<string, number> = {
  at: 1,
  fp: 30,
  gp: 28,
  ra: 31,
  sp: 29,
  v0: 2,
  v1: 3,
  zero: 0
}
for (let i = 0; i < 4; i += 1) ALIAS[`a${i}`] = 4 + i
for (let i = 0; i < 8; i += 1) ALIAS[`s${i}`] = 16 + i
for (let i = 0; i < 8; i += 1) ALIAS[`t${i}`] = i < 8 ? 8 + i : i
for (let i = 8; i < 10; i += 1) ALIAS[`t${i}`] = 24 + (i - 8)
for (let i = 0; i < 2; i += 1) ALIAS[`k${i}`] = 26 + i
const R_OPS = new Set(['add', 'and', 'nor', 'or', 'sll', 'slt', 'srl', 'sub'])
const I_OPS = new Set(['addi', 'andi', 'beq', 'bne', 'lui', 'lw', 'ori', 'sw'])
const SHIFT_OPS = new Set(['sll', 'srl'])
const BRANCH_OPS = new Set(['beq', 'bne'])
const MEM_OPS = new Set(['lw', 'sw'])
const PSEUDO = new Set(['beqz', 'bnez', 'la', 'li', 'move', 'nop'])
const DIRECTIVES = new Set([
  '.align',
  '.ascii',
  '.asciiz',
  '.byte',
  '.data',
  '.globl',
  '.half',
  '.space',
  '.text',
  '.word'
])
const monarchTokens = {
  comment: /#.*$/u,
  directive: /\.[a-z]+/u,
  keyword: [...R_OPS, ...I_OPS, 'j', ...PSEUDO],
  label: /[A-Za-z_]\w*:/u,
  number: /0x[0-9a-fA-F]+|0b[01]+|-?\d+/u,
  register: /\$(?:\d+|[a-z]{1,2}\d?)/u
}
const parseRegister = (tok: string): number | undefined => {
  if (!tok.startsWith('$')) return
  const body = tok.slice(1)
  if (RE_DEC.test(body)) {
    const n = Number(body)
    return n >= 0 && n < 32 ? n : undefined
  }
  return body in ALIAS ? ALIAS[body] : undefined
}
const parseImm = (tok: string): number | undefined => {
  if (RE_HEX.test(tok)) return Number.parseInt(tok, 16)
  if (RE_BIN.test(tok)) return Number.parseInt(tok.replace('0b', ''), 2) * (tok.startsWith('-') ? -1 : 1)
  if (RE_INT.test(tok)) return Number.parseInt(tok, 10)
}
const stripComment = (line: string): string => {
  const h = line.indexOf('#')
  return h === -1 ? line : line.slice(0, h)
}
const splitOperands = (s: string): string[] =>
  s
    .trim()
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
const expandPseudo = (op: string, args: string[]): string[][] => {
  if (op === 'nop') return [['sll', '$zero', '$zero', '0']]
  if (op === 'move') return [['add', args[0] ?? '', args[1] ?? '', '$zero']]
  if (op === 'li') {
    const v = parseImm(args[1] ?? '') ?? 0
    if (v >= -32_768 && v < 32_768) return [['addi', args[0] ?? '', '$zero', String(v)]]
    return [
      ['lui', '$at', String((v >>> 16) & 0xff_ff)],
      ['ori', args[0] ?? '', '$at', String(v & 0xff_ff)]
    ]
  }
  if (op === 'la')
    return [
      ['lui', '$at', '0'],
      ['ori', args[0] ?? '', '$at', args[1] ?? '0']
    ]
  if (op === 'beqz') return [['beq', args[0] ?? '', '$zero', args[1] ?? '']]
  if (op === 'bnez') return [['bne', args[0] ?? '', '$zero', args[1] ?? '']]
  return [[op, ...args]]
}
const err = (line: number, col: number, len: number, code: string, message: string): Diagnostic => ({
  code,
  col,
  len,
  line,
  message,
  severity: 'error'
})
const toInstruction = (
  op: string,
  args: string[],
  ctx: { idx: number; line: number; symbols: Record<string, number> }
): Diagnostic | Instruction => {
  const rn = (t: string): RegisterNumber | undefined => parseRegister(t) as RegisterNumber | undefined
  const name = op as InstructionName
  if (R_OPS.has(op)) {
    if (SHIFT_OPS.has(op)) {
      const rd = rn(args[0] ?? '')
      const rt = rn(args[1] ?? '')
      const sh = parseImm(args[2] ?? '')
      if (rd === undefined || rt === undefined || sh === undefined)
        return err(ctx.line, 0, op.length, 'ASM_SYNTAX_ERROR', `bad operands for ${op}`)
      return { funct: FUNCT[op as 'sll' | 'srl'], name, rd, rs: 0, rt, shamt: sh & 0x1f, type: 'R' }
    }
    const rd = rn(args[0] ?? '')
    const rs = rn(args[1] ?? '')
    const rt = rn(args[2] ?? '')
    if (rd === undefined || rs === undefined || rt === undefined)
      return err(ctx.line, 0, op.length, 'ASM_REGISTER_INVALID', `bad register for ${op}`)
    return { funct: FUNCT[op as keyof typeof FUNCT], name, rd, rs, rt, shamt: 0, type: 'R' }
  }
  if (op === 'j') {
    const target = ctx.symbols[args[0] ?? ''] ?? parseImm(args[0] ?? '')
    if (target === undefined) return err(ctx.line, 0, 1, 'ASM_UNDEFINED_LABEL', `undefined label ${args[0]}`)
    return { name, opcode: OPCODE.j, target: target >>> 2, type: 'J' }
  }
  if (I_OPS.has(op)) {
    const opcode = OPCODE[op as keyof typeof OPCODE]
    if (MEM_OPS.has(op)) {
      const rt = rn(args[0] ?? '')
      const m = RE_MEM.exec(args[1] ?? '')
      const off = m ? (parseImm(m.groups?.off ?? '') ?? 0) : 0
      const base = m ? rn(m.groups?.base ?? '') : undefined
      if (rt === undefined || base === undefined)
        return err(ctx.line, 0, op.length, 'ASM_SYNTAX_ERROR', `bad ${op}, expect rt, off(base)`)
      return { imm: off, name, opcode, rs: base, rt, type: 'I' }
    }
    if (BRANCH_OPS.has(op)) {
      const rs = rn(args[0] ?? '')
      const rt = rn(args[1] ?? '')
      const dest = ctx.symbols[args[2] ?? '']
      if (rs === undefined || rt === undefined)
        return err(ctx.line, 0, op.length, 'ASM_REGISTER_INVALID', `bad register for ${op}`)
      if (dest === undefined) return err(ctx.line, 0, 1, 'ASM_UNDEFINED_LABEL', `undefined label ${args[2]}`)
      return { imm: (dest - (ctx.idx + 1) * 4) >> 2, name, opcode, rs, rt, type: 'I' }
    }
    if (op === 'lui') {
      const rt = rn(args[0] ?? '')
      const imm = parseImm(args[1] ?? '')
      if (rt === undefined || imm === undefined) return err(ctx.line, 0, 3, 'ASM_SYNTAX_ERROR', 'bad lui')
      return { imm, name, opcode, rs: 0, rt, type: 'I' }
    }
    const rt = rn(args[0] ?? '')
    const rs = rn(args[1] ?? '')
    const imm = parseImm(args[2] ?? '')
    if (rt === undefined || rs === undefined || imm === undefined)
      return err(ctx.line, 0, op.length, 'ASM_SYNTAX_ERROR', `bad operands for ${op}`)
    if (imm < -32_768 || imm > 65_535) return err(ctx.line, 0, op.length, 'ASM_IMMEDIATE_RANGE', 'immediate out of range')
    return { imm, name, opcode, rs, rt, type: 'I' }
  }
  return err(ctx.line, 0, op.length, 'ISA_UNSUPPORTED', `unsupported instruction ${op}`)
}
const assemble = (source: string): AssembleResult => {
  const rawLines = source.split('\n')
  const symbols: Record<string, number> = {}
  const pending: { args: string[]; line: number; op: string }[] = []
  const diagnostics: Diagnostic[] = []
  let addr = 0
  for (let i = 0; i < rawLines.length; i += 1) {
    const code = stripComment(rawLines[i] ?? '').trim()
    if (code.length === 0) continue
    let rest = code
    const lm = RE_LABEL.exec(rest)
    if (lm) {
      const label = lm.groups?.label ?? ''
      if (label in symbols)
        diagnostics.push(err(i, 0, label.length, 'ASM_DUPLICATE_LABEL', `label ${label} defined twice`))
      symbols[label] = addr
      rest = rest.slice(lm[0].length).trim()
    }
    if (rest.length === 0) continue
    const sp = rest.indexOf(' ')
    const op = (sp === -1 ? rest : rest.slice(0, sp)).toLowerCase()
    const argStr = sp === -1 ? '' : rest.slice(sp + 1)
    if (DIRECTIVES.has(op)) continue
    const args = splitOperands(argStr)
    const expansions = PSEUDO.has(op) ? expandPseudo(op, args) : [[op, ...args]]
    for (const ex of expansions) {
      pending.push({ args: ex.slice(1), line: i, op: ex[0] ?? '' })
      addr += 4
    }
  }
  const instructions: Instruction[] = []
  const words: number[] = []
  for (let idx = 0; idx < pending.length; idx += 1) {
    const p = pending[idx]
    if (p === undefined) continue
    const out = toInstruction(p.op, p.args, { idx, line: p.line, symbols })
    if ('severity' in out) {
      diagnostics.push(out)
      continue
    }
    instructions.push(out)
    words.push(Math.trunc(encodeInstruction(out)))
  }
  return { diagnostics, instructions, symbols, words }
}
export { ALIAS, assemble, DIRECTIVES, monarchTokens, parseImm, parseRegister }
export type { AssembleResult, Diagnostic }
