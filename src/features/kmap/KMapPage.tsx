import { useState } from 'react';
import {
    areKMapGroupCellsAllDontCare,
    areKMapGroupCellsValid,
    canCreateKMapGroup,
    createKMapModel,
    type KMapGroup,
    toggleKMapCell,
    updateKMapCell,
    type VariableCount,
} from '../../core/kmap/kmapModel';
import {
    generatePracticeKMap,
    type KMapPracticeDifficulty,
} from '../../core/kmap/kmapPracticeGenerator';
import { analyzeKMap, type KMapSolveForm } from '../../core/kmap/kmapSolver';
import { analyzeManualGroups } from '../../core/kmap/manualGroupAnalysis';
import KMapControls from './components/KMapControls';
import ExpressionCheckPanel from './components/ExpressionCheckPanel';
import KMapGrid from './components/KMapGrid';
import KMapGroupingPanel from './components/KMapGroupingPanel';
import KMapResultPanel from './components/KMapResultPanel';
import ManualGroupsPanel from './components/ManualGroupsPanel';
import {
    checkGroupExpression,
    defaultVariableNames,
    formatManualGroupsExpression,
    hasOverlap,
    parseBooleanExpressionInput,
    parseGroupExpressionInput,
    parseGroupLiteralInput,
    parseMintermsInput,
    parseVariableNamesInput,
} from './kmapPageUtils';
import ManualFeedbackPanel from './components/ManualFeedbackPanel';

function StatusPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="font-mono text-sm font-bold text-slate-900">
                {value}
            </div>
        </div>
    );
}

