import type { EncodedInstruction } from '../../../core/mips/instruction/encodeMipsInstruction';
import { registerNames } from '../../../core/mips/instruction/registers';
import type {
    DatapathInstructionFields,
    RegisterNumber,
} from '../../../types/mips';

function formatRegister(register: RegisterNumber): string {
    return registerNames[register] ?? `$${register}`;
}

function formatInstruction(instruction: DatapathInstructionFields): string {
    const rs = formatRegister(instruction.rs);
    const rt = formatRegister(instruction.rt);
    const rd = formatRegister(instruction.rd);

    if (
        instruction.mnemonic === 'add' ||
        instruction.mnemonic === 'sub' ||
        instruction.mnemonic === 'and' ||
        instruction.mnemonic === 'or' ||
        instruction.mnemonic === 'slt'
    ) {
        return `${instruction.mnemonic} ${rd}, ${rs}, ${rt}`;
    }

    if (instruction.mnemonic === 'addi') {
        return `addi ${rt}, ${rs}, ${instruction.immediate}`;
    }

    if (instruction.mnemonic === 'lw' || instruction.mnemonic === 'sw') {
        return `${instruction.mnemonic} ${rt}, ${instruction.immediate}(${rs})`;
    }

    if (instruction.mnemonic === 'beq' || instruction.mnemonic === 'bne') {
        return `${instruction.mnemonic} ${rs}, ${rt}, ${
            instruction.label ?? instruction.immediate
        }`;
    }

    return instruction.mnemonic;
}

export default function CurrentInstructionCard({
    instruction,
    bits,
}: {
    instruction: DatapathInstructionFields;
    bits: EncodedInstruction;
}) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Current Instruction
                </h2>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {instruction.mnemonic}
                </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-950 px-3 py-2 font-mono text-xs shadow-sm">
                <span className="truncate text-slate-50">
                    {formatInstruction(instruction)}
                </span>
                <span className="shrink-0 text-slate-400">{bits.full.hex}</span>
            </div>
        </section>
    );
}
