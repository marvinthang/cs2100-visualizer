import { useEffect, useState } from 'react';
import type { MachineState } from '../../../core/mips/machineState';
import type { MachineStateHighlightState, RegisterNumber } from '../../../types/mips';
import { getHighlightBackgroundClass, getHighlightTextClass } from '../../../core/mips/datapathHighlightState';

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

function makeRegisterDrafts(machine: MachineState): Record<RegisterNumber, string> {
    return Object.fromEntries(
        registerRows.map(([id]) => [id, String(machine.registers[id] ?? 0)])
    ) as Record<RegisterNumber, string>;
}

export default function RegisterTable({
    machine,
    onRegisterChange,
    onResetRegisters,
    machineHighlight,
}: { 
    machine: MachineState 
    onRegisterChange: (register: RegisterNumber, value: number) => void;
    onResetRegisters: () => void;
    machineHighlight: MachineStateHighlightState;
}) {
    const [registerDrafts, setRegisterDrafts] = useState<Record<RegisterNumber, string>>(() => makeRegisterDrafts(machine));

    useEffect(() => {
        setRegisterDrafts(makeRegisterDrafts(machine));
    }, [machine.registers]);

    const pcRole = machineHighlight.pc ?? 'normal';
    const pcTextClass = getHighlightTextClass(pcRole);
    const pcBgClass = getHighlightBackgroundClass(pcRole);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Registers</h2>
                <div className="flex items-center gap-2">
                    <span className={`rounded-md ${pcBgClass} px-2 py-1 font-mono text-xs ${pcTextClass}`}>
                        PC = {machine.pc}
                    </span>
                    <button
                        type="button"
                        onClick={onResetRegisters}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="max-h-80 overflow-auto">
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
                            const role = machineHighlight.registers[id] ?? 'normal';
                            const textClass = getHighlightTextClass(role);
                            const bgClass = getHighlightBackgroundClass(role);
                            return (
                                <tr key={id} className={`border-b border-slate-100 font-mono ${bgClass}`}>
                                    <td className={`py-1.5 pr-2 text-slate-500 ${textClass}`}>{id}</td>
                                    <td className={`py-1.5 pr-2 ${textClass}`}>{name}</td>
                                    <td className={`py-1.5 text-right ${textClass}`}>
                                        <input
                                            type="number"
                                            value={registerDrafts[id]}
                                            disabled={id === 0}
                                            onChange={(event) => 
                                                setRegisterDrafts((drafts) => ({
                                                    ...drafts,
                                                    [id]: event.target.value,
                                                }))
                                            }
                                            onBlur={() => {
                                                const raw = registerDrafts[id];
                                                const value = Number(raw);
                                                if (raw.trim() === '' || Number.isNaN(value)) {
                                                    setRegisterDrafts((drafts) => ({
                                                        ...drafts,
                                                        [id]: String(machine.registers[id] ?? 0),
                                                    }));
                                                    return;
                                                }
                                                onRegisterChange(id, value)
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.currentTarget.blur();
                                                }
                                            }}
                                            className="w-24 rounded-md border border-slate-200 px-2 py-1 text-right text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                    </td>
                                </tr>
                        );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}