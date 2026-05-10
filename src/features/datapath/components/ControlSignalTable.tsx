import type { ControlSignals } from "../../../types/mips";

const controlSignalOptions: {
    [Signal in keyof ControlSignals]: readonly ControlSignals[Signal][];
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
}: {
    signals: ControlSignals
    defaultSignals: ControlSignals
    onChange: (signals: ControlSignals) => void
    editable: boolean
}) {
    function updateSignal<K extends keyof ControlSignals>(
        name: K,
        value: ControlSignals[K]
    ) {
        onChange({
            ...signals,
            [name]: value,
        })
    }

    return (
        <table className="mt-6 text-sm">
            <thead className="bg-slate-100">
                <tr>
                    <th className="border border-slate-300 px-4 py-2 text-left">
                        Signal
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left">
                        Value
                    </th>
                </tr>
            </thead>

            <tbody>
                {(Object.entries(signals) as [keyof ControlSignals, ControlSignals[keyof ControlSignals]][]).map(([signal, value]) => {
                    const isModified = value !== defaultSignals[signal];
                    return (
                        <tr 
                            key={signal}
                            className={isModified ? 'bg-orange-100' : undefined}
                        >
                            <td className="border border-slate-300 px-4 py-2 font-medium">
                                {signal}
                            </td>
                            <td 
                                className={
                                    isModified
                                        ? 'border border-slate-300 px-4 py-2 font-semibold text-red-600'
                                        : 'border border-slate-300 px-4 py-2 text-green-600'
                                }
                            >
                                {editable ? (
                                    <select
                                        value={String(value)}
                                        onChange={(event) => {
                                            updateSignal(
                                                signal,
                                                parseControlValue(signal, event.target.value)
                                            );
                                        }}
                                        className="rounded border px-2 py-1"
                                    >
                                        {controlSignalOptions[signal].map((option) => (
                                            <option 
                                                key={String(option)} value={String(option)}
                                                className={
                                                    option !== defaultSignals[signal]
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                }
                                            >
                                                {option}
                                            </option>
                                        ))}
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
    )
}

function parseControlValue<K extends keyof ControlSignals>(
    signal: K,
    value: string
): ControlSignals[K] {
    const option = controlSignalOptions[signal].find(
        (candidate) => String(candidate) === value
    );

    if (option === undefined) {
        throw new Error(`Invalid value "${value}" for control signal "${signal}"`);
    }

    return option;
}
