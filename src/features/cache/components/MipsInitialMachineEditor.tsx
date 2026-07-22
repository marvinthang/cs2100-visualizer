import CollapsibleSection from '../../../components/CollapsibleSection';
import {
    createInitialMachineState,
    type MachineState,
} from '../../../core/mips/single-cycle/execution/machineState';
import type { MachineStateHighlightState } from '../../../core/mips/single-cycle/highlight/types';
import type { RegisterNumber } from '../../../types/mips';
import MemoryTable from '../../datapath/components/MemoryTable';
import RegisterTable from '../../datapath/components/RegisterTable';

const EMPTY_HIGHLIGHT: MachineStateHighlightState = {
    registers: {},
    memory: {},
};

export default function MipsInitialMachineEditor({
    machine,
    onChange,
}: {
    machine: MachineState;
    onChange: (next: MachineState) => void;
}) {
    function updateRegister(register: RegisterNumber, value: number) {
        if (register === 0) return;

        onChange({
            ...machine,
            registers: { ...machine.registers, [register]: value },
        });
    }

    function updateMemory(address: number, value: number) {
        onChange({
            ...machine,
            dataMemory: { ...machine.dataMemory, [address]: value },
        });
    }

    function updateMemoryRange(startAddress: number, wordCount: number) {
        const dataMemory: Record<number, number> = {};
        const alignedStart = Math.max(0, startAddress - (startAddress % 4));

        for (let index = 0; index < wordCount; index++) {
            const address = alignedStart + index * 4;
            dataMemory[address] = machine.dataMemory[address] ?? 0;
        }

        onChange({ ...machine, dataMemory });
    }

    function resetMemory() {
        const dataMemory = Object.fromEntries(
            Object.keys(machine.dataMemory).map((address) => [
                Number(address),
                0,
            ]),
        );
        onChange({ ...machine, dataMemory });
    }

    return (
        <CollapsibleSection
            id="cache-initial-machine"
            title="Initial registers and memory"
            subtitle="Program inputs"
            defaultOpen={false}
            className="mt-3 overflow-hidden"
        >
            <div className="grid items-start gap-4 p-4">
                <RegisterTable
                    sectionId="cache-initial-registers"
                    machine={machine}
                    onRegisterChange={updateRegister}
                    onResetRegisters={() =>
                        onChange({
                            ...machine,
                            registers: createInitialMachineState().registers,
                        })
                    }
                    machineHighlight={EMPTY_HIGHLIGHT}
                    tableMaxHeightClass="max-h-[360px]"
                />

                <MemoryTable
                    sectionId="cache-initial-memory"
                    machine={machine}
                    onMemoryChange={updateMemory}
                    onMemoryRangeChange={updateMemoryRange}
                    onResetMemory={resetMemory}
                    machineHighlight={EMPTY_HIGHLIGHT}
                    tableMaxHeightClass="max-h-[360px]"
                />
            </div>
        </CollapsibleSection>
    );
}
