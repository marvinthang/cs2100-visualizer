import type { View } from '@/features/datapath/use-view-mode'
import type { Instruction, RegisterNumber } from '@/features/mips/types'
import DatapathWorkspace from '@/features/datapath/maps/datapath-workspace'
import { datapathValues } from '@/features/datapath/values'
import {
  controlFor,
  createInitialState,
  decodeInstruction,
  encodeInstruction,
  executeStep,
  writeRegister
} from '@/features/mips'
import { FUNCT } from '@/features/mips/encode'

const STARTER = 'addi $t0, $zero, 5\naddi $t1, $zero, 7\nadd $t2, $t0, $t1'
const AssemblyView = ({ base, views }: { base: string; views: readonly View[] }): React.JSX.Element => {
  const ins: Instruction = {
    funct: FUNCT.add,
    name: 'add',
    rd: 3 as RegisterNumber,
    rs: 1 as RegisterNumber,
    rt: 2 as RegisterNumber,
    shamt: 0,
    type: 'R'
  }
  const seeded = writeRegister(writeRegister(createInitialState(), 1, 10), 2, 3)
  const stepRes = executeStep(seeded, encodeInstruction(ins), decodeInstruction(encodeInstruction(ins)))
  return (
    <main aria-label='mips-assembly'>
      <DatapathWorkspace
        asmInitial={STARTER}
        base={base}
        control={controlFor(ins)}
        name='assembly'
        values={datapathValues(seeded, stepRes.nextState, ins)}
        views={views}
      />
    </main>
  )
}
export default AssemblyView
