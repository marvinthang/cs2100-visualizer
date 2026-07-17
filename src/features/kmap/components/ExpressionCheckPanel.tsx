import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';
import {
    monoInputClass,
    primaryButtonClass,
    secondaryButtonClass,
} from './kmapUiClasses';

type GroupExpressionFeedback = {
    status: 'correct' | 'incorrect' | 'error';
    message: string;
};

type ExpressionCheckPanelProps = {
    solverForm: KMapSolveForm;
    groupExpressionInput: string;
    groupExpressionFeedback: GroupExpressionFeedback | null;
    onGroupExpressionInputChange: (value: string) => void;
    onCheckGroupExpression: () => void;
    onAddGroupExpression: () => void;
};

export default function ExpressionCheckPanel({
    solverForm,
    groupExpressionInput,
    groupExpressionFeedback,
    onGroupExpressionInputChange,
    onCheckGroupExpression,
    onAddGroupExpression,
}: ExpressionCheckPanelProps) {
    return (
        <section className="rounded-lg border border-slate-300 bg-[#fbfcfd] shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        Expression Check
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Test a full {solverForm} grouping answer.
                    </p>
                </div>
                <span className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {solverForm}
                </span>
            </div>

            <div className="space-y-2 p-4">
                <input
                    type="text"
                    value={groupExpressionInput}
                    onChange={(event) =>
                        onGroupExpressionInputChange(event.target.value)
                    }
                    placeholder={
                        solverForm === 'SOP'
                            ? "A'B + A.B'"
                            : "(A + B').(A' + B)"
                    }
                    className={monoInputClass}
                />

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onCheckGroupExpression}
                        className={secondaryButtonClass}
                    >
                        Check
                    </button>
                    <button
                        type="button"
                        onClick={onAddGroupExpression}
                        className={primaryButtonClass}
                    >
                        Add terms
                    </button>
                </div>

                {groupExpressionFeedback !== null && (
                    <p
                        className={`rounded-md px-2.5 py-2 text-xs font-medium ${
                            groupExpressionFeedback.status === 'correct'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                                : groupExpressionFeedback.status === 'incorrect'
                                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                                  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                        }`}
                    >
                        {groupExpressionFeedback.message}
                    </p>
                )}
            </div>
        </section>
    );
}
