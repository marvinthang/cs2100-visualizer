import type { EncodedInstruction } from '../../../core/mips/instruction/encodeMipsInstruction';
import { registerNames } from '../../../core/mips/instruction/registers';
import type { DatapathInstructionFields, RegisterNumber } from '../../../types/mips';

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
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
                Current Instruction
            </h2>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs">
                <span className="truncate text-slate-50">
                    {formatInstruction(instruction)}
                </span>
                <span className="shrink-0 text-slate-400">
                    {bits.full.hex}
                </span>
            </div>
        </section>
    );
}
