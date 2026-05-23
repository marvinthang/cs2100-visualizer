/* eslint-disable complexity, @typescript-eslint/max-params, @typescript-eslint/no-unnecessary-condition */
import type { ControlSignalId, DatapathValueId, RuntimeControlSignals } from '@/features/datapath/ref-demo/ref-types'

interface DatapathHighlightState {
  controls: Partial<Record<ControlSignalId, HighlightRole>>
  values: Partial<Record<DatapathValueId, HighlightRole>>
}
type DatapathStep = 'EX' | 'ID' | 'IF' | 'MEM' | 'WB'
interface ExecutionContext {
  branchTaken?: boolean
}
type HighlightRole = 'control' | 'input' | 'modified' | 'normal' | 'output'
interface StepValueHighlights {
  controls: ControlSignalId[]
  inputs: DatapathValueId[]
  outputs: DatapathValueId[]
}
const getHighlightSvgFill = (role: HighlightRole): string => {
  if (role === 'input') return '#2563eb'
  if (role === 'output') return '#16a34a'
  if (role === 'control') return '#dc2626'
  if (role === 'modified') return '#ea580c'
  return 'black'
}
const stepValueHighlights = (
  step: DatapathStep,
  signals: RuntimeControlSignals,
  context: ExecutionContext
): StepValueHighlights => {
  if (step === 'IF') return { controls: [], inputs: ['PC'], outputs: ['IM_ADDRESS', 'IM_INSTRUCTION', 'ADD4'] }
  if (step === 'ID')
    return {
      controls: ['RegDst'],
      inputs: [
        'IR_OPCODE',
        'IR_RS',
        'IR_RT',
        ...(signals.RegDst === 1 ? (['IR_RD'] as DatapathValueId[]) : []),
        'IR_IMMEDIATE'
      ],
      outputs: [
        'RF_RR1',
        'RF_RR2',
        ...(signals.RegDst === 'X' ? [] : (['RF_WR'] as DatapathValueId[])),
        'RF_RD1',
        'RF_RD2',
        'SIGN_EXTEND'
      ]
    }
  if (step === 'EX')
    return {
      controls: ['ALUSrc', 'ALUOp'],
      inputs: [
        'RF_RD1',
        ...(signals.ALUSrc === 1 || signals.Branch === 1 || signals.BranchNE === 1
          ? (['SIGN_EXTEND'] as DatapathValueId[])
          : []),
        ...(signals.ALUSrc === 0 ? (['RF_RD2'] as DatapathValueId[]) : []),
        ...(signals.Branch === 1 || signals.BranchNE === 1 ? (['ADD4'] as DatapathValueId[]) : [])
      ],
      outputs: [
        'ALU_OP1',
        'ALU_OP2',
        'ALU_RESULT',
        'ALU_ZERO',
        ...(signals.Branch === 1 || signals.BranchNE === 1 ? (['LEFT_SHIFT_2', 'BRANCH_ADDER'] as DatapathValueId[]) : [])
      ]
    }
  if (step === 'MEM')
    return {
      controls: ['MemRead', 'MemWrite', 'Branch', 'BranchNE', 'PCSrc'],
      inputs: [
        'ALU_RESULT',
        'RF_RD2',
        ...(context.branchTaken === undefined
          ? []
          : context.branchTaken
            ? (['BRANCH_ADDER'] as DatapathValueId[])
            : (['ADD4'] as DatapathValueId[])),
        ...(signals.Branch === 1 || signals.BranchNE === 1 ? (['ALU_ZERO'] as DatapathValueId[]) : [])
      ],
      outputs: [
        'DM_ADDRESS',
        ...(signals.MemRead === 1 ? (['DM_READ_DATA'] as DatapathValueId[]) : []),
        'DM_WRITE_DATA',
        'PC'
      ]
    }
  if (step === 'WB')
    return {
      controls: ['MemToReg', 'RegWrite'],
      inputs:
        signals.MemToReg === 'X'
          ? []
          : signals.MemToReg === 1
            ? (['DM_READ_DATA'] as DatapathValueId[])
            : (['ALU_RESULT'] as DatapathValueId[]),
      outputs: signals.MemToReg === 'X' ? [] : (['RF_WD'] as DatapathValueId[])
    }
  return { controls: [], inputs: [], outputs: [] }
}
const getDatapathHighlightState = (
  step: DatapathStep,
  signals: RuntimeControlSignals,
  defaultSignals: RuntimeControlSignals,
  context: ExecutionContext
): DatapathHighlightState => {
  const state: DatapathHighlightState = { controls: {}, values: {} }
  const h = stepValueHighlights(step, signals, context)
  for (const id of h.inputs) state.values[id] = 'input'
  for (const id of h.outputs) state.values[id] = 'output'
  for (const s of h.controls) state.controls[s] = signals[s] === defaultSignals[s] ? 'control' : 'modified'
  return state
}
export { getDatapathHighlightState, getHighlightSvgFill }
export type { DatapathHighlightState, DatapathStep, ExecutionContext }
