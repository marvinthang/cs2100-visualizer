import type { DatapathStage } from '../../../types/mips';

export default function StepControls({
    stage,
    isFirstStage,
    isLastStage,
    onPreviousStep,
    onNextStep,
    onResetStep,
}: {
    stage: DatapathStage | null;
    isFirstStage: boolean;
    isLastStage: boolean;
    onPreviousStep: () => void;
    onNextStep: () => void;
    onResetStep: () => void;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Step-by-step execution</h2>
                <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                    {stage ?? 'Not started'}
                </span>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onPreviousStep}
                    disabled={isFirstStage}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-300"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onClick={onNextStep}
                    disabled={isLastStage}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-300"
                >
                    Next
                </button>

                <button
                    type="button"
                    onClick={onResetStep}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Reset step
                </button>
            </div>
        </div>
    )
}