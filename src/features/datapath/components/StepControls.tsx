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
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Step Execution
                </h2>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {step ?? 'Not started'}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={onPreviousStep}
                    disabled={isFirstStep}
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
                >
                    Prev
                </button>

                <button
                    type="button"
                    onClick={onNextStep}
                    disabled={isLastStep}
                    className="rounded-md bg-slate-900 px-2 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                >
                    Next
                </button>

                <button
                    type="button"
                    onClick={onResetStep}
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
