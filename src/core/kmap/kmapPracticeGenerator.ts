import {
    createKMapModel,
    getKMap2DArray,
    updateKMapCell,
    type KMapGroup,
    type KMapModel,
    type VariableCount,
} from './kmapModel';
import { analyzeKMap, type KMapSolveForm } from './kmapSolver';

export type KMapPracticeDifficulty = 'easy' | 'medium' | 'hard';

export type KMapPracticeMap = {
    model: KMapModel;
    seedGroups: KMapGroup[];
    targetMinterms: number[];
    dontCareMinterms: number[];
};

type GeneratePracticeKMapOptions = {
    variableCount: VariableCount;
    form?: KMapSolveForm;
    difficulty?: KMapPracticeDifficulty;
    random?: () => number;
};

type PracticeConfig = {
    groupCount: [number, number];
    dontCareCount: [number, number];
    minSolutionGroups: number;
    maxSolutionGroups: number;
    maxPrimeImplicants: number;
    minNewCellsPerSeedGroup: number;
    maxSeedOverlapRatio: number;
    allowWrap: boolean;
    allowedGroupSizes: number[];
};

type RectangleCandidate = {
    minterms: number[];
    wraps: boolean;
};

const practiceConfigs: Record<KMapPracticeDifficulty, PracticeConfig> = {
    easy: {
        groupCount: [1, 2],
        dontCareCount: [0, 1],
        minSolutionGroups: 1,
        maxSolutionGroups: 2,
        maxPrimeImplicants: 4,
        minNewCellsPerSeedGroup: 1,
        maxSeedOverlapRatio: 0.75,
        allowWrap: false,
        allowedGroupSizes: [2, 4, 8],
    },
    medium: {
        groupCount: [3, 4],
        dontCareCount: [0, 3],
        minSolutionGroups: 2,
        maxSolutionGroups: 4,
        maxPrimeImplicants: 7,
        minNewCellsPerSeedGroup: 2,
        maxSeedOverlapRatio: 0.5,
        allowWrap: true,
        allowedGroupSizes: [2, 4, 8],
    },
    hard: {
        groupCount: [4, 5],
        dontCareCount: [1, 5],
        minSolutionGroups: 4,
        maxSolutionGroups: 5,
        maxPrimeImplicants: 10,
        minNewCellsPerSeedGroup: 2,
        maxSeedOverlapRatio: 0.5,
        allowWrap: true,
        allowedGroupSizes: [1, 2, 4, 8],
    },
};

function powersOfTwoUpTo(max: number): number[] {
    const values: number[] = [];

    for (let value = 1; value <= max; value *= 2) {
        values.push(value);
    }

    return values;
}

function randomInt(
    random: () => number,
    minInclusive: number,
    maxInclusive: number,
): number {
    return (
        minInclusive + Math.floor(random() * (maxInclusive - minInclusive + 1))
    );
}

function shuffle<T>(items: T[], random: () => number): T[] {
    const next = [...items];

    for (let index = next.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }

    return next;
}

function countNewMinterms(
    candidate: RectangleCandidate,
    coveredMinterms: Set<number>,
): number {
    return candidate.minterms.filter((minterm) => !coveredMinterms.has(minterm))
        .length;
}

function selectSeedGroups({
    candidates,
    groupCount,
    config,
    random,
}: {
    candidates: RectangleCandidate[];
    groupCount: number;
    config: PracticeConfig;
    random: () => number;
}): RectangleCandidate[] | null {
    const selectedGroups: RectangleCandidate[] = [];
    const coveredMinterms = new Set<number>();

    while (selectedGroups.length < groupCount) {
        const eligibleCandidates = candidates.filter((candidate) => {
            if (
                selectedGroups.some(
                    (group) =>
                        group.minterms.join(',') ===
                        candidate.minterms.join(','),
                )
            ) {
                return false;
            }

            if (selectedGroups.length === 0) {
                return true;
            }

            const newMintermCount = countNewMinterms(
                candidate,
                coveredMinterms,
            );
            const overlapRatio =
                (candidate.minterms.length - newMintermCount) /
                candidate.minterms.length;

            return (
                newMintermCount >= config.minNewCellsPerSeedGroup &&
                overlapRatio <= config.maxSeedOverlapRatio
            );
        });

        if (eligibleCandidates.length === 0) {
            return null;
        }

        const nextGroup = shuffle(eligibleCandidates, random)[
            Math.floor(random() * eligibleCandidates.length)
        ];
        selectedGroups.push(nextGroup);

        for (const minterm of nextGroup.minterms) {
            coveredMinterms.add(minterm);
        }
    }

    return selectedGroups;
}

