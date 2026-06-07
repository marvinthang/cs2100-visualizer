import type {
    KMapSolveForm,
    KMapSolveAnalysis,
    KMapSolvePI,
} from '../../../core/kmap/kmapSolver';
import type { KMapGroup } from '../../../core/kmap/kmapModel';
import {
    formatExpression,
    formatPosTerm,
    formatSolverTerm,
} from '../kmapPageUtils';

const groupAccentClasses = [
    'border-l-emerald-500',
    'border-l-amber-500',
    'border-l-rose-500',
    'border-l-violet-500',
    'border-l-cyan-500',
    'border-l-lime-500',
];

const groupDotClasses = [
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-lime-500',
];

function getSolverGroupId(index: number): number {
    return -(index + 1);
}

function getGroupAccentClass(index: number): string {
    return groupAccentClasses[index % groupAccentClasses.length];
}

function getGroupDotClass(index: number): string {
    return groupDotClasses[index % groupDotClasses.length];
}

function formatSolverGroupTerm(
    term: string,
    variableNames: string[],
    solverForm: KMapSolveForm,
): string {
    return solverForm === 'SOP'
        ? formatSolverTerm(term, variableNames)
        : formatPosTerm(term, variableNames);
}

type KMapResultPanelProps = {
    groupView: 'manual' | 'solver';
    solverForm: KMapSolveForm;
    activeGroupId: number | null;
    manualGroups: KMapGroup[];
    manualExpression: string;
    activeManualGroup: KMapGroup | undefined;
    activeManualExpression: string | null;
    solverAnalysis: KMapSolveAnalysis;
    solverSolution: KMapSolvePI[];
    solverPrimeListView: 'expression' | 'all';
    variableNames: string[];
    onSolverPrimeListViewChange: (view: 'expression' | 'all') => void;
    onGroupViewChange: (view: 'manual' | 'solver') => void;
    onActiveGroupChange: (groupId: number | null) => void;
};

