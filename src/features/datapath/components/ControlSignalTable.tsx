import type {
    BaseControlSignals,
    ControlSignalId,
    RuntimeControlSignals,
} from '../../../core/mips/single-cycle/control/types';
import type { DatapathHighlightState } from '../../../core/mips/single-cycle/highlight/types';

const controlSignalOptions: {
    [Signal in keyof BaseControlSignals]: readonly BaseControlSignals[Signal][];
} = {
    RegDst: [0, 1, 'X'],
    ALUSrc: [0, 1],
    MemToReg: [0, 1, 'X'],
    RegWrite: [0, 1],
    MemRead: [0, 1],
    MemWrite: [0, 1],
    Branch: [0, 1],
    BranchNE: [0, 1],
    ALUOp: ['00', '01', '10'],
};

export default function ControlSignalTable({
    signals,
    defaultSignals,
    onChange,
    editable,
    datapathHighlight,
}: {
    signals: RuntimeControlSignals;
    defaultSignals: RuntimeControlSignals;
    onChange: (signals: RuntimeControlSignals) => void;
    editable: boolean;
    datapathHighlight: DatapathHighlightState;
}) {
    function updateSignal<K extends keyof BaseControlSignals>(
        name: K,
        value: BaseControlSignals[K],
    ) {
        onChange({
            ...signals,
            [name]: value,
        });
    }

    return (
        <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        <th className="px-3 py-2 text-left font-semibold">
                            Signal
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                            Value
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {(
                        Object.entries(signals) as [
                            ControlSignalId,
                            RuntimeControlSignals[ControlSignalId],
                        ][]
                    ).map(([signal, value]) => {
                        const isModified = value !== defaultSignals[signal];
                        const role = datapathHighlight.controls[signal];
                        const bgClass =
                            role === undefined
                                ? isModified
                                    ? 'bg-amber-50'
                                    : 'bg-white dark:bg-slate-900'
                                : 'bg-blue-50';
                        const valueClass = isModified
                            ? 'text-red-600'
                            : 'text-emerald-700';

                        return (
                            <tr
                                key={signal}
                                className={`border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${bgClass}`}
                            >
                                <td className="px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    {signal}
                                </td>
                                <td
                                    className={`px-3 py-1.5 text-right font-mono text-xs font-semibold ${valueClass}`}
                                >
                                    {editable &&
                                    signal !== 'ALUOp' &&
                                    signal !== 'PCSrc' ? (
                                        <select
                                            value={String(value)}
                                            onChange={(event) => {
                                                updateSignal(
                                                    signal,
                                                    parseControlValue(
                                                        signal,
                                                        event.target.value,
                                                    ),
                                                );
                                            }}
                                            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
                                        >
                                            {controlSignalOptions[signal].map(
                                                (option) => (
                                                    <option
                                                        key={String(option)}
                                                        value={String(option)}
                                                        className={
                                                            option !==
                                                            defaultSignals[
                                                                signal
                                                            ]
                                                                ? 'text-red-600'
                                                                : 'text-green-600'
                                                        }
                                                    >
                                                        {option}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    ) : (
                                        <span>{value}</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function parseControlValue<K extends keyof BaseControlSignals>(
    signal: K,
    value: string,
): BaseControlSignals[K] {
    if (controlSignalOptions[signal] === undefined) {
        throw new Error(`Unknown control signal "${signal}"`);
    }

    const option = controlSignalOptions[signal].find(
        (candidate) => String(candidate) === value,
    );

    if (option === undefined) {
        throw new Error(
            `Invalid value "${value}" for control signal "${signal}"`,
        );
    }

    return option;
}