function getRectangleMinterms(
    model: KMapModel,
    rowStart: number,
    colStart: number,
    rowSize: number,
    colSize: number,
): number[] {
    const rows = getKMap2DArray(model);

    return Array.from({ length: rowSize }).flatMap((_, rowOffset) =>
        Array.from({ length: colSize }).map((__, colOffset) => {
            const row = (rowStart + rowOffset) % model.rowLabels.length;
            const col = (colStart + colOffset) % model.colLabels.length;
            return rows[row][col].minterm;
        }),
    );
}

function getRectangleCandidates(
    model: KMapModel,
    config: PracticeConfig,
): RectangleCandidate[] {
    const rowCount = model.rowLabels.length;
    const colCount = model.colLabels.length;
    const uniqueCandidates = new Map<string, RectangleCandidate>();

    for (const rowSize of powersOfTwoUpTo(rowCount)) {
        for (const colSize of powersOfTwoUpTo(colCount)) {
            const groupSize = rowSize * colSize;

            if (!config.allowedGroupSizes.includes(groupSize)) {
                continue;
            }

            for (let rowStart = 0; rowStart < rowCount; rowStart++) {
                for (let colStart = 0; colStart < colCount; colStart++) {
                    const wraps =
                        rowStart + rowSize > rowCount ||
                        colStart + colSize > colCount;

                    if (wraps && !config.allowWrap) {
                        continue;
                    }

                    const minterms = getRectangleMinterms(
                        model,
                        rowStart,
                        colStart,
                        rowSize,
                        colSize,
                    ).sort((a, b) => a - b);
                    const key = minterms.join(',');

                    uniqueCandidates.set(key, { minterms, wraps });
                }
            }
        }
    }

    return Array.from(uniqueCandidates.values());
}

function canDemoteSeedCellToDontCare(
    minterm: number,
    seedGroups: RectangleCandidate[],
    currentTargetMinterms: Set<number>,
): boolean {
    return seedGroups.every((group) => {
        if (!group.minterms.includes(minterm)) {
            return true;
        }

        return group.minterms.some(
            (groupMinterm) =>
                groupMinterm !== minterm &&
                currentTargetMinterms.has(groupMinterm),
        );
    });
}

function selectDontCareMinterms({
    allMinterms,
    seedGroups,
    count,
    random,
}: {
    allMinterms: number[];
    seedGroups: RectangleCandidate[];
    count: number;
    random: () => number;
}): { targetMinterms: number[]; dontCareMinterms: number[] } {
    const targetMinterms = new Set(
        seedGroups.flatMap((group) => group.minterms),
    );
    const dontCareMinterms = new Set<number>();
    const seedMinterms = Array.from(targetMinterms);
    const preferredSeedDontCareCount = Math.ceil(count / 2);

    for (const minterm of shuffle(seedMinterms, random)) {
        if (dontCareMinterms.size >= preferredSeedDontCareCount) {
            break;
        }

        if (
            targetMinterms.size <= 2 ||
            !canDemoteSeedCellToDontCare(minterm, seedGroups, targetMinterms)
        ) {
            continue;
        }

        targetMinterms.delete(minterm);
        dontCareMinterms.add(minterm);
    }

    const outsideSeedMinterms = allMinterms.filter(
        (minterm) =>
            !targetMinterms.has(minterm) && !dontCareMinterms.has(minterm),
    );

    for (const minterm of shuffle(outsideSeedMinterms, random)) {
        if (dontCareMinterms.size >= count) {
            break;
        }

        dontCareMinterms.add(minterm);
    }

    return {
        targetMinterms: Array.from(targetMinterms).sort((a, b) => a - b),
        dontCareMinterms: Array.from(dontCareMinterms).sort((a, b) => a - b),
    };
}