export default function KMapResultPanel({
    groupView,
    solverForm,
    activeGroupId,
    manualGroups,
    manualExpression,
    activeManualGroup,
    activeManualExpression,
    solverAnalysis,
    solverSolution,
    solverPrimeListView,
    variableNames,
    onSolverPrimeListViewChange,
    onGroupViewChange,
    onActiveGroupChange,
}: KMapResultPanelProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Result</h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {solverForm}
                </span>
            </div>

            <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <button
                    type="button"
                    onClick={() => {
                        onGroupViewChange('manual');
                        onActiveGroupChange(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        groupView === 'manual'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Manual
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onGroupViewChange('solver');
                        onActiveGroupChange(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        groupView === 'solver'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Solver
                </button>
            </div>

            {groupView === 'manual' ? (
                <ManualResult
                    manualGroups={manualGroups}
                    manualExpression={manualExpression}
                    activeManualGroup={activeManualGroup}
                    activeManualExpression={activeManualExpression}
                />
            ) : (
                <SolverResult
                    activeGroupId={activeGroupId}
                    solverForm={solverForm}
                    solverAnalysis={solverAnalysis}
                    solverSolution={solverSolution}
                    solverPrimeListView={solverPrimeListView}
                    variableNames={variableNames}
                    onSolverPrimeListViewChange={onSolverPrimeListViewChange}
                    onActiveGroupChange={onActiveGroupChange}
                    onGroupViewChange={onGroupViewChange}
                />
            )}
        </div>
    );
}

function ManualResult({
    manualGroups,
    manualExpression,
    activeManualGroup,
    activeManualExpression,
}: {
    manualGroups: KMapGroup[];
    manualExpression: string;
    activeManualGroup: KMapGroup | undefined;
    activeManualExpression: string | null;
}) {
    return (
        <div className="mt-3">
            <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-100">
                {manualExpression}
            </div>

            {manualGroups.length === 0 ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                    Add manual groups to build an expression.
                </p>
            ) : (
                <>
                    <p className="mt-2 font-mono text-xs text-slate-600">
                        {manualGroups.length} manual{' '}
                        {manualGroups.length === 1 ? 'group' : 'groups'}:{' '}
                        {manualGroups.map((group) => `G${group.id}`).join(', ')}
                    </p>

                    {activeManualGroup !== undefined && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Selected group expression
                            </div>
                            <p className="font-mono text-xs text-slate-700">
                                {activeManualExpression}
                            </p>
                            <p className="mt-1 font-mono text-xs text-slate-500">
                                {activeManualGroup.minterms
                                    .map((minterm) => `m${minterm}`)
                                    .join(', ')}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SolverResult({
    activeGroupId,
    solverForm,
    solverAnalysis,
    solverSolution,
    solverPrimeListView,
    variableNames,
    onSolverPrimeListViewChange,
    onActiveGroupChange,
    onGroupViewChange,
}: {
    activeGroupId: number | null;
    solverForm: KMapSolveForm;
    solverAnalysis: KMapSolveAnalysis;
    solverSolution: KMapSolvePI[];
    solverPrimeListView: 'expression' | 'all';
    variableNames: string[];
    onSolverPrimeListViewChange: (view: 'expression' | 'all') => void;
    onActiveGroupChange: (groupId: number | null) => void;
    onGroupViewChange: (view: 'manual' | 'solver') => void;
}) {
    return (
        <>
            <div className="mt-3 rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-100">
                {formatExpression(solverSolution, variableNames, solverForm)}
            </div>

            {solverSolution.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                    {solverForm === 'SOP'
                        ? 'No 1-cells to solve yet.'
                        : 'No 0-cells to solve yet.'}
                </p>
            ) : (
                <ul className="mt-3 space-y-2">
                    {solverSolution.map((implicant, index) => {
                        const primeIndex =
                            solverAnalysis.primeImplicants.findIndex(
                                (primeImplicant) =>
                                    primeImplicant.term === implicant.term,
                            );
                        const id = getSolverGroupId(
                            primeIndex === -1 ? index : primeIndex,
                        );
                        const isActive = activeGroupId === id;

                        return (
                            <li
                                key={`${implicant.term}-${index}`}
                                className={`rounded-lg border border-l-4 bg-slate-50 p-3 transition ${getGroupAccentClass(
                                    primeIndex === -1 ? index : primeIndex,
                                )} ${
                                    isActive
                                        ? 'border-blue-400 ring-2 ring-blue-200'
                                        : 'border-slate-200'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        onGroupViewChange('solver');
                                        onActiveGroupChange(
                                            activeGroupId === id ? null : id,
                                        );
                                    }}
                                    className="flex w-full items-center justify-between gap-3 text-left"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${getGroupDotClass(
                                                primeIndex === -1
                                                    ? index
                                                    : primeIndex,
                                            )}`}
                                        />
                                        <span className="text-sm font-semibold text-slate-900">
                                            {formatSolverGroupTerm(
                                                implicant.term,
                                                variableNames,
                                                solverForm,
                                            )}
                                        </span>
                                    </span>
                                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                                        {implicant.isEPI ? 'EPI' : 'PI'}
                                    </span>
                                </button>
                                <p className="mt-2 font-mono text-xs text-slate-600">
                                    {implicant.minterms
                                        .map((minterm) => `m${minterm}`)
                                        .join(', ')}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}

            <AllPrimeImplicants
                activeGroupId={activeGroupId}
                listView={solverPrimeListView}
                solverForm={solverForm}
                primeImplicants={solverAnalysis.primeImplicants}
                solverSolution={solverSolution}
                variableNames={variableNames}
                onListViewChange={onSolverPrimeListViewChange}
                onActiveGroupChange={onActiveGroupChange}
                onGroupViewChange={onGroupViewChange}
            />
        </>
    );
}

function AllPrimeImplicants({
    activeGroupId,
    listView,
    solverForm,
    primeImplicants,
    solverSolution,
    variableNames,
    onListViewChange,
    onActiveGroupChange,
    onGroupViewChange,
}: {
    activeGroupId: number | null;
    listView: 'expression' | 'all';
    solverForm: KMapSolveForm;
    primeImplicants: KMapSolvePI[];
    solverSolution: KMapSolvePI[];
    variableNames: string[];
    onListViewChange: (view: 'expression' | 'all') => void;
    onActiveGroupChange: (groupId: number | null) => void;
    onGroupViewChange: (view: 'manual' | 'solver') => void;
}) {
    const solutionTerms = new Set(
        solverSolution.map((implicant) => implicant.term),
    );
    const visibleImplicants = primeImplicants
        .map((implicant, index) => ({ implicant, index }))
        .filter(
            ({ implicant }) =>
                listView === 'all' || solutionTerms.has(implicant.term),
        )
        .sort(
            (left, right) =>
                Number(right.implicant.isEPI) - Number(left.implicant.isEPI) ||
                left.index - right.index,
        );

    return (
        <div className="mt-4 border-t border-slate-200 pt-3">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700">
                    {solverForm === 'SOP' ? 'All PI / EPI' : 'All POS Groups'}
                </h3>
                <span className="text-xs text-slate-500">
                    {visibleImplicants.length} shown
                </span>
            </div>

            <div className="mb-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <button
                    type="button"
                    onClick={() => onListViewChange('expression')}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                        listView === 'expression'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Expression
                </button>
                <button
                    type="button"
                    onClick={() => onListViewChange('all')}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                        listView === 'all'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    All
                </button>
            </div>

            {primeImplicants.length === 0 ? (
                <p className="text-xs text-slate-500">
                    No prime implicants yet.
                </p>
            ) : visibleImplicants.length === 0 ? (
                <p className="text-xs text-slate-500">
                    No expression groups selected yet.
                </p>
            ) : (
                <ul className="max-h-52 space-y-1 overflow-auto">
                    {visibleImplicants.map(({ implicant, index }) => {
                        const id = getSolverGroupId(index);
                        const isActive = activeGroupId === id;

                        return (
                            <li key={implicant.term}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onGroupViewChange('solver');
                                        onActiveGroupChange(
                                            isActive ? null : id,
                                        );
                                    }}
                                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition ${
                                        isActive
                                            ? 'bg-blue-50 ring-2 ring-blue-200'
                                            : 'bg-slate-50 hover:bg-slate-100'
                                    }`}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${getGroupDotClass(
                                                index,
                                            )}`}
                                        />
                                        <span className="font-mono text-xs text-slate-700">
                                            {formatSolverGroupTerm(
                                                implicant.term,
                                                variableNames,
                                                solverForm,
                                            )}
                                        </span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-[10px] text-slate-500">
                                            {implicant.covers
                                                .map((minterm) => `m${minterm}`)
                                                .join(', ')}
                                        </span>
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                                implicant.isEPI
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {implicant.isEPI ? 'EPI' : 'PI'}
                                        </span>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
