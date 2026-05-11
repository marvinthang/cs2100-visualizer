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
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Step-by-step execution</h2>
                <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                    {step ?? 'Not started'}
                </span>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onPreviousStep}
                    disabled={isFirstStep}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-300"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onClick={onNextStep}
                    disabled={isLastStep}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-300"
                >
                    Next
                </button>

                <button
                    type="button"
                    onClick={onResetStep}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Reset
                </button>
            </div>
        </div>
    )
}