function buildModelFromPracticeCells({
    variableCount,
    form,
    targetMinterms,
    dontCareMinterms,
}: {
    variableCount: VariableCount;
    form: KMapSolveForm;
    targetMinterms: number[];
    dontCareMinterms: number[];
}): KMapModel {
    const targetValue = form === 'SOP' ? 1 : 0;
    const defaultValue = form === 'SOP' ? 0 : 1;
    let model = createKMapModel(variableCount);

    for (const cell of model.cells) {
        model = updateKMapCell(model, cell.minterm, defaultValue);
    }

    for (const minterm of targetMinterms) {
        model = updateKMapCell(model, minterm, targetValue);
    }

    for (const minterm of dontCareMinterms) {
        model = updateKMapCell(model, minterm, 'X');
    }

    return model;
}

function isGoodPracticeMap({
    model,
    form,
    targetMinterms,
    config,
}: {
    model: KMapModel;
    form: KMapSolveForm;
    targetMinterms: number[];
    config: PracticeConfig;
}): boolean {
    const totalCells = model.cells.length;
    const analysis = analyzeKMap(model, form);

    return (
        targetMinterms.length >= 2 &&
        targetMinterms.length <= totalCells - 2 &&
        analysis.solution.length >= config.minSolutionGroups &&
        analysis.solution.length <= config.maxSolutionGroups &&
        analysis.primeImplicants.length <= config.maxPrimeImplicants &&
        analysis.solution.every((implicant) => implicant.minterms.length >= 2)
    );
}

function makeFallbackPracticeMap(
    variableCount: VariableCount,
    form: KMapSolveForm,
): KMapPracticeMap {
    const model = createKMapModel(variableCount);
    const targetMinterms = getRectangleMinterms(model, 0, 0, 1, 2).sort(
        (a, b) => a - b,
    );

    return {
        model: buildModelFromPracticeCells({
            variableCount,
            form,
            targetMinterms,
            dontCareMinterms: [],
        }),
        seedGroups: [{ id: 1, minterms: targetMinterms }],
        targetMinterms,
        dontCareMinterms: [],
    };
}

export function generatePracticeKMap({
    variableCount,
    form = 'SOP',
    difficulty = 'medium',
    random = Math.random,
}: GeneratePracticeKMapOptions): KMapPracticeMap {
    const config = practiceConfigs[difficulty];
    const emptyModel = createKMapModel(variableCount);
    const candidates = getRectangleCandidates(emptyModel, config);

    if (candidates.length === 0) {
        return makeFallbackPracticeMap(variableCount, form);
    }

    for (let attempt = 0; attempt < 200; attempt++) {
        const groupCount = randomInt(
            random,
            config.groupCount[0],
            config.groupCount[1],
        );
        const selectedGroups = selectSeedGroups({
            candidates: shuffle(candidates, random),
            groupCount,
            config,
            random,
        });

        if (selectedGroups === null) {
            continue;
        }

        const allMinterms = emptyModel.cells.map((cell) => cell.minterm);
        const dontCareCount = Math.min(
            randomInt(random, config.dontCareCount[0], config.dontCareCount[1]),
            allMinterms.length,
        );
        const { targetMinterms, dontCareMinterms } = selectDontCareMinterms({
            allMinterms,
            seedGroups: selectedGroups,
            count: dontCareCount,
            random,
        });
        const model = buildModelFromPracticeCells({
            variableCount,
            form,
            targetMinterms,
            dontCareMinterms,
        });

        if (
            isGoodPracticeMap({
                model,
                form,
                targetMinterms,
                config,
            })
        ) {
            return {
                model,
                seedGroups: selectedGroups.map((group, index) => ({
                    id: index + 1,
                    minterms: group.minterms,
                })),
                targetMinterms,
                dontCareMinterms,
            };
        }
    }

    return makeFallbackPracticeMap(variableCount, form);
}
