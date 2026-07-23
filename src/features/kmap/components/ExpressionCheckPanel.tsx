import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';
import CollapsibleSection from '../../../components/CollapsibleSection';
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
        <CollapsibleSection
            id="kmap-expression-check"
            title="Expression Check"
            subtitle={`Test a full ${solverForm} grouping answer.`}
            defaultOpen={false}
            meta={
                <span className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {solverForm}
                </span>
            }
        >
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
        </CollapsibleSection>
    );
}
