import { useState } from 'react';
import type { MachineState } from '../../../core/mips/single-cycle/execution/machineState';
import type { MachineStateHighlightState } from '../../../core/mips/single-cycle/highlight/types';
import {
    getHighlightBackgroundClass,
    getHighlightTextClass,
} from '../../../core/mips/single-cycle/highlight/datapathHighlightState';
import Modal, { ExpandButton } from './Modal';

function PanelMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold text-slate-900">
                {value}
            </div>
        </div>
    );
}

export default function MemoryTable({
    machine,
    onMemoryChange,
    onMemoryRangeChange,
    onResetMemory,
    machineHighlight,
    tableMaxHeightClass = 'max-h-[200px]',
}: {
    machine: MachineState;
    onMemoryChange: (address: number, value: number) => void;
    onMemoryRangeChange: (startAddress: number, wordCount: number) => void;
    onResetMemory: () => void;
    machineHighlight: MachineStateHighlightState;
    tableMaxHeightClass?: string;
}) {
    const [startAddressInput, setStartAddressInput] = useState('0');
    const [wordCountInput, setWordCountInput] = useState('16');
    const [dataMemoryDrafts, setDataMemoryDrafts] = useState<
        Partial<Record<number, string>>
    >({});
    const [isExpanded, setIsExpanded] = useState(false);

    const startAddress =
        startAddressInput === '' ? 0 : Number(startAddressInput);

    const wordCount = wordCountInput === '' ? 16 : Number(wordCountInput);

    const memoryRows = Object.entries(machine.dataMemory)
        .map(([address, value]) => ({
            address: Number(address),
            value,
        }))
        .sort((a, b) => a.address - b.address);
    const memoryRange =
        memoryRows.length > 0
            ? `${memoryRows[0].address} - ${
                  memoryRows[memoryRows.length - 1].address
              }`
            : 'Empty';

    function renderTable(scrollClass: string) {
        return (
            <div
                className={`${scrollClass} overflow-auto rounded-md border border-slate-200`}
            >
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#fbfcfd]">
                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                            <th className="px-3 py-2 font-semibold">Addr</th>
                            <th className="px-3 py-2 font-semibold">Hex</th>
                            <th className="px-3 py-2 text-right font-semibold">
                                Value
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {memoryRows.map(({ address }) => {
                            const role =
                                machineHighlight.memory[address] ?? 'normal';
                            const textClass = getHighlightTextClass(role);
                            const bgClass = getHighlightBackgroundClass(role);
                            const memoryValue = String(
                                machine.dataMemory[address] ?? 0,
                            );
                            const draftValue =
                                dataMemoryDrafts[address] ?? memoryValue;
                            return (
                                <tr
                                    key={address}
                                    className={`border-b border-slate-100 font-mono text-xs last:border-b-0 ${bgClass}`}
                                >
                                    <td className={`px-3 py-1.5 ${textClass}`}>
                                        {address}
                                    </td>
                                    <td className={`px-3 py-1.5 ${textClass}`}>
                                        0x
                                        {Number(address)
                                            .toString(16)
                                            .toUpperCase()
                                            .padStart(8, '0')}
                                    </td>
                                    <td
                                        className={`px-3 py-1.5 text-right ${textClass}`}
                                    >
                                        <input
                                            type="number"
                                            value={draftValue}
                                            onChange={(event) =>
                                                setDataMemoryDrafts(
                                                    (drafts) => ({
                                                        ...drafts,
                                                        [address]:
                                                            event.target.value,
                                                    }),
                                                )
                                            }
                                            onBlur={() => {
                                                const raw =
                                                    dataMemoryDrafts[address] ??
                                                    memoryValue;
                                                const value = Number(raw);
                                                if (
                                                    raw.trim() === '' ||
                                                    Number.isNaN(value)
                                                ) {
                                                    setDataMemoryDrafts(
                                                        (drafts) => {
                                                            const next = {
                                                                ...drafts,
                                                            };
                                                            delete next[
                                                                address
                                                            ];
                                                            return next;
                                                        },
                                                    );
                                                    return;
                                                }
                                                setDataMemoryDrafts(
                                                    (drafts) => {
                                                        const next = {
                                                            ...drafts,
                                                        };
                                                        delete next[address];
                                                        return next;
                                                    },
                                                );
                                                onMemoryChange(address, value);
                                            }}
                                            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-left text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
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
        <div className="h-fit overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                        Data Memory
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Word-addressable data segment
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setDataMemoryDrafts({});
                            onResetMemory();
                        }}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Reset
                    </button>
                    <ExpandButton onClick={() => setIsExpanded(true)} />
                </div>
            </div>

            <div className="space-y-3 p-3">
                <div className="grid grid-cols-2 gap-2">
                    <PanelMetric label="Addr range" value={memoryRange} />
                    <PanelMetric label="Words" value={memoryRows.length} />
                </div>

                <div className="rounded-md border border-slate-200 bg-[#fbfcfd] p-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <label className="text-xs font-medium text-slate-600">
                            Start addr
                            <input
                                type="number"
                                min={0}
                                step={4}
                                value={startAddressInput}
                                onChange={(event) =>
                                    setStartAddressInput(event.target.value)
                                }
                                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </label>

                        <label className="text-xs font-medium text-slate-600">
                            Words
                            <input
                                type="number"
                                min={1}
                                value={wordCountInput}
                                onChange={(event) =>
                                    setWordCountInput(event.target.value)
                                }
                                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() => {
                                setDataMemoryDrafts({});
                                onMemoryRangeChange(startAddress, wordCount);
                            }}
                            className="self-end rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                {renderTable(tableMaxHeightClass)}
            </div>

            {isExpanded && (
                <Modal title="Data Memory" onClose={() => setIsExpanded(false)}>
                    {renderTable('max-h-[65vh]')}
                </Modal>
            )}
        </div>
    );
}
