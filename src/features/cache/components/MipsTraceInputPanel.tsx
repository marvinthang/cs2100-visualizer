import MipsSourceEditor from '../../../components/MipsSourceEditor';
import MipsArrayDefinitionsEditor from '../../../components/MipsArrayDefinitionsEditor';
import { assembleMipsProgram } from '../../../core/mips/assembly/assembleMipsProgram';
import type { MipsCacheAccessMode } from '../../../core/cache/mipsTrace';
import { useMemo } from 'react';
import type { MachineState } from '../../../core/mips/single-cycle/execution/machineState';
import type { MipsArrayDefinitionDraft } from '../../../types/mips';
import {
    AddressFormatControl,
    SegmentButton,
} from '../../../components/SegmentedControl';
import type { AddressFormat } from '../../../types/memory';
import MipsInitialMachineEditor from './MipsInitialMachineEditor';

export default function MipsTraceInputPanel({
    program,
    traceTruncated,
    initialMachine,
    arrayDefinitions,
    accessMode,
    instructionBaseAddress,
    instructionAddressFormat,
    onProgramChange,
    onInitialMachineChange,
    onArrayDefinitionsChange,
    onAccessModeChange,
    onInstructionBaseAddressChange,
    onInstructionAddressFormatChange,
    onRun,
}: {
    program: string;
    traceTruncated: boolean;
    initialMachine: MachineState;
    arrayDefinitions: MipsArrayDefinitionDraft[];
    accessMode: MipsCacheAccessMode;
    instructionBaseAddress: string;
    instructionAddressFormat: AddressFormat;
    onProgramChange: (next: string) => void;
    onInitialMachineChange: (next: MachineState) => void;
    onArrayDefinitionsChange: (definitions: MipsArrayDefinitionDraft[]) => void;
    onAccessModeChange: (mode: MipsCacheAccessMode) => void;
    onInstructionBaseAddressChange: (value: string) => void;
    onInstructionAddressFormatChange: (format: AddressFormat) => void;
    onRun: () => void;
}) {
    const assembled = useMemo(() => assembleMipsProgram(program), [program]);
    const cannotRun =
        assembled.errors.length > 0 || assembled.instructions.length === 0;

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        MIPS assembly
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Run the program and send the selected accesses to the
                        cache.
                    </p>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {assembled.instructions.length} inst
                </span>
            </div>

            <div className="p-4">
                <MipsSourceEditor
                    value={program}
                    onChange={onProgramChange}
                    errors={assembled.errors}
                    ariaLabel="Cache MIPS program source"
                />

                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Cache accesses
                    </span>
                    <div className="grid grid-cols-3 rounded-md bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-800">
                        <SegmentButton
                            value="read-only"
                            selected={accessMode === 'read-only'}
                            onSelect={onAccessModeChange}
                        >
                            Read only
                        </SegmentButton>
                        <SegmentButton
                            value="read-write"
                            selected={accessMode === 'read-write'}
                            onSelect={onAccessModeChange}
                        >
                            Read + write
                        </SegmentButton>
                        <SegmentButton
                            value="instruction"
                            selected={accessMode === 'instruction'}
                            onSelect={onAccessModeChange}
                        >
                            Instructions
                        </SegmentButton>
                    </div>

                    {accessMode === 'instruction' && (
                        <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
                            <label>
                                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                                    First instruction address
                                </span>
                                <input
                                    type="text"
                                    inputMode="text"
                                    spellCheck={false}
                                    aria-label="First instruction address"
                                    value={instructionBaseAddress}
                                    onChange={(event) =>
                                        onInstructionBaseAddressChange(
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                                />
                            </label>

                            <AddressFormatControl
                                label="Number base"
                                value={instructionAddressFormat}
                                onChange={onInstructionAddressFormatChange}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-3">
                    <MipsArrayDefinitionsEditor
                        definitions={arrayDefinitions}
                        onChange={onArrayDefinitionsChange}
                    />
                </div>

                <MipsInitialMachineEditor
                    machine={initialMachine}
                    onChange={onInitialMachineChange}
                />

                <button
                    type="button"
                    onClick={onRun}
                    disabled={cannotRun}
                    className="mt-3 w-full rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Run program
                </button>

                {traceTruncated && (
                    <p className="mt-3 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Execution stopped at the instruction limit. The partial
                        cache trace is shown below.
                    </p>
                )}
            </div>
        </section>
    );
}
