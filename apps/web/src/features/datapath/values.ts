import type { Instruction, MachineState } from '@/features/mips/types'
import { readRegister } from '@/features/mips'

const REG = ['$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3'] as const
const reg = (n: number): string => REG[n] ?? `$${n}`
const datapathValues = (before: MachineState, after: MachineState, ins: Instruction): Record<string, string> => {
  const out: Record<string, string> = { IR: ins.name, PC: `0x${before.pc.toString(16)}` }
  if (ins.type === 'R') {
    const rs = readRegister(before, ins.rs)
    const rt = readRegister(before, ins.rt)
    out.RF = `${reg(ins.rs)}=${rs}, ${reg(ins.rt)}=${rt}`
    out.ALU = `${rs} op ${rt} = ${readRegister(after, ins.rd)}`
    out.RegDstMux = `wr ${reg(ins.rd)}`
    out.ALUSrcMux = `reg ${rt}`
    out.WB = `${reg(ins.rd)} ← ${readRegister(after, ins.rd)}`
    return out
  }
  if (ins.type === 'I') {
    const rs = readRegister(before, ins.rs)
    out.SE = `imm ${ins.imm}`
    out.RF = `${reg(ins.rs)}=${rs}`
    out.ALUSrcMux = `imm ${ins.imm}`
    out.ALU = `${rs} + ${ins.imm} = ${rs + ins.imm}`
    if (ins.name === 'lw') out.DM = `load @0x${(rs + ins.imm).toString(16)}`
    else if (ins.name === 'sw') out.DM = `store ${readRegister(before, ins.rt)} @0x${(rs + ins.imm).toString(16)}`
    else if (ins.name === 'beq' || ins.name === 'bne') {
      out.ALU = `${rs} - ${readRegister(before, ins.rt)}`
      out.Zero = rs === readRegister(before, ins.rt) ? '1' : '0'
    } else out.WB = `${reg(ins.rt)} ← ${readRegister(after, ins.rt)}`
    return out
  }
  out.PCSrcMux = `jump 0x${ins.target.toString(16)}`
  return out
}
export { datapathValues }