export default function KMapPage() {
    const [variableCount, setVariableCount] = useState<VariableCount>(4);
    const [model, setModel] = useState(createKMapModel(variableCount));

    const [selectedMinterms, setSelectedMinterms] = useState<number[]>([]);
    const [mintermInput, setMintermInput] = useState('');
    const [dontCareInput, setDontCareInput] = useState('');
    const [booleanExpressionInput, setBooleanExpressionInput] = useState('');
    const [variableNameInput, setVariableNameInput] = useState('A B C D');
    const [valueInputError, setValueInputError] = useState<string | null>(null);
    const [booleanExpressionError, setBooleanExpressionError] = useState<
        string | null
    >(null);
    const [groups, setGroups] = useState<KMapGroup[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [groupView, setGroupView] = useState<'manual' | 'solver'>('manual');
    const [nextGroupId, setNextGroupId] = useState(1);
    const [mode, setMode] = useState<'edit' | 'group'>('edit');
    const [solverPrimeListView, setSolverPrimeListView] = useState<
        'expression' | 'all'
    >('all');
    const [solverForm, setSolverForm] = useState<KMapSolveForm>('SOP');
    const [practiceDifficulty, setPracticeDifficulty] =
        useState<KMapPracticeDifficulty>('medium');
    const [groupLiteralInput, setGroupLiteralInput] = useState('');
    const [groupLiteralError, setGroupLiteralError] = useState<string | null>(
        null,
    );
    const [groupExpressionInput, setGroupExpressionInput] = useState('');
    const [groupExpressionFeedback, setGroupExpressionFeedback] = useState<{
        status: 'correct' | 'incorrect' | 'error';
        message: string;
    } | null>(null);

    const groupTargetValue = solverForm === 'SOP' ? 1 : 0;
    const canSaveSelectedGroup = canCreateKMapGroup(
        model,
        selectedMinterms,
        groupTargetValue,
    );
    const selectedCellsHaveValidValues = areKMapGroupCellsValid(
        model,
        selectedMinterms,
        groupTargetValue,
    );
    const selectedGroupIsAllDontCare = areKMapGroupCellsAllDontCare(
        model,
        selectedMinterms,
    );
    const variableNameResult = parseVariableNamesInput(
        variableNameInput,
        variableCount,
    );
    const maxMinterm = 2 ** variableCount - 1;
    const solverAnalysis = analyzeKMap(model, solverForm);
    const solverSolution = solverAnalysis.solution;
    const solverSolutionTerms = new Set(
        solverSolution.map((implicant) => implicant.term),
    );
    const allSolverGroups: KMapGroup[] = solverAnalysis.primeImplicants.map(
        (implicant, index) => ({
            id: -(index + 1),
            minterms: implicant.minterms,
            colorIndex: index,
        }),
    );
    const expressionSolverGroups = allSolverGroups.filter((group) => {
        const primeIndex = Math.abs(group.id) - 1;
        const implicant = solverAnalysis.primeImplicants[primeIndex];
        return (
            implicant !== undefined && solverSolutionTerms.has(implicant.term)
        );
    });
    const solverGroups =
        solverPrimeListView === 'expression'
            ? expressionSolverGroups
            : allSolverGroups;
    const manualExpression = formatManualGroupsExpression(
        model,
        groups,
        variableNameResult.names,
        solverForm,
    );
    const visibleGroups = groupView === 'manual' ? groups : solverGroups;
    const manualGroupAnalysis = analyzeManualGroups(
        model,
        groups,
        solverForm,
        solverSolution,
    );

    function setSelectedGroupMinterms(minterms: number[]) {
        const sortedMinterms = [...minterms].sort((a, b) => a - b);
        setSelectedMinterms(sortedMinterms);
    }

    function handleCellClick(minterm: number) {
        if (mode === 'edit') {
            setModel(toggleKMapCell(model, minterm));
            return;
        }

        setActiveGroupId(null);

        setSelectedMinterms((prev) => {
            const next = prev.includes(minterm)
                ? prev.filter((item) => item !== minterm)
                : [...prev, minterm];
            return next.sort((a, b) => a - b);
        });
    }

    function handleApplyValueInputs() {
        const mintermResult = parseMintermsInput(mintermInput, maxMinterm);
        const dontCareResult = parseMintermsInput(dontCareInput, maxMinterm);

        if (mintermResult.error !== null) {
            setValueInputError(`Minterms: ${mintermResult.error}`);
            return;
        }

        if (dontCareResult.error !== null) {
            setValueInputError(`Don't-cares: ${dontCareResult.error}`);
            return;
        }

        if (hasOverlap(mintermResult.minterms, dontCareResult.minterms)) {
            setValueInputError('A cell cannot be both 1 and X.');
            return;
        }

        let nextModel = createKMapModel(variableCount);

        for (const minterm of mintermResult.minterms) {
            nextModel = updateKMapCell(nextModel, minterm, 1);
        }

        for (const minterm of dontCareResult.minterms) {
            nextModel = updateKMapCell(nextModel, minterm, 'X');
        }

        setModel(nextModel);
        setSelectedGroupMinterms([]);
        setGroups([]);
        setActiveGroupId(null);
        setGroupView('manual');
        setNextGroupId(1);
        setBooleanExpressionInput('');
        setValueInputError(null);
        setBooleanExpressionError(null);
        setGroupLiteralError(null);
        setGroupExpressionFeedback(null);
    }

    function handleApplyBooleanExpression() {
        if (variableNameResult.error !== null) {
            setBooleanExpressionError(variableNameResult.error);
            return;
        }

        const result = parseBooleanExpressionInput(
            booleanExpressionInput,
            model,
            variableNameResult.names,
        );

        if (result.error !== null) {
            setBooleanExpressionError(result.error);
            return;
        }

        let nextModel = createKMapModel(variableCount);

        for (const minterm of result.minterms) {
            nextModel = updateKMapCell(nextModel, minterm, 1);
        }

        setModel(nextModel);
        setMintermInput(formatMintermInput(result.minterms));
        setDontCareInput('');
        setSelectedGroupMinterms([]);
        setGroups([]);
        setActiveGroupId(null);
        setGroupView('manual');
        setNextGroupId(1);
        setValueInputError(null);
        setBooleanExpressionError(null);
        setGroupLiteralError(null);
        setGroupExpressionFeedback(null);
    }

    function handleClearMapValues() {
        setModel(createKMapModel(variableCount));
        setSelectedGroupMinterms([]);
        setGroups([]);
        setActiveGroupId(null);
        setGroupView('manual');
        setNextGroupId(1);
        setMintermInput('');
        setDontCareInput('');
        setBooleanExpressionInput('');
        setGroupLiteralInput('');
        setGroupExpressionInput('');
        setValueInputError(null);
        setBooleanExpressionError(null);
        setGroupLiteralError(null);
        setGroupExpressionFeedback(null);
    }

    function formatMintermInput(minterms: number[]): string {
        return minterms.join(',');
    }

    function handleGeneratePracticeMap() {
        const practiceMap = generatePracticeKMap({
            variableCount,
            form: solverForm,
            difficulty: practiceDifficulty,
        });
        const actualOneMinterms = practiceMap.model.cells
            .filter((cell) => cell.value === 1)
            .map((cell) => cell.minterm)
            .sort((a, b) => a - b);

        setModel(practiceMap.model);
        setMintermInput(formatMintermInput(actualOneMinterms));
        setDontCareInput(formatMintermInput(practiceMap.dontCareMinterms));
        setBooleanExpressionInput('');
        setSelectedGroupMinterms([]);
        setGroups([]);
        setActiveGroupId(null);
        setGroupView('manual');
        setNextGroupId(1);
        setMode('group');
        setSolverPrimeListView('expression');
        setValueInputError(null);
        setBooleanExpressionError(null);
        setGroupLiteralError(null);
        setGroupExpressionFeedback(null);
    }

    function handleAddGroup() {
        if (!canSaveSelectedGroup) {
            return;
        }

        setGroups((groups) => [
            ...groups,
            {
                id: nextGroupId,
                minterms: [...selectedMinterms].sort((a, b) => a - b),
            },
        ]);
        setNextGroupId((id) => id + 1);
        setSelectedGroupMinterms([]);
        setActiveGroupId(null);
        setGroupView('manual');
    }

    function handleRemoveGroup(groupId: number) {
        setGroups((groups) => groups.filter((group) => group.id !== groupId));
        setActiveGroupId((id) => (id === groupId ? null : id));
    }

    function resetMap(nextVariableCount = variableCount) {
        setModel(createKMapModel(nextVariableCount));
        setSelectedGroupMinterms([]);
        setGroups([]);
        setActiveGroupId(null);
        setNextGroupId(1);
        setMintermInput('');
        setDontCareInput('');
        setBooleanExpressionInput('');
        setGroupLiteralInput('');
        setGroupExpressionInput('');
        setVariableNameInput(
            defaultVariableNames.slice(0, nextVariableCount).join(' '),
        );
        setValueInputError(null);
        setBooleanExpressionError(null);
        setGroupLiteralError(null);
        setGroupExpressionFeedback(null);
    }

    function handleApplyGroupLiteral() {
        if (variableNameResult.error !== null) {
            setGroupLiteralError(variableNameResult.error);
            return;
        }

        const result = parseGroupLiteralInput(
            groupLiteralInput,
            model,
            variableNameResult.names,
            solverForm,
        );

        if (result.error !== null) {
            setGroupLiteralError(result.error);
            return;
        }

        setSelectedGroupMinterms(result.minterms);
        setActiveGroupId(null);
        setGroupView('manual');
        setMode('group');
        setGroupLiteralError(null);
        setGroupExpressionFeedback(null);
    }

    function getGroupExpressionCheckMessage(
        check: ReturnType<typeof checkGroupExpression>,
        termCount: number,
    ) {
        const targetLabel = solverForm === 'SOP' ? '1-cells' : '0-cells';
        const groupLabel = termCount === 1 ? 'group' : 'groups';

        if (check.isCorrect) {
            return termCount === 0
                ? `Correct. No ${targetLabel} need grouping.`
                : `Correct. Covers all ${targetLabel} with ${termCount} ${groupLabel}.`;
        }

        const messages: string[] = [];

        if (check.missingMinterms.length > 0) {
            messages.push(
                `Missing: ${formatMintermLabels(check.missingMinterms)}`,
            );
        }

        if (check.invalidMinterms.length > 0) {
            messages.push(
                `Wrong cells: ${formatMintermLabels(check.invalidMinterms)}`,
            );
        }

        if (check.invalidGroupIndexes.length > 0) {
            messages.push(
                `Invalid terms: ${check.invalidGroupIndexes
                    .map((index) => index + 1)
                    .join(', ')}.`,
            );
        }

        return `Needs work. ${messages.join(' ')}`;
    }

    function formatMintermLabels(minterms: number[]) {
        return minterms.map((minterm) => `m${minterm}`).join(', ');
    }

    function getParsedGroupExpression() {
        if (variableNameResult.error !== null) {
            return {
                terms: [],
                error: variableNameResult.error,
            };
        }

        return parseGroupExpressionInput(
            groupExpressionInput,
            model,
            variableNameResult.names,
            solverForm,
        );
    }

    function handleCheckGroupExpression() {
        const result = getParsedGroupExpression();

        if (result.error !== null) {
            setGroupExpressionFeedback({
                status: 'error',
                message: result.error,
            });
            return;
        }

        const check = checkGroupExpression(
            model,
            result.terms.map((term) => term.minterms),
            solverForm,
        );

        setGroupExpressionFeedback({
            status: check.isCorrect ? 'correct' : 'incorrect',
            message: getGroupExpressionCheckMessage(check, result.terms.length),
        });
    }

    function handleAddGroupExpression() {
        const result = getParsedGroupExpression();

        if (result.error !== null) {
            setGroupExpressionFeedback({
                status: 'error',
                message: result.error,
            });
            return;
        }

        const check = checkGroupExpression(
            model,
            result.terms.map((term) => term.minterms),
            solverForm,
        );

        if (check.invalidGroupIndexes.length > 0) {
            setGroupExpressionFeedback({
                status: 'incorrect',
                message: getGroupExpressionCheckMessage(
                    check,
                    result.terms.length,
                ),
            });
            return;
        }

        const nextGroups = result.terms.map((term, index) => ({
            id: nextGroupId + index,
            minterms: term.minterms,
        }));

        setGroups((groups) => [...groups, ...nextGroups]);
        setNextGroupId((id) => id + nextGroups.length);
        setSelectedGroupMinterms([]);
        setActiveGroupId(null);
        setGroupView('manual');
        setMode('group');
        setGroupExpressionFeedback({
            status: check.isCorrect ? 'correct' : 'incorrect',
            message: getGroupExpressionCheckMessage(check, result.terms.length),
        });
    }

    function handleSolverFormChange(form: KMapSolveForm) {
        if (form === solverForm) {
            return;
        }

        setSolverForm(form);
        setActiveGroupId(null);
        setSelectedGroupMinterms([]);
        setGroups([]);
        setNextGroupId(1);
        setGroupView('manual');
        setSolverPrimeListView('all');
        setBooleanExpressionError(null);
        setGroupLiteralError(null);
        setGroupExpressionFeedback(null);
    }

    function handleSolverPrimeListViewChange(view: 'expression' | 'all') {
        setSolverPrimeListView(view);
        setActiveGroupId(null);
    }

    return (
        <main className="min-h-full bg-[#eef2f3] p-3 text-slate-900 sm:p-4 lg:p-6">
            <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
                <header className="rounded-lg border border-slate-200 bg-[#fbfcfd] px-4 py-3 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                                    K-map Visualizer
                                </h1>
                                <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                                    {solverForm}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Build the map, draw groups, and compare the
                                expression.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                            <StatusPill
                                label="Variables"
                                value={variableCount}
                            />
                            <StatusPill label="Manual" value={groups.length} />
                            <StatusPill
                                label="Solver"
                                value={solverSolution.length}
                            />
                            <StatusPill
                                label="Selected"
                                value={selectedMinterms.length}
                            />
                        </div>
                    </div>
                </header>

                <div className="grid gap-4 xl:grid-cols-[320px_minmax(600px,1fr)_380px] xl:items-start">
                    <section className="h-fit space-y-4 xl:sticky xl:top-6">
                        <KMapControls
                            mode={mode}
                            solverForm={solverForm}
                            variableCount={variableCount}
                            variableNameInput={variableNameInput}
                            variableNameError={variableNameResult.error}
                            mintermInput={mintermInput}
                            dontCareInput={dontCareInput}
                            valueInputError={valueInputError}
                            booleanExpressionInput={booleanExpressionInput}
                            booleanExpressionError={booleanExpressionError}
                            groupTargetValue={groupTargetValue}
                            practiceDifficulty={practiceDifficulty}
                            onModeChange={setMode}
                            onSolverFormChange={handleSolverFormChange}
                            onVariableCountChange={(newVariableCount) => {
                                setVariableCount(newVariableCount);
                                resetMap(newVariableCount);
                            }}
                            onVariableNameInputChange={setVariableNameInput}
                            onMintermInputChange={setMintermInput}
                            onDontCareInputChange={setDontCareInput}
                            onApplyValueInputs={handleApplyValueInputs}
                            onClearMapValues={handleClearMapValues}
                            onBooleanExpressionInputChange={
                                setBooleanExpressionInput
                            }
                            onApplyBooleanExpression={
                                handleApplyBooleanExpression
                            }
                            onPracticeDifficultyChange={setPracticeDifficulty}
                            onGeneratePracticeMap={handleGeneratePracticeMap}
                        />

                        <ExpressionCheckPanel
                            solverForm={solverForm}
                            groupExpressionInput={groupExpressionInput}
                            groupExpressionFeedback={groupExpressionFeedback}
                            onGroupExpressionInputChange={
                                setGroupExpressionInput
                            }
                            onCheckGroupExpression={handleCheckGroupExpression}
                            onAddGroupExpression={handleAddGroupExpression}
                        />
                    </section>

                    <section className="space-y-4">
                        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3">
                                <div>
                                    <h2 className="text-base font-semibold tracking-tight text-slate-950">
                                        K-map Grid
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {mode === 'edit'
                                            ? 'Click cells to cycle 0, 1, and X.'
                                            : `Select ${groupTargetValue}/X cells to form a valid group.`}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-1.5 text-xs">
                                    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700">
                                        {mode}
                                    </span>
                                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                                        target {groupTargetValue}/X
                                    </span>
                                    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono font-semibold text-slate-700">
                                        {selectedMinterms.length} selected
                                    </span>
                                </div>
                            </div>

                            <KMapGrid
                                model={model}
                                variableNames={variableNameResult.names}
                                selectedMinterms={selectedMinterms}
                                groups={visibleGroups}
                                activeGroupId={activeGroupId}
                                onCellClick={handleCellClick}
                            />
                        </div>

                        <KMapGroupingPanel
                            solverForm={solverForm}
                            selectedMinterms={selectedMinterms}
                            canSaveSelectedGroup={canSaveSelectedGroup}
                            selectedCellsHaveValidValues={
                                selectedCellsHaveValidValues
                            }
                            selectedGroupIsAllDontCare={
                                selectedGroupIsAllDontCare
                            }
                            groupTargetValue={groupTargetValue}
                            groupLiteralInput={groupLiteralInput}
                            groupLiteralError={groupLiteralError}
                            onAddGroup={handleAddGroup}
                            onClearSelectedGroup={() =>
                                setSelectedGroupMinterms([])
                            }
                            onGroupLiteralInputChange={setGroupLiteralInput}
                            onApplyGroupLiteral={handleApplyGroupLiteral}
                        />
                    </section>

                    <section className="h-fit space-y-4 xl:sticky xl:top-6">
                        <KMapResultPanel
                            groupView={groupView}
                            activeGroupId={activeGroupId}
                            solverForm={solverForm}
                            manualGroups={groups}
                            manualExpression={manualExpression}
                            solverAnalysis={solverAnalysis}
                            solverSolution={solverSolution}
                            solverPrimeListView={solverPrimeListView}
                            variableNames={variableNameResult.names}
                            onSolverPrimeListViewChange={
                                handleSolverPrimeListViewChange
                            }
                            onGroupViewChange={setGroupView}
                            onActiveGroupChange={setActiveGroupId}
                        />

                        <ManualGroupsPanel
                            model={model}
                            groups={groups}
                            activeGroupId={activeGroupId}
                            groupView={groupView}
                            solverForm={solverForm}
                            variableNames={variableNameResult.names}
                            onClearGroups={() => {
                                setGroups([]);
                                setActiveGroupId(null);
                            }}
                            onRemoveGroup={handleRemoveGroup}
                            onSelectGroup={setActiveGroupId}
                            onGroupViewChange={setGroupView}
                        />

                        <ManualFeedbackPanel
                            analysis={manualGroupAnalysis}
                            solverForm={solverForm}
                        />
                    </section>
                </div>
            </div>
        </main>
    );
}
