import type { KMapCell, KMapModel } from './kmapModel';

export type KMapSolveForm = 'SOP' | 'POS';

export type KMapSolvePI = {
    minterms: number[];
    covers: number[];
    term: string;
    isEPI: boolean;
};

export type KMapSolveAnalysis = {
    primeImplicants: KMapSolvePI[];
    solution: KMapSolvePI[];
};

function getCellBits(model: KMapModel, cell: KMapCell): string {
    return model.rowLabels[cell.row] + model.colLabels[cell.col];
}

function getTargetMinterms(model: KMapModel, form: KMapSolveForm): number[] {
    return model.cells
        .filter((cell) => cell.value === (form === 'SOP' ? 1 : 0))
        .map((cell) => cell.minterm);
}

function getCoveringCells(model: KMapModel, form: KMapSolveForm): KMapCell[] {
    const targetValue = form === 'SOP' ? 1 : 0;
    return model.cells.filter(
        (cell) => cell.value === targetValue || cell.value === 'X',
    );
}

function getTargetCover(
    minterms: number[],
    model: KMapModel,
    form: KMapSolveForm,
): number[] {
    const targetValue = form === 'SOP' ? 1 : 0;
    return minterms.filter(
        (minterm) =>
            model.cells.find((cell) => cell.minterm === minterm)?.value ===
            targetValue,
    );
}

function combineTerms(left: string, right: string): string | null {
    let differenceIndex = -1;

    for (let i = 0; i < left.length; i++) {
        if (left[i] === right[i]) {
            continue;
        }

        if (left[i] === '_' || right[i] === '_') {
            return null;
        }

        if (differenceIndex !== -1) {
            return null;
        }

        differenceIndex = i;
    }

    if (differenceIndex === -1) {
        return null;
    }

    return (
        left.slice(0, differenceIndex) + '_' + left.slice(differenceIndex + 1)
    );
}

export function getPiTerm(model: KMapModel): string[] {
    return getPiTermForForm(model, 'SOP');
}

function getPiTermForForm(model: KMapModel, form: KMapSolveForm): string[] {
    let currentTerms = getCoveringCells(model, form).map((cell) =>
        getCellBits(model, cell),
    );
    const primeTerms: string[] = [];

    while (currentTerms.length > 0) {
        const nextTerms: string[] = [];
        const usedTerms = new Set<string>();

        for (let i = 0; i < currentTerms.length; i++) {
            for (let j = i + 1; j < currentTerms.length; j++) {
                const combined = combineTerms(currentTerms[i], currentTerms[j]);

                if (combined === null) {
                    continue;
                }

                usedTerms.add(currentTerms[i]);
                usedTerms.add(currentTerms[j]);
                nextTerms.push(combined);
            }
        }

        for (const term of currentTerms) {
            const coversAtLeastOneTarget =
                getTargetCover(
                    getMintermsCoveredByPI(term, model, form),
                    model,
                    form,
                ).length > 0;

            if (!usedTerms.has(term) && coversAtLeastOneTarget) {
                primeTerms.push(term);
            }
        }

        currentTerms = Array.from(new Set(nextTerms));
    }

    return Array.from(new Set(primeTerms));
}

function getMintermsCoveredByPI(
    term: string,
    model: KMapModel,
    form: KMapSolveForm,
): number[] {
    return getCoveringCells(model, form)
        .filter((cell) => {
            const bits = getCellBits(model, cell);

            return [...term].every(
                (char, index) => char === '_' || char === bits[index],
            );
        })
        .map((cell) => cell.minterm)
        .sort((a, b) => a - b);
}

function buildPrimeImplicants(
    terms: string[],
    model: KMapModel,
    form: KMapSolveForm,
): KMapSolvePI[] {
    const coverCountByMinterm = new Map<number, number>();

    for (const term of terms) {
        const coveredTargets = getTargetCover(
            getMintermsCoveredByPI(term, model, form),
            model,
            form,
        );

        for (const minterm of coveredTargets) {
            coverCountByMinterm.set(
                minterm,
                (coverCountByMinterm.get(minterm) ?? 0) + 1,
            );
        }
    }

    return terms
        .map((term) => {
            const minterms = getMintermsCoveredByPI(term, model, form);
            const covers = getTargetCover(minterms, model, form);

            return {
                minterms,
                covers,
                term,
                isEPI: covers.some(
                    (minterm) => coverCountByMinterm.get(minterm) === 1,
                ),
            };
        })
        .sort(
            (a, b) =>
                b.covers.length - a.covers.length ||
                b.minterms.length - a.minterms.length ||
                a.term.localeCompare(b.term),
        );
}

function popcount(value: number): number {
    let count = 0;
    let remaining = value;

    while (remaining > 0) {
        count += remaining & 1;
        remaining >>= 1;
    }

    return count;
}

function getMasksByPopcount(count: number): number[] {
    return Array.from({ length: 1 << count }, (_, mask) => mask).sort(
        (a, b) => popcount(a) - popcount(b) || a - b,
    );
}

function coversAll(requiredMinterms: number[], implicants: KMapSolvePI[]) {
    const covered = new Set(
        implicants.flatMap((implicant) => implicant.covers),
    );

    return requiredMinterms.every((minterm) => covered.has(minterm));
}

function literalCount(term: string): number {
    return [...term].filter((char) => char !== '_').length;
}

function coverCost(implicants: KMapSolvePI[]): number {
    return implicants.reduce(
        (total, implicant) => total + literalCount(implicant.term),
        0,
    );
}

function findMinimumAdditionalCover(
    requiredMinterms: number[],
    candidates: KMapSolvePI[],
): KMapSolvePI[] {
    let bestCover: KMapSolvePI[] | null = null;

    for (const mask of getMasksByPopcount(candidates.length)) {
        if (bestCover !== null && popcount(mask) > bestCover.length) {
            return bestCover;
        }

        const selected = candidates.filter((_, index) => mask & (1 << index));

        if (!coversAll(requiredMinterms, selected)) {
            continue;
        }

        if (bestCover === null || coverCost(selected) < coverCost(bestCover)) {
            bestCover = selected;
        }
    }

    return bestCover ?? [];
}

export function analyzeKMap(
    model: KMapModel,
    form: KMapSolveForm = 'SOP',
): KMapSolveAnalysis {
    const targetMinterms = getTargetMinterms(model, form);

    if (targetMinterms.length === 0) {
        return { primeImplicants: [], solution: [] };
    }

    const primeImplicants = buildPrimeImplicants(
        getPiTermForForm(model, form),
        model,
        form,
    );
    const essentialImplicants = primeImplicants.filter(
        (implicant) => implicant.isEPI,
    );
    const coveredByEssential = new Set(
        essentialImplicants.flatMap((implicant) => implicant.covers),
    );
    const uncoveredMinterms = targetMinterms.filter(
        (minterm) => !coveredByEssential.has(minterm),
    );

    if (uncoveredMinterms.length === 0) {
        return {
            primeImplicants,
            solution: essentialImplicants,
        };
    }

    const additionalCover = findMinimumAdditionalCover(
        uncoveredMinterms,
        primeImplicants.filter((implicant) => !implicant.isEPI),
    );

    if (additionalCover.length === 0) {
        return { primeImplicants, solution: [] };
    }

    return {
        primeImplicants,
        solution: [...essentialImplicants, ...additionalCover],
    };
}

export function solveKMap(
    model: KMapModel,
    form: KMapSolveForm = 'SOP',
): KMapSolvePI[] {
    return analyzeKMap(model, form).solution;
}
