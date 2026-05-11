import { getHighlightBackgroundClass, getHighlightTextClass } from "../../../core/mips-datapath/highlight/datapathHighlightState";
import type { ExecutionContext } from "../../../core/mips-datapath/execution/executionContext";
import type { DatapathHighlightState } from "../../../types/mips";

function formatValue(value: number | undefined): string {
    if (value === undefined) {
        return 'undefined';
    }
    return value.toString();
}

export default function DatapathValueTable({
    context,
    datapathHighlight,
} : {
    context: ExecutionContext;
    datapathHighlight: DatapathHighlightState;
}) {
    const rows = [
        ['RF_RR1', 'REG:RR1', context.readReg1],
        ['RF_RR2', 'REG:RR2', context.readReg2],
        ['RF_WR', 'REG:WR', context.writeReg],
        ['RF_RD1', 'REG:RD1', context.readData1],
        ['RF_RD2', 'REG:RD2', context.readData2],
        ['RF_WD', 'REG:WD', context.writeData],
        ['ALU_OP1', 'ALU:op1', context.aluOp1],
        ['ALU_OP2', 'ALU:op2', context.aluOp2],
        ['ALU_RESULT', 'ALU:res', context.aluResult],
        ['DM_ADDRESS', 'MEM:Addr', context.memAddress],
        ['DM_WRITE_DATA', 'MEM:WD', context.memWriteData],
        ['DM_READ_DATA', 'MEM:RD', context.memReadData],
    ] as const;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Datapath Values</h2>
            <div className="max-h-[200px] overflow-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                            <th className="py-2 pr-3">Reg</th>
                            <th className="py-2 text-right">Value</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map(([name, label, value]) => {
                            const role = datapathHighlight.values[name] ?? 'normal';
                            const textClass = getHighlightTextClass(role);
                            const bgClass = getHighlightBackgroundClass(role);
                            return (
                                <tr key={name} className={`border-b border-slate-100 font-mono text-xs ${bgClass}`}>
                                    <td className={`py-1.5 pr-3 ${textClass}`}>{label}</td>
                                    <td className={`py-1.5 text-right ${textClass}`}>
                                        {formatValue(value)}
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