import { useState } from 'react';
import type { MachineState } from '../../../core/mips/single-cycle/execution/machineState';
import type { MachineStateHighlightState } from '../../../core/mips/single-cycle/highlight/types';
import type { RegisterNumber } from '../../../types/mips';
import {
    getHighlightBackgroundClass,
    getHighlightTextClass,
} from '../../../core/mips/single-cycle/highlight/datapathHighlightState';
import Modal, { ExpandButton } from './Modal';
import CollapsibleSection from '../../../components/CollapsibleSection';
import {
    formatRegisterValue,
    parseRegisterValue,
    type RegisterValueFormat,
} from '../../../core/mips/registerValueFormat';

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

function PanelMetric({
    label,
    value,
    className = '',
}: {
    label: string;
    value: string | number;
    className?: string;
}) {
    return (
        <div
            className={`rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-sm ${className}`}
        >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                {label}
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                {value}
            </div>
        </div>
    );
}

export default function RegisterTable({
    machine,
    onRegisterChange,
    onResetRegisters,
    machineHighlight,
    tableMaxHeightClass = 'max-h-[200px]',
    onPcChange,
    sectionId = 'registers',
    defaultOpen = true,
}: {
    machine: MachineState;
    onRegisterChange: (register: RegisterNumber, value: number) => void;
    onResetRegisters: () => void;
    machineHighlight: MachineStateHighlightState;
    tableMaxHeightClass?: string;
    onPcChange?: (pc: number) => void;
    sectionId?: string;
    defaultOpen?: boolean;
}) {
    const [valueFormat, setValueFormat] = useState<RegisterValueFormat>('dec');
    const [registerDrafts, setRegisterDrafts] = useState<
        Partial<Record<RegisterNumber, string>>
    >({});
    const [pcDraft, setPcDraft] = useState<string | null>(null);
    const [registerFormats, setRegisterFormats] = useState<
        Partial<Record<RegisterNumber, RegisterValueFormat>>
    >({});
    const [isExpanded, setIsExpanded] = useState(false);

    const pcRole = machineHighlight.pc ?? 'normal';
    const pcTextClass = getHighlightTextClass(
        pcRole,
        'text-slate-700 dark:text-slate-200',
    );
    const pcBgClass = getHighlightBackgroundClass(pcRole, 'bg-slate-100');

    function renderTable(scrollClass: string) {
        return (
            <div
                className={`${scrollClass} overflow-auto rounded-md border border-slate-200 dark:border-slate-800`}
            >
                <table className="w-full min-w-max text-sm">
                    <thead className="sticky top-0 bg-[#fbfcfd] dark:bg-slate-900/60">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400">
                            <th className="px-3 py-2 font-semibold">No.</th>
                            <th className="px-3 py-2 font-semibold">Name</th>
                            <th className="px-3 py-2 font-semibold">Format</th>
                            <th className="px-3 py-2 text-right font-semibold">
                                Value
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {registerRows.map(([id, name]) => {
                            const role =
                                machineHighlight.registers[id] ?? 'normal';
                            const rowFormat =
                                registerFormats[id] ?? valueFormat;
                            const textClass = getHighlightTextClass(role);
                            const bgClass = getHighlightBackgroundClass(role);
                            const registerValue = formatRegisterValue(
                                machine.registers[id] ?? 0,
                                rowFormat,
                            );
                            const draftValue =
                                registerDrafts[id] ?? registerValue;
                            return (
                                <tr
                                    key={id}
                                    className={`border-b border-slate-100 dark:border-slate-800 font-mono text-xs last:border-b-0 ${bgClass}`}
                                >
                                    <td
                                        className={`px-3 py-1.5 text-slate-500 dark:text-slate-400 ${textClass}`}
                                    >
                                        {id}
                                    </td>
                                    <td className={`px-3 py-1.5 ${textClass}`}>
                                        {name}
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <div
                                            role="group"
                                            aria-label={`${name} value format`}
                                            className="inline-flex overflow-hidden rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
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
                                                        setRegisterDrafts(
                                                            (drafts) => {
                                                                const next = {
                                                                    ...drafts,
                                                                };
                                                                delete next[id];
                                                                return next;
                                                            },
                                                        );
                                                        setRegisterFormats(
                                                            (formats) => {
                                                                const next = {
                                                                    ...formats,
                                                                };
                                                                if (
                                                                    format ===
                                                                    valueFormat
                                                                ) {
                                                                    delete next[
                                                                        id
                                                                    ];
                                                                } else {
                                                                    next[id] =
                                                                        format;
                                                                }
                                                                return next;
                                                            },
                                                        );
                                                    }}
                                                    className={`border-r border-slate-300 dark:border-slate-700 px-1.5 py-1 text-[9px] font-bold transition last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                                        rowFormat === format
                                                            ? 'bg-slate-700 text-white dark:bg-slate-600'
                                                            : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-100'
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
                                            disabled={id === 0}
                                            onChange={(event) =>
                                                setRegisterDrafts((drafts) => ({
                                                    ...drafts,
                                                    [id]: event.target.value,
                                                }))
                                            }
                                            onBlur={() => {
                                                const value =
                                                    registerDrafts[id] !==
                                                    undefined
                                                        ? parseRegisterValue(
                                                              registerDrafts[
                                                                  id
                                                              ],
                                                              rowFormat,
                                                          )
                                                        : machine.registers[id];
                                                if (value === null) {
                                                    setRegisterDrafts(
                                                        (drafts) => {
                                                            const next = {
                                                                ...drafts,
                                                            };
                                                            delete next[id];
                                                            return next;
                                                        },
                                                    );
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
                                            className={`rounded-md border border-slate-300 bg-white px-2 py-1 text-left text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800 ${
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
        <>
            <CollapsibleSection
                id={sectionId}
                title="Registers"
                subtitle="General-purpose register file"
                defaultOpen={defaultOpen}
                className="h-fit overflow-hidden"
                meta={
                    <div className="flex shrink-0 items-center gap-2">
                        <div
                            role="group"
                            aria-label="Register value format"
                            className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
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
                                        setRegisterDrafts({});
                                        setRegisterFormats({});
                                        setValueFormat(format);
                                    }}
                                    className={`border-r border-slate-300 dark:border-slate-700 px-2 py-1 font-mono text-[10px] font-bold transition last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                        valueFormat === format
                                            ? 'bg-slate-900 text-white dark:bg-slate-600'
                                            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setRegisterDrafts({});
                                onResetRegisters();
                            }}
                            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Reset
                        </button>
                        <ExpandButton onClick={() => setIsExpanded(true)} />
                    </div>
                }
            >
                <div className="space-y-3 p-3">
                    <div className="grid grid-cols-2 gap-2">
                        {onPcChange ? (
                            <div
                                className={`rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 shadow-sm ${pcBgClass} ${pcTextClass}`}
                            >
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                                    PC
                                </div>
                                <input
                                    type="number"
                                    step={4}
                                    min={0}
                                    value={pcDraft ?? String(machine.pc)}
                                    onChange={(event) =>
                                        setPcDraft(event.target.value)
                                    }
                                    onBlur={() => {
                                        const raw =
                                            pcDraft ?? String(machine.pc);
                                        const value = Number(raw);
                                        setPcDraft(null);
                                        if (
                                            raw.trim() !== '' &&
                                            !Number.isNaN(value)
                                        ) {
                                            onPcChange(value);
                                        }
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.currentTarget.blur();
                                        }
                                    }}
                                    className="mt-0.5 w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                                />
                            </div>
                        ) : (
                            <PanelMetric
                                label="PC"
                                value={machine.pc}
                                className={`${pcBgClass} ${pcTextClass}`}
                            />
                        )}
                        <PanelMetric
                            label="Registers"
                            value={registerRows.length}
                        />
                    </div>

                    {renderTable(tableMaxHeightClass)}
                </div>
            </CollapsibleSection>

            {isExpanded && (
                <Modal title="Registers" onClose={() => setIsExpanded(false)}>
                    {renderTable('max-h-[65vh]')}
                </Modal>
            )}
        </>
    );
}
