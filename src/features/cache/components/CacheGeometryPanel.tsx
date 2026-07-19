import type { CacheConfig, CacheValidationResult } from '../../../types/cache';
import { describeOrganization } from '../format';

type NumericField = {
    label: string;
    value: string;
    onChange: (value: string) => void;
};

export default function CacheGeometryPanel({
    config,
    validation,
    capacityWords,
    blockSizeWords,
    wayCount,
    onCapacityChange,
    onBlockSizeChange,
    onWayCountChange,
}: {
    config: CacheConfig;
    validation: CacheValidationResult;
    capacityWords: string;
    blockSizeWords: string;
    wayCount: string;
    onCapacityChange: (value: string) => void;
    onBlockSizeChange: (value: string) => void;
    onWayCountChange: (value: string) => void;
}) {
    const fields: NumericField[] = [
        {
            label: 'Capacity',
            value: capacityWords,
            onChange: onCapacityChange,
        },
        {
            label: 'Block words',
            value: blockSizeWords,
            onChange: onBlockSizeChange,
        },
        {
            label: 'Ways',
            value: wayCount,
            onChange: onWayCountChange,
        },
    ];

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-6">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Cache geometry
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                    {validation.valid
                        ? describeOrganization(config)
                        : 'Resolve the layout'}
                </h2>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md bg-slate-200 ring-1 ring-slate-200">
                {fields.map((field) => (
                    <label key={field.label} className="bg-slate-50 p-3">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {field.label}
                        </span>
                        <input
                            type="number"
                            min="1"
                            value={field.value}
                            onChange={(event) =>
                                field.onChange(event.target.value)
                            }
                            className="mt-2 w-full border-0 bg-transparent p-0 font-mono text-2xl font-bold text-slate-900 outline-none focus:ring-0"
                        />
                    </label>
                ))}
            </div>

            {validation.valid ? (
                <div className="mt-5">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <span className="block font-mono text-lg font-bold">
                                {validation.layout.lineCount}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                                lines
                            </span>
                        </div>
                        <div className="border-x border-slate-200">
                            <span className="block font-mono text-lg font-bold">
                                {validation.layout.setCount}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                                sets
                            </span>
                        </div>
                        <div>
                            <span className="block font-mono text-lg font-bold">
                                {validation.layout.wordCountPerBlock}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                                words / block
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="bg-slate-900"
                            style={{ flexGrow: validation.layout.tagBits }}
                        />
                        <div
                            className="bg-sky-500"
                            style={{
                                flexGrow: Math.max(
                                    validation.layout.setIndexBits,
                                    0.3,
                                ),
                            }}
                        />
                        <div
                            className="bg-emerald-400"
                            style={{
                                flexGrow: Math.max(
                                    validation.layout.blockOffsetBits,
                                    0.3,
                                ),
                            }}
                        />
                        <div
                            className="bg-amber-400"
                            style={{
                                flexGrow: validation.layout.byteOffsetBits,
                            }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-wide text-slate-500">
                        <span>Tag {validation.layout.tagBits}b</span>
                        <span>Set {validation.layout.setIndexBits}b</span>
                        <span>Word {validation.layout.blockOffsetBits}b</span>
                        <span>Byte {validation.layout.byteOffsetBits}b</span>
                    </div>
                </div>
            ) : (
                <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                    Use positive power-of-two values. Ways cannot exceed the
                    number of cache lines.
                </p>
            )}
        </section>
    );
}
