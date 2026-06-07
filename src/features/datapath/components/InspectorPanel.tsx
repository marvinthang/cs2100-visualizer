import { useState } from 'react';
import type { ExecutionContext } from '../../../core/mips/single-cycle/execution/executionContext';
import type { MachineState } from '../../../core/mips/single-cycle/execution/machineState';
import type { RuntimeControlSignals } from '../../../core/mips/single-cycle/control/types';
import {
    getDatapathInspectInfo,
    type InstructionDisplayFormat,
} from '../../../core/mips/single-cycle/inspector/datapathInspectInfo';
import type { DatapathInspectID } from '../../../core/mips/single-cycle/inspector/types';
import type { DatapathStep } from '../../../types/mips';

const displayFormatInspectIds = new Set<DatapathInspectID>([
    'INSTRUCTION_MEMORY',
    'INSTRUCTION_REGISTER',
    'REGISTER_FILE',
    'ALUSRC_MUX',
    'MEMTOREG_MUX',
    'PCSRC_MUX',
    'SIGN_EXTEND',
    'LEFT_SHIFT_2',
    'ADD4',
    'BRANCH_ADDER',
    'ALU',
    'DATA_MEMORY',
]);

const displayFormatOptions: Array<{
    value: InstructionDisplayFormat;
    label: string;
}> = [
    { value: 'hex', label: 'Hex' },
    { value: 'dec', label: 'Dec' },
    { value: 'bin', label: 'Bin' },
];

export default function InspectorPanel({
    id,
    step,
    machine,
    context,
    signals,
    onClear,
}: {
    id: DatapathInspectID | null;
    step: DatapathStep | null;
    machine: MachineState;
    context: ExecutionContext;
    signals: RuntimeControlSignals;
    onClear: () => void;
}) {
    const [instructionDisplayFormat, setInstructionDisplayFormat] =
        useState<InstructionDisplayFormat>('hex');

    const info = getDatapathInspectInfo(
        id,
        step,
        machine,
        context,
        signals,
        instructionDisplayFormat,
    );
    const canChangeDisplayFormat =
        id !== null && displayFormatInspectIds.has(id);

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                    Inspector
                </h2>

                <div className="flex items-center gap-2">
                    {canChangeDisplayFormat && (
                        <div className="grid grid-cols-3 rounded-md bg-slate-100 p-0.5 ring-1 ring-slate-200">
                            {displayFormatOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setInstructionDisplayFormat(
                                            option.value,
                                        )
                                    }
                                    className={`rounded px-2 py-1 text-xs font-semibold transition ${
                                        instructionDisplayFormat ===
                                        option.value
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {info !== null && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {info === null ? (
                <p className="text-sm text-slate-500">
                    Click a datapath component to inspect it.
                </p>
            ) : (
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        {info.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        {info.subtitle}
                    </p>

                    <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
                        {info.rows.map((row) => (
                            <div
                                key={row.label}
                                className="grid grid-cols-[86px_minmax(0,1fr)] border-b border-slate-100 last:border-b-0"
                            >
                                <div className="bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                                    {row.label}
                                </div>

                                <div className="break-words px-3 py-2 font-mono text-xs text-slate-900">
                                    {row.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
