import type { DatapathMnemonic } from "../../../types/mips"

export default function InstructionSelector({
    mnemonics,
    value,
    onChange,
}: {
    mnemonics: readonly DatapathMnemonic[]
    value: DatapathMnemonic
    onChange: (mnemonic: DatapathMnemonic) => void
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value as DatapathMnemonic)}
            className="mt-4 rounded border px-3 py-2"
        >
            {mnemonics.map((item) => (
                <option key={item} value={item}>
                    {item}
                </option>
            ))}
        </select>
    )
}