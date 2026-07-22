import type { ManualGroupAnalysis } from '../../../core/kmap/manualGroupAnalysis';
import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';
import CollapsibleSection from '../../../components/CollapsibleSection';

type ManualFeedbackPanelProps = {
    analysis: ManualGroupAnalysis;
    solverForm: KMapSolveForm;
};

function formatMinterms(minterms: number[]): string {
    if (minterms.length === 0) {
        return 'none';
    }

    return minterms.map((minterm) => `m${minterm}`).join(', ');
}

function formatGroupIds(groupIds: number[]): string {
    if (groupIds.length === 0) {
        return 'none';
    }

    return groupIds.map((id) => `Group ${id}`).join(', ');
}

export default function ManualFeedbackPanel({
    analysis,
    solverForm,
}: ManualFeedbackPanelProps) {
    const targetLabel = solverForm === 'SOP' ? '1-cells' : '0-cells';
    const overallStatus =
        analysis.isComplete && analysis.matchesSolverGroupCount
            ? 'Matches solver'
            : analysis.isComplete
              ? 'Complete'
              : 'Incomplete';

    return (
        <CollapsibleSection
            id="kmap-manual-feedback"
            title="Manual Feedback"
            subtitle="Coverage and minimality checks."
            defaultOpen={false}
            meta={
                <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${
                        analysis.isComplete && analysis.matchesSolverGroupCount
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            : 'bg-amber-50 text-amber-700 ring-amber-100'
                    }`}
                >
                    {overallStatus}
                </span>
            }
        >
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                <FeedbackRow
                    label="Coverage"
                    ok={analysis.isComplete}
                    text={
                        analysis.isComplete
                            ? `All required ${targetLabel} are covered.`
                            : `Missing ${formatMinterms(
                                  analysis.missingMinterms,
                              )}.`
                    }
                />

                <FeedbackRow
                    label="Redundant"
                    ok={analysis.redundantGroupIds.length === 0}
                    text={
                        analysis.redundantGroupIds.length === 0
                            ? 'No redundant groups found.'
                            : `${formatGroupIds(
                                  analysis.redundantGroupIds,
                              )} can be removed.`
                    }
                />

                <FeedbackRow
                    label="Minimality"
                    ok={analysis.matchesSolverGroupCount}
                    text={
                        analysis.matchesSolverGroupCount
                            ? 'Manual groups match the solver group count.'
                            : `Manual: ${analysis.manualGroupCount}, solver: ${analysis.solverGroupCount}.`
                    }
                />
            </div>
        </CollapsibleSection>
    );
}

function FeedbackRow({
    label,
    ok,
    text,
}: {
    label: string;
    ok: boolean;
    text: string;
}) {
    return (
        <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {label}
                </span>
                <span
                    className={`rounded px-2 py-0.5 font-semibold ${
                        ok
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                    }`}
                >
                    {ok ? 'OK' : 'Check'}
                </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {text}
            </p>
        </div>
    );
}
