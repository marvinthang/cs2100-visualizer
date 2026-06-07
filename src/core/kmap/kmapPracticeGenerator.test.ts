import { describe, expect, it } from 'vitest';
import {
    generatePracticeKMap,
    type KMapPracticeDifficulty,
} from './kmapPracticeGenerator';
import { analyzeKMap, type KMapSolveForm } from './kmapSolver';
import type { KMapCellValue, VariableCount } from './kmapModel';

function createSeededRandom(seed: number): () => number {
    let state = seed;

    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

function getMintermsWithValue(
    cells: Array<{ minterm: number; value: KMapCellValue }>,
    value: KMapCellValue,
): number[] {
    return cells
        .filter((cell) => cell.value === value)
        .map((cell) => cell.minterm)
        .sort((a, b) => a - b);
}

describe('generatePracticeKMap', () => {
    it.each([
        [2, 'SOP', 'easy'],
        [3, 'SOP', 'medium'],
        [4, 'SOP', 'hard'],
        [3, 'POS', 'medium'],
    ] satisfies Array<[VariableCount, KMapSolveForm, KMapPracticeDifficulty]>)(
        'generates a solvable %s-variable %s %s practice map',
        (variableCount, form, difficulty) => {
            const practiceMap = generatePracticeKMap({
                variableCount,
                form,
                difficulty,
                random: createSeededRandom(variableCount * 100),
            });
            const analysis = analyzeKMap(practiceMap.model, form);

            expect(analysis.solution.length).toBeGreaterThan(0);
            expect(
                analysis.solution.every((group) => group.minterms.length >= 2),
            ).toBe(true);
            expect(practiceMap.targetMinterms.length).toBeGreaterThanOrEqual(2);
        },
    );

    it('marks generated SOP targets as 1-cells', () => {
        const practiceMap = generatePracticeKMap({
            variableCount: 4,
            form: 'SOP',
            difficulty: 'medium',
            random: createSeededRandom(12),
        });

        expect(getMintermsWithValue(practiceMap.model.cells, 1)).toEqual(
            practiceMap.targetMinterms,
        );
    });

    it('marks generated POS targets as 0-cells', () => {
        const practiceMap = generatePracticeKMap({
            variableCount: 4,
            form: 'POS',
            difficulty: 'medium',
            random: createSeededRandom(18),
        });

        expect(getMintermsWithValue(practiceMap.model.cells, 0)).toEqual(
            practiceMap.targetMinterms,
        );
    });

    it('can place dont-cares inside generated seed groups', () => {
        const practiceMap = generatePracticeKMap({
            variableCount: 4,
            form: 'SOP',
            difficulty: 'hard',
            random: createSeededRandom(6),
        });
        const seedMinterms = new Set(
            practiceMap.seedGroups.flatMap((group) => group.minterms),
        );

        expect(
            practiceMap.dontCareMinterms.some((minterm) =>
                seedMinterms.has(minterm),
            ),
        ).toBe(true);
    });

    it('keeps hard maps from collapsing into one heavily-overlapped group', () => {
        for (const seed of [1, 2, 3, 4, 5]) {
            const practiceMap = generatePracticeKMap({
                variableCount: 4,
                form: 'SOP',
                difficulty: 'hard',
                random: createSeededRandom(seed),
            });
            const analysis = analyzeKMap(practiceMap.model, 'SOP');
            const coveredMinterms = new Set<number>();

            expect(analysis.solution.length).toBeGreaterThanOrEqual(2);
            expect(practiceMap.seedGroups.length).toBeGreaterThanOrEqual(3);

            for (const [index, group] of practiceMap.seedGroups.entries()) {
                const newMintermCount = group.minterms.filter(
                    (minterm) => !coveredMinterms.has(minterm),
                ).length;

                if (index > 0) {
                    expect(newMintermCount).toBeGreaterThanOrEqual(2);
                }

                for (const minterm of group.minterms) {
                    coveredMinterms.add(minterm);
                }
            }
        }
    });
});
