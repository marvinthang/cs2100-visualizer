import { useState } from 'react';
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
    const [expanded, setExpanded] = useState(false);

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
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
            >
                <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Program inputs
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-slate-900">
                        Initial registers and memory
                    </span>
                </span>

                <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                    {expanded ? 'Hide' : 'Edit'}
                </span>
            </button>

            {expanded && (
                <div className="grid items-start gap-4 border-t border-slate-200 bg-white p-4 xl:grid-cols-2">
                    <RegisterTable
                        machine={machine}
                        onRegisterChange={updateRegister}
                        onResetRegisters={() =>
                            onChange({
                                ...machine,
                                registers:
                                    createInitialMachineState().registers,
                            })
                        }
                        machineHighlight={EMPTY_HIGHLIGHT}
                        tableMaxHeightClass="max-h-[360px]"
                    />

                    <MemoryTable
                        machine={machine}
                        onMemoryChange={updateMemory}
                        onMemoryRangeChange={updateMemoryRange}
                        onResetMemory={resetMemory}
                        machineHighlight={EMPTY_HIGHLIGHT}
                        tableMaxHeightClass="max-h-[360px]"
                    />
                </div>
            )}
        </div>
    );
}
