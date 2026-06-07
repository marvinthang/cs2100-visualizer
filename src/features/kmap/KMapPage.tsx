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
import KMapControls from './components/KMapControls';
import KMapGrid from './components/KMapGrid';
import KMapResultPanel from './components/KMapResultPanel';
import ManualGroupsPanel from './components/ManualGroupsPanel';
import {
    defaultVariableNames,
    formatGroupExpression,
    hasOverlap,
    parseMintermsInput,
    parseVariableNamesInput,
    parseGroupLiteralInput,
} from './kmapPageUtils';

export default function KMapPage() {
    const [variableCount, setVariableCount] = useState<VariableCount>(2);
    const [model, setModel] = useState(createKMapModel(variableCount));

    const [selectedMinterms, setSelectedMinterms] = useState<number[]>([]);
    const [mintermInput, setMintermInput] = useState('');
    const [dontCareInput, setDontCareInput] = useState('');
    const [variableNameInput, setVariableNameInput] = useState('A B');
    const [valueInputError, setValueInputError] = useState<string | null>(null);
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

    const groupTargetValue = solverForm === 'SOP' ? 1 : 0;
    const canSaveSelectedGroup = canCreateKMapGroup(
        model,
        selectedMinterms,
        groupTargetValue,
    );
    const selectedValuesAreGroupable = areKMapGroupCellsValid(
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
    const activeManualGroup = groups.find(
        (group) => group.id === activeGroupId,
    );
    const activeManualExpression =
        activeManualGroup === undefined
            ? null
            : formatGroupExpression(
                  model,
                  activeManualGroup.minterms,
                  variableNameResult.names,
                  solverForm,
              );
    const visibleGroups = groupView === 'manual' ? groups : solverGroups;

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
        setValueInputError(null);
        setGroupLiteralError(null);
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
        const oneMinterms = practiceMap.model.cells
            .filter((cell) => cell.value === 1)
            .map((cell) => cell.minterm)
            .sort((a, b) => a - b);

        setModel(practiceMap.model);
        setMintermInput(formatMintermInput(oneMinterms));
        setDontCareInput(formatMintermInput(practiceMap.dontCareMinterms));
        setSelectedGroupMinterms([]);
        setGroups([]);
        setActiveGroupId(null);
        setGroupView('manual');
        setNextGroupId(1);
        setMode('group');
        setSolverPrimeListView('expression');
        setValueInputError(null);
        setGroupLiteralError(null);
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
        setGroupLiteralInput('');
        setVariableNameInput(
            defaultVariableNames.slice(0, nextVariableCount).join(' '),
        );
        setValueInputError(null);
        setGroupLiteralError(null);
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
        setGroupLiteralError(null);
    }

    return (
        <main className="min-h-full bg-slate-50 p-4 text-slate-900 md:p-6">
            <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
                <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-2xl font-bold">K-map Visualizer</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Build maps, mark manual groups, and compare grouped
                            minterms.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                            {variableCount} variables
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                            {groups.length} groups
                        </span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 shadow-sm ring-1 ring-blue-100">
                            {solverSolution.length} solver groups
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                            {selectedMinterms.length} selected
                        </span>
                    </div>
                </header>

                <div className="grid gap-4 xl:grid-cols-[320px_minmax(360px,440px)_minmax(320px,380px)] xl:items-start xl:justify-center">
                    <KMapControls
                        mode={mode}
                        solverForm={solverForm}
                        variableCount={variableCount}
                        variableNameInput={variableNameInput}
                        variableNameError={variableNameResult.error}
                        mintermInput={mintermInput}
                        dontCareInput={dontCareInput}
                        valueInputError={valueInputError}
                        selectedMinterms={selectedMinterms}
                        canSaveSelectedGroup={canSaveSelectedGroup}
                        selectedValuesAreGroupable={selectedValuesAreGroupable}
                        selectedGroupIsAllDontCare={selectedGroupIsAllDontCare}
                        groupTargetValue={groupTargetValue}
                        practiceDifficulty={practiceDifficulty}
                        groupLiteralInput={groupLiteralInput}
                        groupLiteralError={groupLiteralError}
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
                        onPracticeDifficultyChange={setPracticeDifficulty}
                        onGeneratePracticeMap={handleGeneratePracticeMap}
                        onAddGroup={handleAddGroup}
                        onClearSelectedGroup={() =>
                            setSelectedGroupMinterms([])
                        }
                        onResetMap={() => resetMap()}
                        onGroupLiteralInputChange={setGroupLiteralInput}
                        onApplyGroupLiteral={handleApplyGroupLiteral}
                    />

                    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    K-map Grid
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Edit values or select rectangular groups.
                                </p>
                            </div>

                            <div className="flex gap-2 text-xs">
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                                    0
                                </span>
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                                    1
                                </span>
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                                    X
                                </span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                            <KMapGrid
                                model={model}
                                variableNames={variableNameResult.names}
                                selectedMinterms={selectedMinterms}
                                groups={visibleGroups}
                                activeGroupId={activeGroupId}
                                onCellClick={handleCellClick}
                            />
                        </div>
                    </section>

                    <section className="h-fit space-y-4">
                        <KMapResultPanel
                            groupView={groupView}
                            activeGroupId={activeGroupId}
                            solverForm={solverForm}
                            activeManualGroup={activeManualGroup}
                            activeManualExpression={activeManualExpression}
                            solverAnalysis={solverAnalysis}
                            solverSolution={solverSolution}
                            solverPrimeListView={solverPrimeListView}
                            variableNames={variableNameResult.names}
                            onSolverPrimeListViewChange={setSolverPrimeListView}
                            onGroupViewChange={setGroupView}
                            onActiveGroupChange={setActiveGroupId}
                        />

                        <ManualGroupsPanel
                            groups={groups}
                            activeGroupId={activeGroupId}
                            groupView={groupView}
                            onClearGroups={() => {
                                setGroups([]);
                                setActiveGroupId(null);
                            }}
                            onRemoveGroup={handleRemoveGroup}
                            onSelectGroup={setActiveGroupId}
                            onGroupViewChange={setGroupView}
                        />
                    </section>
                </div>
            </div>
        </main>
    );
}
