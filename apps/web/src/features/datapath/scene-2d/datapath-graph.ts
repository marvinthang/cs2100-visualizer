/* eslint-disable complexity */
import { PATHS } from '@/features/datapath/generated/topology'

interface Node {
  h: number
  id: string
  kind: 'alu' | 'const' | 'gate' | 'mem' | 'mux'
  label: string
  w: number
  x: number
  y: number
}
const VW = 1100
const VH = 640
const NODES: Node[] = [
  { h: 90, id: 'PCSrcMux', kind: 'mux', label: 'MUX', w: 26, x: 48, y: 300 },
  { h: 64, id: 'PC', kind: 'mem', label: 'PC', w: 40, x: 120, y: 300 },
  { h: 88, id: 'IM', kind: 'mem', label: 'Instr\nMem', w: 98, x: 250, y: 300 },
  { h: 120, id: 'IR', kind: 'mem', label: 'IR', w: 40, x: 372, y: 300 },
  { h: 50, id: 'Add4', kind: 'mem', label: 'Add', w: 58, x: 250, y: 96 },
  { h: 26, id: 'CONST4', kind: 'const', label: '4', w: 24, x: 168, y: 150 },
  { h: 66, id: 'Control', kind: 'mem', label: 'Control', w: 92, x: 452, y: 90 },
  { h: 124, id: 'RF', kind: 'mem', label: 'Registers', w: 108, x: 512, y: 300 },
  { h: 76, id: 'RegDstMux', kind: 'mux', label: 'MUX', w: 26, x: 452, y: 440 },
  { h: 64, id: 'SE', kind: 'mem', label: 'Sign\nExtend', w: 62, x: 512, y: 488 },
  { h: 36, id: 'LS2', kind: 'mem', label: '<<2', w: 50, x: 446, y: 186 },
  { h: 58, id: 'BranchAdder', kind: 'mem', label: 'Add', w: 58, x: 656, y: 132 },
  { h: 88, id: 'ALUSrcMux', kind: 'mux', label: 'MUX', w: 26, x: 624, y: 320 },
  { h: 100, id: 'ALU', kind: 'alu', label: 'ALU', w: 74, x: 716, y: 300 },
  { h: 48, id: 'ALUControl', kind: 'mem', label: 'ALU\nCtrl', w: 76, x: 686, y: 470 },
  { h: 28, id: 'Zero', kind: 'gate', label: 'Zero', w: 38, x: 812, y: 150 },
  { h: 30, id: 'NotGate', kind: 'gate', label: 'NOT', w: 34, x: 812, y: 96 },
  { h: 34, id: 'BeqAnd', kind: 'gate', label: 'AND', w: 38, x: 888, y: 174 },
  { h: 34, id: 'BneAnd', kind: 'gate', label: 'AND', w: 38, x: 888, y: 96 },
  { h: 34, id: 'OrGate', kind: 'gate', label: 'OR', w: 36, x: 958, y: 134 },
  { h: 86, id: 'DM', kind: 'mem', label: 'Data\nMem', w: 102, x: 852, y: 336 },
  { h: 88, id: 'MemToRegMux', kind: 'mux', label: 'MUX', w: 26, x: 956, y: 336 },
  { h: 60, id: 'WB', kind: 'mem', label: 'WB', w: 30, x: 1036, y: 336 }
]
const JUNCTIONS: Record<string, { x: number; y: number }> = {
  ADD4_JUNCTION: { x: 320, y: 96 },
  ALU_JUMP: { x: 792, y: 372 },
  ALU_JUNCTION: { x: 792, y: 300 },
  MEMTOREG_MUX_JUMP: { x: 996, y: 300 },
  PC_JUNCTION: { x: 184, y: 300 },
  RD2_JUMP: { x: 580, y: 372 },
  RD2_JUNCTION: { x: 580, y: 340 },
  RT_JUNCTION: { x: 424, y: 344 },
  SE_JUMP1: { x: 576, y: 556 },
  SE_JUMP2: { x: 420, y: 556 },
  SE_JUNCTION: { x: 576, y: 488 }
}
const PATH_SEGMENTS: Record<string, string[]> = {
  ADD4_TO_BRANCH_ADDER0: ['ADD4_TO_ADD4_JUNCTION', 'ADD4_JUNCTION', 'ADD4_JUNCTION_TO_BRANCH_ADDER0'],
  ADD4_TO_PCSRC_MUX0: ['ADD4_TO_ADD4_JUNCTION', 'ADD4_JUNCTION', 'ADD4_JUNCTION_TO_PCSRC_MUX0'],
  ALU_TO_DM_ADDR: ['ALU_TO_ALU_JUNCTION', 'ALU_JUNCTION', 'ALU_JUNCTION_TO_DM_ADDR'],
  ALU_TO_MEMTOREG_MUX0: [
    'ALU_TO_ALU_JUNCTION',
    'ALU_JUNCTION',
    'ALU_JUNCTION_ALU_JUMP',
    'ALU_JUMP',
    'ALU_JUMP_TO_MEMTOREG_MUX0'
  ],
  CONST4_TO_ADD4: ['CONST4_TO_ADD4'],
  DM_RD_TO_MEMTOREG_MUX1: ['DM_RD_TO_MEMTOREG_MUX1'],
  IM_TO_IR: ['IM_TO_IR'],
  IR_IMM_TO_SIGN_EXTEND: ['IR_IMM_TO_SIGN_EXTEND'],
  IR_RD_TO_REGDST_MUX1: ['IR_RD_TO_REGDST_MUX1'],
  IR_RS_TO_RF_RR1: ['IR_RS_TO_RF_RR1'],
  IR_RT_TO_REGDST_MUX0: ['IR_RT_TO_RT_JUNCTION', 'RT_JUNCTION', 'RT_JUNCTION_TO_REGDST_MUX0'],
  IR_RT_TO_RF_RR2: ['IR_RT_TO_RT_JUNCTION', 'RT_JUNCTION', 'RT_JUNCTION_TO_RF_RR2'],
  LEFT_SHIFT_2_TO_BRANCH_ADDER1: ['LEFT_SHIFT_2_TO_BRANCH_ADDER1'],
  MEMTOREG_MUX_TO_RF_WD: ['MEMTOREG_MUX_TO_MEMTOREG_MUX_JUMP', 'MEMTOREG_MUX_JUMP', 'MEMTOREG_MUX_JUMP_TO_RF_WD'],
  PCSRC_MUX_TO_PC: ['PCSRC_MUX_TO_PC'],
  PC_TO_ADD4: ['PC_TO_PC_JUNCTION', 'PC_JUNCTION', 'PC_JUNCTION_TO_ADD4'],
  PC_TO_IM: ['PC_TO_PC_JUNCTION', 'PC_JUNCTION', 'PC_JUNCTION_TO_IM'],
  REGDST_MUX_TO_RF_WR: ['REGDST_MUX_TO_RF_WR'],
  RF_RD1_TO_ALU1: ['RF_RD1_TO_ALU1'],
  RF_RD2_TO_ALUSRC_MUX0: ['RF_RD2_TO_RD2_JUNCTION', 'RD2_JUNCTION', 'RD2_JUNCTION_TO_ALUSRC_MUX0'],
  RF_RD2_TO_DM_WD: ['RF_RD2_TO_RD2_JUNCTION', 'RD2_JUNCTION', 'RD2_JUNCTION_TO_RD2_JUMP', 'RD2_JUMP', 'RD2_JUMP_TO_DM_WD'],
  SIGN_EXTEND_TO_ALUSRC_MUX1: ['SIGN_EXTEND_TO_SE_JUNCTION', 'SE_JUNCTION', 'SE_JUNCTION_TO_ALUSRC_MUX1'],
  SIGN_EXTEND_TO_LEFT_SHIFT_2: [
    'SIGN_EXTEND_TO_SE_JUNCTION',
    'SE_JUNCTION',
    'SE_JUNCTION_TO_SE_JUMP1',
    'SE_JUMP1',
    'SE_JUMP1_TO_SE_JUMP2',
    'SE_JUMP2',
    'SE_JUMP2_TO_LEFT_SHIFT_2'
  ]
}
const NODE_3D: Record<string, { p: [number, number, number]; s: [number, number, number] }> = {
  ALU: { p: [1, 0, 0], s: [1.6, 1.8, 1.4] },
  ALUControl: { p: [0, -2.6, 0], s: [1.2, 0.9, 1] },
  ALUSrcMux: { p: [-0.5, -0.4, 0], s: [0.7, 1, 0.7] },
  Add4: { p: [-9, 3, 0], s: [1.2, 1, 1] },
  BeqAnd: { p: [3.6, 2.2, 0], s: [0.6, 0.6, 0.6] },
  BneAnd: { p: [4.6, 1.6, 0], s: [0.6, 0.6, 0.6] },
  BranchAdder: { p: [-2, 3.4, 0], s: [1.2, 1, 1] },
  CONST4: { p: [-9.9, 1.8, 0], s: [0.5, 0.5, 0.5] },
  Control: { p: [-3, 3.6, 0], s: [1.8, 1, 1.2] },
  DM: { p: [4.5, 0, 0], s: [1.8, 2, 1.4] },
  IM: { p: [-8.5, 0, 0], s: [1.8, 2, 1.4] },
  IR: { p: [-6, 0, 0], s: [1, 2.4, 1] },
  LS2: { p: [-4, 3, 0], s: [0.9, 0.9, 0.9] },
  MemToRegMux: { p: [7, 0, 0], s: [0.7, 1, 0.7] },
  NotGate: { p: [3.6, 1, 0], s: [0.5, 0.5, 0.5] },
  OrGate: { p: [5.6, 2.2, 0], s: [0.6, 0.6, 0.6] },
  PC: { p: [-11, 0, 0], s: [1.2, 1.6, 1.2] },
  PCSrcMux: { p: [-12.5, 1.4, 0], s: [0.7, 1, 0.7] },
  RF: { p: [-3, 0, 0], s: [1.8, 2.4, 1.4] },
  RegDstMux: { p: [-1.5, 1.4, 0], s: [0.7, 1, 0.7] },
  SE: { p: [-4, -1.5, 0], s: [0.9, 0.9, 0.9] },
  WB: { p: [9, 0, 0], s: [0.8, 1.2, 0.8] },
  Zero: { p: [2.6, 1, 0], s: [0.6, 0.6, 0.6] }
}
const JUNCTION_3D: Record<string, [number, number, number]> = {
  ADD4_JUNCTION: [-7.4, 3, 0],
  ALU_JUMP: [2.3, -1, 0],
  ALU_JUNCTION: [2.3, 0, 0],
  MEMTOREG_MUX_JUMP: [8, 0, 0],
  PC_JUNCTION: [-10, 0, 0],
  RD2_JUMP: [-1.6, -1.6, 0],
  RD2_JUNCTION: [-1.6, -0.8, 0],
  RT_JUNCTION: [-5, -0.7, 0],
  SE_JUMP1: [-2.6, -2.7, 0],
  SE_JUMP2: [-4.6, -2.7, 0],
  SE_JUNCTION: [-2.6, -1.5, 0]
}
const MEMCOLOR = '#caa84a'
const WHITE = '#dfe6ef'
const NODE_COLOR: Record<string, string> = {
  ALU: WHITE,
  ALUControl: WHITE,
  ALUSrcMux: WHITE,
  Add4: WHITE,
  BeqAnd: '#eab308',
  BneAnd: '#eab308',
  BranchAdder: WHITE,
  CONST4: '#9aa3ad',
  Control: WHITE,
  DM: '#2fae6a',
  IM: MEMCOLOR,
  IR: WHITE,
  LS2: WHITE,
  MemToRegMux: WHITE,
  NotGate: '#eab308',
  OrGate: '#eab308',
  PC: '#9aa3ad',
  PCSrcMux: WHITE,
  RF: MEMCOLOR,
  RegDstMux: WHITE,
  SE: WHITE,
  WB: WHITE,
  Zero: '#eab308'
}
const NODE_POS = new Map(NODES.map(n => [n.id, { x: n.x, y: n.y }]))
const PATH_FT = new Map(PATHS.map(p => [p.id, { from: p.from, to: p.to }]))
const RE_CONTROL = /^CONTROL_|_TO_CONTROL$|^ALUOP_|_TO_ALU_CONTROL$|^IR_OPCODE_/u
const isControlPath = (id: string): boolean => RE_CONTROL.test(id)
const resolveNode = (token: string): string => {
  if (token in JUNCTIONS) return token
  if (token.startsWith('PCSRC_MUX')) return 'PCSrcMux'
  if (token.startsWith('REGDST_MUX')) return 'RegDstMux'
  if (token.startsWith('ALUSRC_MUX')) return 'ALUSrcMux'
  if (token.startsWith('MEMTOREG_MUX')) return 'MemToRegMux'
  if (token.startsWith('ALU_CONTROL')) return 'ALUControl'
  if (token.startsWith('ALU_ZERO')) return 'Zero'
  if (token.startsWith('NOT_GATE')) return 'NotGate'
  if (token.startsWith('BEQ_AND_GATE')) return 'BeqAnd'
  if (token.startsWith('BNE_AND_GATE')) return 'BneAnd'
  if (token.startsWith('OR_GATE')) return 'OrGate'
  if (token.startsWith('ALU')) return 'ALU'
  if (token.startsWith('SIGN_EXTEND')) return 'SE'
  if (token.startsWith('LEFT_SHIFT_2')) return 'LS2'
  if (token.startsWith('BRANCH_ADDER')) return 'BranchAdder'
  if (token.startsWith('ADD4')) return 'Add4'
  if (token.startsWith('CONST4')) return 'CONST4'
  if (token.startsWith('IM')) return 'IM'
  if (token.startsWith('IR')) return 'IR'
  if (token.startsWith('RF')) return 'RF'
  if (token.startsWith('DM')) return 'DM'
  if (token.startsWith('CONTROL')) return 'Control'
  if (token.startsWith('PC')) return 'PC'
  return token
}
const posOf = (id: string): { x: number; y: number } => NODE_POS.get(id) ?? JUNCTIONS[id] ?? { x: 0, y: 0 }
const posOf3 = (id: string): [number, number, number] => NODE_3D[id]?.p ?? JUNCTION_3D[id] ?? [0, 0, 0]
const nodeSeq = (id: string): string[] => {
  const segs = PATH_SEGMENTS[id]
  if (segs === undefined) {
    const ft = PATH_FT.get(id)
    return ft === undefined ? [] : [ft.from, ft.to]
  }
  const ids: string[] = []
  for (const seg of segs)
    for (const part of seg.split('_TO_')) {
      const n = resolveNode(part)
      if (ids.at(-1) !== n) ids.push(n)
    }
  return ids
}
const pathPoints = (id: string): { x: number; y: number }[] => nodeSeq(id).map(posOf)
const pathPoints3D = (id: string): [number, number, number][] => nodeSeq(id).map(posOf3)
export {
  isControlPath,
  JUNCTION_3D,
  JUNCTIONS,
  NODE_3D,
  NODE_COLOR,
  NODES,
  PATH_SEGMENTS,
  pathPoints,
  pathPoints3D,
  VH,
  VW
}
export type { Node }
