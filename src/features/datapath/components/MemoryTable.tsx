import { useState } from 'react';
import type { MachineState } from '../../../core/mips/single-cycle/execution/machineState';
import type { MachineStateHighlightState } from '../../../core/mips/single-cycle/highlight/types';
import {
    getHighlightBackgroundClass,
    getHighlightTextClass,
} from '../../../core/mips/single-cycle/highlight/datapathHighlightState';
import {
    formatRegisterValue,
    parseRegisterValue,
    type RegisterValueFormat,
} from '../../../core/mips/registerValueFormat';
import Modal, { ExpandButton } from './Modal';

function PanelMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                {label}
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
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
    const [valueFormat, setValueFormat] = useState<RegisterValueFormat>('dec');
    const [startAddressInput, setStartAddressInput] = useState('0');
    const [wordCountInput, setWordCountInput] = useState('16');
    const [dataMemoryDrafts, setDataMemoryDrafts] = useState<
        Partial<Record<number, string>>
    >({});
    const [memoryFormats, setMemoryFormats] = useState<
        Partial<Record<number, RegisterValueFormat>>
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
                className={`${scrollClass} overflow-auto rounded-md border border-slate-200 dark:border-slate-800`}
            >
                <table className="w-full min-w-max text-sm">
                    <thead className="sticky top-0 bg-[#fbfcfd] dark:bg-slate-900/60">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400">
                            <th className="px-3 py-2 font-semibold">Addr</th>
                            <th className="px-3 py-2 font-semibold">Hex</th>
                            <th className="px-3 py-2 font-semibold">Format</th>
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
                            const rowFormat =
                                memoryFormats[address] ?? valueFormat;
                            const memoryValue = formatRegisterValue(
                                machine.dataMemory[address] ?? 0,
                                rowFormat,
                            );
                            const draftValue =
                                dataMemoryDrafts[address] ?? memoryValue;
                            return (
                                <tr
                                    key={address}
                                    className={`border-b border-slate-100 dark:border-slate-800 font-mono text-xs last:border-b-0 ${bgClass}`}
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
                                    <td className="px-3 py-1.5">
                                        <div
                                            role="group"
                                            aria-label={`Address ${address} value format`}
                                            className="inline-flex overflow-hidden rounded border border-slate-300 bg-white"
                                        >
                                            {(
                                                [
                                                    {
                                                        format: 'dec',
                                                        name: '10',
                                                    },
                                                    {
                                                        format: 'hex',
                                                        name: '16',
                                                    },
                                                    {
                                                        format: 'bin',
                                                        name: '2',
                                                    },
                                                ] as const
                                            ).map(({ format, name }) => (
                                                <button
                                                    key={format}
                                                    type="button"
                                                    title={
                                                        format === 'dec'
                                                            ? 'Decimal'
                                                            : format === 'hex'
                                                              ? 'Hexadecimal'
                                                              : 'Binary'
                                                    }
                                                    aria-pressed={
                                                        rowFormat === format
                                                    }
                                                    onClick={() => {
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
                                                        setMemoryFormats(
                                                            (formats) => {
                                                                const next = {
                                                                    ...formats,
                                                                };
                                                                if (
                                                                    format ===
                                                                    valueFormat
                                                                ) {
                                                                    delete next[
                                                                        address
                                                                    ];
                                                                } else {
                                                                    next[
                                                                        address
                                                                    ] = format;
                                                                }
                                                                return next;
                                                            },
                                                        );
                                                    }}
                                                    className={`border-r border-slate-300 px-1.5 py-1 text-[9px] font-bold transition last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                                        rowFormat === format
                                                            ? 'bg-slate-700 text-white'
                                                            : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-800'
                                                    }`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td
                                        className={`px-3 py-1.5 text-right ${textClass}`}
                                    >
                                        <input
                                            type="text"
                                            spellCheck={false}
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
                                                const value =
                                                    dataMemoryDrafts[
                                                        address
                                                    ] !== undefined
                                                        ? parseRegisterValue(
                                                              dataMemoryDrafts[
                                                                  address
                                                              ],
                                                              rowFormat,
                                                          )
                                                        : machine.dataMemory[
                                                              address
                                                          ];
                                                if (value === null) {
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
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.currentTarget.blur();
                                                }
                                            }}
                                            className={`rounded-md border border-slate-300 bg-white px-2 py-1 text-left text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                                                rowFormat === 'bin'
                                                    ? 'w-64'
                                                    : rowFormat === 'hex'
                                                      ? 'w-28'
                                                      : 'w-24'
                                            }`}
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
        <div className="h-fit overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/60 px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Data Memory
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Word-addressable data segment
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        role="group"
                        aria-label="Memory value format"
                        className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm"
                    >
                        {(
                            [
                                { format: 'dec', name: 'DEC' },
                                { format: 'hex', name: 'HEX' },
                                { format: 'bin', name: 'BIN' },
                            ] as const
                        ).map(({ format, name }) => (
                            <button
                                key={format}
                                type="button"
                                aria-pressed={valueFormat === format}
                                onClick={() => {
                                    setDataMemoryDrafts({});
                                    setMemoryFormats({});
                                    setValueFormat(format);
                                }}
                                className={`border-r border-slate-300 px-2 py-1 font-mono text-[10px] font-bold transition last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                    valueFormat === format
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setDataMemoryDrafts({});
                            onResetMemory();
                        }}
                        className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
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

                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/60 p-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Start addr
                            <input
                                type="number"
                                min={0}
                                step={4}
                                value={startAddressInput}
                                onChange={(event) =>
                                    setStartAddressInput(event.target.value)
                                }
                                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 font-mono text-xs shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </label>

                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Words
                            <input
                                type="number"
                                min={1}
                                value={wordCountInput}
                                onChange={(event) =>
                                    setWordCountInput(event.target.value)
                                }
                                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 font-mono text-xs shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() => {
                                setDataMemoryDrafts({});
                                onMemoryRangeChange(startAddress, wordCount);
                            }}
                            className="self-end rounded-md bg-slate-900 dark:bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white dark:text-white shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-500"
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
