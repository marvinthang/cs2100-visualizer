import type { DatapathStep } from '../../../types/mips';

export default function StepControls({
    step,
    isFirstStep,
    isLastStep,
    onPreviousStep,
    onNextStep,
    onResetStep,
}: {
    step: DatapathStep | null;
    isFirstStep: boolean;
    isLastStep: boolean;
    onPreviousStep: () => void;
    onNextStep: () => void;
    onResetStep: () => void;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Step Execution
                </h2>
                <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {step ?? 'Not started'}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={onPreviousStep}
                    disabled={isFirstStep}
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                    Prev
                </button>

                <button
                    type="button"
                    onClick={onNextStep}
                    disabled={isLastStep}
                    className="rounded-md bg-slate-900 px-2 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    Next
                </button>

                <button
                    type="button"
                    onClick={onResetStep}
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
