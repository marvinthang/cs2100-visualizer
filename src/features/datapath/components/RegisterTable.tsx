import { useState } from 'react';
import type { MachineState } from '../../../core/mips/single-cycle/execution/machineState';
import type { MachineStateHighlightState } from '../../../core/mips/single-cycle/highlight/types';
import type { RegisterNumber } from '../../../types/mips';
import {
    getHighlightBackgroundClass,
    getHighlightTextClass,
} from '../../../core/mips/single-cycle/highlight/datapathHighlightState';
import Modal, { ExpandButton } from './Modal';

const registerRows = [
    [0, '$zero'],
    [1, '$at'],
    [2, '$v0'],
    [3, '$v1'],
    [4, '$a0'],
    [5, '$a1'],
    [6, '$a2'],
    [7, '$a3'],
    [8, '$t0'],
    [9, '$t1'],
    [10, '$t2'],
    [11, '$t3'],
    [12, '$t4'],
    [13, '$t5'],
    [14, '$t6'],
    [15, '$t7'],
    [16, '$s0'],
    [17, '$s1'],
    [18, '$s2'],
    [19, '$s3'],
    [20, '$s4'],
    [21, '$s5'],
    [22, '$s6'],
    [23, '$s7'],
    [24, '$t8'],
    [25, '$t9'],
    [26, '$k0'],
    [27, '$k1'],
    [28, '$gp'],
    [29, '$sp'],
    [30, '$fp'],
    [31, '$ra'],
] as const;

export default function RegisterTable({
    machine,
    onRegisterChange,
    onResetRegisters,
    machineHighlight,
    tableMaxHeightClass = 'max-h-[200px]',
}: {
    machine: MachineState;
    onRegisterChange: (register: RegisterNumber, value: number) => void;
    onResetRegisters: () => void;
    machineHighlight: MachineStateHighlightState;
    tableMaxHeightClass?: string;
}) {
    const [registerDrafts, setRegisterDrafts] = useState<
        Partial<Record<RegisterNumber, string>>
    >({});
    const [isExpanded, setIsExpanded] = useState(false);

    const pcRole = machineHighlight.pc ?? 'normal';
    const pcTextClass = getHighlightTextClass(pcRole, 'text-slate-700');
    const pcBgClass = getHighlightBackgroundClass(pcRole, 'bg-slate-100');

    function renderTable(scrollClass: string) {
        return (
            <div className={`${scrollClass} overflow-auto`}>
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                            <th className="py-2 pr-2">No.</th>
                            <th className="py-2 pr-2">Name</th>
                            <th className="py-2 text-right">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registerRows.map(([id, name]) => {
                            const role =
                                machineHighlight.registers[id] ?? 'normal';
                            const textClass = getHighlightTextClass(role);
                            const bgClass = getHighlightBackgroundClass(role);
                            const registerValue = String(
                                machine.registers[id] ?? 0,
                            );
                            const draftValue =
                                registerDrafts[id] ?? registerValue;
                            return (
                                <tr
                                    key={id}
                                    className={`border-b border-slate-100 font-mono text-xs ${bgClass}`}
                                >
                                    <td
                                        className={`py-1.5 pr-2 text-slate-500 ${textClass}`}
                                    >
                                        {id}
                                    </td>
                                    <td className={`py-1.5 pr-2 ${textClass}`}>
                                        {name}
                                    </td>
                                    <td
                                        className={`py-1.5 text-right ${textClass}`}
                                    >
                                        <input
                                            type="number"
                                            value={draftValue}
                                            disabled={id === 0}
                                            onChange={(event) =>
                                                setRegisterDrafts((drafts) => ({
                                                    ...drafts,
                                                    [id]: event.target.value,
                                                }))
                                            }
                                            onBlur={() => {
                                                const raw =
                                                    registerDrafts[id] ??
                                                    registerValue;
                                                const value = Number(raw);
                                                if (
                                                    raw.trim() === '' ||
                                                    Number.isNaN(value)
                                                ) {
                                                    setRegisterDrafts((drafts) => {
                                                        const next = {
                                                            ...drafts,
                                                        };
                                                        delete next[id];
                                                        return next;
                                                    });
                                                    return;
                                                }
                                                setRegisterDrafts((drafts) => {
                                                    const next = { ...drafts };
                                                    delete next[id];
                                                    return next;
                                                });
                                                onRegisterChange(id, value);
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.currentTarget.blur();
                                                }
                                            }}
                                            className="w-24 rounded-md border border-slate-200 px-2 py-1 text-left text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                    Registers
                </h2>
                <div className="flex items-center gap-2">
                    <span
                        className={`rounded-md ${pcBgClass} px-2 py-1 font-mono text-xs ${pcTextClass}`}
                    >
                        PC = {machine.pc}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setRegisterDrafts({});
                            onResetRegisters();
                        }}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Reset
                    </button>
                    <ExpandButton onClick={() => setIsExpanded(true)} />
                </div>
            </div>

            {renderTable(tableMaxHeightClass)}

            {isExpanded && (
                <Modal
                    title="Registers"
                    onClose={() => setIsExpanded(false)}
                >
                    {renderTable('max-h-[65vh]')}
                </Modal>
            )}
        </div>
    );
}
