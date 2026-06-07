import type { KMapGroup, KMapModel } from './kmapModel';
import type { KMapSolveForm, KMapSolvePI } from './kmapSolver';

export type ManualGroupAnalysis = {
    requiredMinterms: number[];
    coveredMinterms: number[];
    missingMinterms: number[];
    redundantGroupIds: number[];
    manualGroupCount: number;
    solverGroupCount: number;
    isComplete: boolean;
    matchesSolverGroupCount: boolean;
};

function getRequiredMinterms(model: KMapModel, form: KMapSolveForm): number[] {
    const targetValue = form === 'SOP' ? 1 : 0;

    return model.cells
        .filter((cell) => cell.value === targetValue)
        .map((cell) => cell.minterm)
        .sort((a, b) => a - b);
}

function getCoveredRequiredMinterms(
    groups: KMapGroup[],
    requiredMinterms: number[],
): number[] {
    const requiredMintermsSet = new Set(requiredMinterms);

    const coveredMintermsSet = new Set(
        groups.flatMap((group) => group.minterms),
    );

    return Array.from(coveredMintermsSet)
        .filter((minterm) => requiredMintermsSet.has(minterm))
        .sort((a, b) => a - b);
}

function getRedundantGroupIds(
    groups: KMapGroup[],
    requiredMinterms: number[],
    coveredMinterms: number[],
): number[] {
    return groups
        .filter((group) => {
            const newGroup = groups.filter((g) => g.id !== group.id);

            const newCoveredMinterms = getCoveredRequiredMinterms(
                newGroup,
                requiredMinterms,
            );

            return newCoveredMinterms.length === coveredMinterms.length;
        })
        .map((group) => group.id);
}

export function analyzeManualGroups(
    model: KMapModel,
    groups: KMapGroup[],
    form: KMapSolveForm,
    solverSolution: KMapSolvePI[],
): ManualGroupAnalysis {
    const requiredMinterms = getRequiredMinterms(model, form);
    const coveredMinterms = getCoveredRequiredMinterms(
        groups,
        requiredMinterms,
    );
    const missingMinterms = requiredMinterms.filter(
        (minterm) => !coveredMinterms.includes(minterm),
    );
    const redundantGroupIds = getRedundantGroupIds(
        groups,
        requiredMinterms,
        coveredMinterms,
    );
    const solverGroupCount = solverSolution.length;
    const isComplete = missingMinterms.length === 0;
    const matchesSolverGroupCount =
        isComplete && groups.length === solverGroupCount;

    return {
        requiredMinterms,
        coveredMinterms,
        missingMinterms,
        redundantGroupIds,
        manualGroupCount: groups.length,
        solverGroupCount,
        isComplete,
        matchesSolverGroupCount,
    };
}
