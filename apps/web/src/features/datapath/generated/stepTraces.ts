/** biome-ignore-all lint/nursery/noUndeclaredEnvVars: noise */
/** biome-ignore-all lint/nursery/useGlobalThis: noise */
/** biome-ignore-all lint/suspicious/noBitwiseOperators: noise */
/** biome-ignore-all lint/suspicious/noMisplacedAssertion: noise */
/** biome-ignore-all lint/nursery/noComponentHookFactories: noise */
/** biome-ignore-all lint/nursery/noContinue: noise */
/** biome-ignore-all lint/performance/noAwaitInLoops: noise */
/** biome-ignore-all lint/performance/noNamespaceImport: noise */
/** biome-ignore-all lint/complexity/noUselessStringRaw: noise */
/** biome-ignore-all lint/complexity/useMaxParams: noise */
/* oxlint-disable unicorn/no-array-reduce, unicorn/no-immediate-mutation, unicorn/number-literal-case, unicorn/no-process-exit, import/no-duplicates, promise/param-names, @eslint-react/naming-convention/component-name */
import type { ControlSignals } from '@/features/mips/types'
import { PATHS } from './topology'
type Step = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB'
const STEPS: readonly Step[] = ['IF', 'ID', 'EX', 'MEM', 'WB']
const pathId = (id: string): string => {
  const p = PATHS.find(x => x.id === id)
  if (p === undefined) throw new Error(`stepTraces: unknown path ${id}`)
  return p.id
}
const activePaths = (c: ControlSignals, step: Step): readonly string[] => {
  if (step === 'IF') return [pathId('PC_TO_IM'), pathId('PC_TO_ADD4'), pathId('CONST4_TO_ADD4'), pathId('IM_TO_IR')]
  if (step === 'ID') {
    const base = [
      pathId('IR_RS_TO_RF_RR1'),
      pathId('IR_RT_TO_RF_RR2'),
      pathId('IR_OPCODE_TO_CONTROL'),
      pathId('IR_IMM_TO_SIGN_EXTEND'),
      pathId('CONTROL_TO_REGDST_MUX'),
      pathId('CONTROL_TO_ALUSRC_MUX'),
      pathId('ALUOP_TO_ALU_CONTROL'),
      pathId('IR_FUNCT_TO_ALU_CONTROL')
    ]
    return c.RegDst === 1 ? [...base, pathId('IR_RD_TO_REGDST_MUX1')] : [...base, pathId('IR_RT_TO_REGDST_MUX0')]
  }
  if (step === 'EX') {
    const base = [pathId('RF_RD1_TO_ALU1'), pathId('ALU_CONTROL_TO_ALU'), pathId('ALUSRC_MUX_TO_ALU2')]
    const op2 =
      c.ALUSrc === 1 ? [pathId('SIGN_EXTEND_TO_ALUSRC_MUX1')] : [pathId('RF_RD2_TO_ALUSRC_MUX0')]
    const branch =
      c.Branch === 1 || c.BranchNE === 1
        ? [
            pathId('SIGN_EXTEND_TO_LEFT_SHIFT_2'),
            pathId('LEFT_SHIFT_2_TO_BRANCH_ADDER1'),
            pathId('ADD4_TO_BRANCH_ADDER0'),
            pathId('ALU_ZERO_TO_BEQ_AND_GATE'),
            pathId('ALU_ZERO_TO_NOT_GATE')
          ]
        : []
    return [...base, ...op2, ...branch]
  }
  if (step === 'MEM') {
    const mem: string[] = []
    if (c.MemRead === 1) mem.push(pathId('ALU_TO_DM_ADDR'), pathId('CONTROL_TO_MEMREAD'), pathId('DM_RD_TO_MEMTOREG_MUX1'))
    if (c.MemWrite === 1) mem.push(pathId('ALU_TO_DM_ADDR'), pathId('RF_RD2_TO_DM_WD'), pathId('CONTROL_TO_MEMWRITE'))
    if (c.MemRead === 0 && c.MemWrite === 0) mem.push(pathId('ALU_TO_MEMTOREG_MUX0'))
    const pc =
      c.Branch === 1 || c.BranchNE === 1
        ? [
            pathId('BRANCH_TO_BEQ_AND_GATE'),
            pathId('BRANCHNE_TO_BNE_AND_GATE'),
            pathId('NOT_GATE_TO_BNE_AND_GATE'),
            pathId('BEQ_AND_GATE_TO_OR_GATE'),
            pathId('BNE_AND_GATE_TO_OR_GATE'),
            pathId('OR_GATE_TO_PCSRC_MUX'),
            pathId('BRANCH_ADDER_TO_PCSRC_MUX1')
          ]
        : [pathId('ADD4_TO_PCSRC_MUX0')]
    return [...mem, ...pc]
  }
  const wb: string[] = [pathId('PCSRC_MUX_TO_PC')]
  if (c.RegWrite === 1) {
    wb.push(pathId('CONTROL_TO_REGWRITE'), pathId('REGDST_MUX_TO_RF_WR'), pathId('MEMTOREG_MUX_TO_RF_WD'))
    wb.push(c.MemToReg === 1 ? pathId('DM_RD_TO_MEMTOREG_MUX1') : pathId('ALU_TO_MEMTOREG_MUX0'))
  }
  return wb
}
const componentsForPaths = (ids: readonly string[]): readonly string[] => {
  const set = new Set<string>()
  for (const id of ids) {
    const p = PATHS.find(x => x.id === id)
    if (p === undefined) continue
    set.add(p.from)
    set.add(p.to)
  }
  return [...set]
}
export { activePaths, componentsForPaths, STEPS }
export type { Step }
