import { useEffect, useState } from 'react';
import type { MachineState } from '../../../core/mips-datapath/execution/machineState';
import type { MachineStateHighlightState } from '../../../types/mips';
import { getHighlightBackgroundClass, getHighlightTextClass } from '../../../core/mips-datapath/highlight/datapathHighlightState';

function makeDataMemoryDrafts(machine: MachineState): Record<number, string> {
    return Object.fromEntries(
        Object.entries(machine.dataMemory).map(([address, value]) => [address, String(value)])
    ) as Record<number, string>;
}

export default function MemoryTable({ 
    machine, 
    onMemoryChange,
    onMemoryRangeChange,
    onResetMemory,
    machineHighlight,
}: { 
    machine: MachineState 
    onMemoryChange: (address: number, value: number) => void;
    onMemoryRangeChange: (startAddress: number, wordCount: number) => void;
    onResetMemory: () => void;
    machineHighlight: MachineStateHighlightState;
}) {

    const [startAddressInput, setStartAddressInput] = useState('0');
    const [wordCountInput, setWordCountInput] = useState('16');
    const [dataMemoryDrafts, setDataMemoryDrafts] = useState<Record<number, string>>(() => makeDataMemoryDrafts(machine));

    useEffect(() => {
        setDataMemoryDrafts(makeDataMemoryDrafts(machine));
    }, [machine.dataMemory]);

    const startAddress =
    startAddressInput === '' ? 0 : Number(startAddressInput);

    const wordCount = wordCountInput === '' ? 16 : Number(wordCountInput);

    const memoryRows = Object.entries(machine.dataMemory)
        .map(([address, value]) => ({
            address: Number(address),
            value,
        }))
        .sort((a, b) => a.address - b.address);
    return (
        <div
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
            <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Data Memory
                </h2>
                <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                        {memoryRows.length > 0 ? `Addr range: ${memoryRows[0].address} - ${memoryRows[memoryRows.length - 1].address}` : 'Empty'}
                    </span>
                    <button
                        type="button"
                        onClick={onResetMemory}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Reset
                    </button>
                </div>
            </div>
            <div className="mb-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                <label className="text-xs font-medium text-slate-600">
                    Start addr
                    <input
                        type="number"
                        min={0}
                        step={4}
                        value={startAddressInput}
                        onChange={(event) => setStartAddressInput(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 font-mono text-sm"
                    />
                </label>

                <label className="text-xs font-medium text-slate-600">
                    Words
                    <input
                        type="number"
                        min={1}
                        value={wordCountInput}
                        onChange={(event) => setWordCountInput(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 font-mono text-sm"
                    />
                </label>

                    <button
                        type="button"
                        onClick={() => onMemoryRangeChange(startAddress, wordCount)}
                        className="self-end rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                    >
                        Apply
                    </button>
            </div>
            <div className="max-h-[200px] overflow-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                            <th className="py-2 pr-2">Addr</th>
                            <th className="py-2 pr-2">Hex</th>
                            <th className="py-2 text-right">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {memoryRows.map(({ address }) => {
                            const role = machineHighlight.memory[address] ?? 'normal';
                            const textClass = getHighlightTextClass(role);
                            const bgClass = getHighlightBackgroundClass(role);
                            return (
                                <tr key={address} className={`border-b border-slate-100 font-mono text-xs ${bgClass}`}>
                                    <td className={`py-1.5 pr-2 ${textClass}`}>{address}</td>
                                    <td className={`py-1.5 pr-2 ${textClass}`}>0x{Number(address).toString(16).toUpperCase().padStart(8, '0')}</td>
                                    <td className={`py-1.5 text-right ${textClass}`}>
                                        <input
                                            type="number"
                                            value={dataMemoryDrafts[address]}
                                            onChange={(event) => 
                                                setDataMemoryDrafts((drafts) => ({
                                                    ...drafts,
                                                    [address]: event.target.value,
                                                }))
                                            }
                                            onBlur={() => {
                                                const raw = dataMemoryDrafts[address];
                                                const value = Number(raw);
                                                if (raw.trim() === '' || Number.isNaN(value)) {
                                                    setDataMemoryDrafts((drafts) => ({
                                                        ...drafts,
                                                        [address]: String(machine.dataMemory[address] ?? 0),
                                                    }));
                                                    return;
                                                }
                                                onMemoryChange(address, value);
                                            }}
                                            className="w-24 rounded-md border border-slate-200 px-2 py-1 text-left text-slate-900"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}