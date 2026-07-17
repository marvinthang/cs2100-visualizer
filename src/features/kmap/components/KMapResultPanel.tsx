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
    solverAnalysis,
    solverSolution,
    solverPrimeListView,
    variableNames,
    onSolverPrimeListViewChange,
    onGroupViewChange,
    onActiveGroupChange,
}: KMapResultPanelProps) {
    return (
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-[#fbfcfd] dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        Result
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manual expression or solver answer.
                    </p>
                </div>
                <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                    {solverForm}
                </span>
            </div>

            <div className="mx-4 mt-4 grid grid-cols-2 rounded-md bg-slate-200/70 dark:bg-slate-800 p-1">
                <button
                    type="button"
                    onClick={() => {
                        onGroupViewChange('manual');
                        onActiveGroupChange(null);
                    }}
                    className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                        groupView === 'manual'
                            ? 'bg-white text-slate-900 dark:bg-slate-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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
                    className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                        groupView === 'solver'
                            ? 'bg-white text-slate-900 dark:bg-slate-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                    Solver
                </button>
            </div>

            {groupView === 'manual' ? (
                <ManualResult
                    manualGroups={manualGroups}
                    manualExpression={manualExpression}
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
}: {
    manualGroups: KMapGroup[];
    manualExpression: string;
}) {
    return (
        <div className="px-4 pb-4 pt-3">
            <div className="rounded-md bg-slate-950 p-4 font-mono text-sm text-slate-100 shadow-inner">
                {manualExpression}
            </div>

            {manualGroups.length === 0 ? (
                <p className="mt-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-500 dark:text-slate-400">
                    Add manual groups to build an expression.
                </p>
            ) : (
                <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {manualGroups.length} manual{' '}
                    {manualGroups.length === 1 ? 'group' : 'groups'}:{' '}
                    {manualGroups.map((group) => `G${group.id}`).join(', ')}
                </p>
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
            <div className="mx-4 mt-3 rounded-md bg-slate-950 p-4 font-mono text-sm text-slate-100 shadow-inner">
                {formatExpression(solverSolution, variableNames, solverForm)}
            </div>

            {solverSolution.length === 0 ? (
                <p className="mx-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {solverForm === 'SOP'
                        ? 'No 1-cells to solve yet.'
                        : 'No 0-cells to solve yet.'}
                </p>
            ) : (
                <ul className="mx-4 mt-3 space-y-2">
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
                                className={`rounded-md border border-l-4 bg-white dark:bg-slate-800 p-3 transition ${getGroupAccentClass(
                                    primeIndex === -1 ? index : primeIndex,
                                )} ${
                                    isActive
                                        ? 'border-sky-400 ring-2 ring-sky-200'
                                        : 'border-slate-300 dark:border-slate-700'
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
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {formatSolverGroupTerm(
                                                implicant.term,
                                                variableNames,
                                                solverForm,
                                            )}
                                        </span>
                                    </span>
                                    <span className="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        {implicant.isEPI ? 'EPI' : 'PI'}
                                    </span>
                                </button>
                                <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-400">
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
        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 px-4 pb-4 pt-3">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {solverForm === 'SOP' ? 'All PI / EPI' : 'All POS Groups'}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    {visibleImplicants.length} shown
                </span>
            </div>

            <div className="mb-3 grid grid-cols-2 rounded-md bg-slate-200/70 dark:bg-slate-800 p-1">
                <button
                    type="button"
                    onClick={() => onListViewChange('expression')}
                    className={`rounded px-2 py-1.5 text-xs font-semibold transition ${
                        listView === 'expression'
                            ? 'bg-white text-slate-900 dark:bg-slate-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                    Expression
                </button>
                <button
                    type="button"
                    onClick={() => onListViewChange('all')}
                    className={`rounded px-2 py-1.5 text-xs font-semibold transition ${
                        listView === 'all'
                            ? 'bg-white text-slate-900 dark:bg-slate-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                    All
                </button>
            </div>

            {primeImplicants.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    No prime implicants yet.
                </p>
            ) : visibleImplicants.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                                    className={`flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                                        isActive
                                            ? 'border-sky-200 bg-sky-50 ring-2 ring-sky-100'
                                            : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${getGroupDotClass(
                                                index,
                                            )}`}
                                        />
                                        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                                            {formatSolverGroupTerm(
                                                implicant.term,
                                                variableNames,
                                                solverForm,
                                            )}
                                        </span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                            {implicant.covers
                                                .map((minterm) => `m${minterm}`)
                                                .join(', ')}
                                        </span>
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                                implicant.isEPI
                                                    ? 'bg-sky-100 text-sky-700'
                                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
