import { describe, expect, it } from 'vitest';
import {
    createKMapModel,
    updateKMapCell,
    type KMapCellValue,
    type KMapModel,
    type VariableCount,
} from './kmapModel';
import { analyzeManualGroups } from './manualGroupAnalysis';
import { solveKMap } from './kmapSolver';

function withValues(
    variableCount: VariableCount,
    values: Record<number, KMapCellValue>,
): KMapModel {
    return Object.entries(values).reduce(
        (model, [minterm, value]) =>
            updateKMapCell(model, Number(minterm), value),
        createKMapModel(variableCount),
    );
}

describe('analyzeManualGroups', () => {
    it('detects complete SOP coverage', () => {
        const model = withValues(2, { 0: 1, 1: 1 });

        const analysis = analyzeManualGroups(
            model,
            [{ id: 1, minterms: [0, 1] }],
            'SOP',
            solveKMap(model, 'SOP'),
        );

        expect(analysis.requiredMinterms).toEqual([0, 1]);
        expect(analysis.coveredMinterms).toEqual([0, 1]);
        expect(analysis.missingMinterms).toEqual([]);
        expect(analysis.isComplete).toBe(true);
        expect(analysis.matchesSolverGroupCount).toBe(true);
    });

    it('detects missing required minterms', () => {
        const model = withValues(2, { 0: 1, 1: 1, 2: 1 });

        const analysis = analyzeManualGroups(
            model,
            [{ id: 1, minterms: [0, 1] }],
            'SOP',
            solveKMap(model, 'SOP'),
        );

        expect(analysis.coveredMinterms).toEqual([0, 1]);
        expect(analysis.missingMinterms).toEqual([2]);
        expect(analysis.isComplete).toBe(false);
        expect(analysis.matchesSolverGroupCount).toBe(false);
    });

    it('uses 0-cells as required minterms for POS', () => {
        const model = withValues(2, { 0: 0, 1: 0, 2: 1, 3: 1 });

        const analysis = analyzeManualGroups(
            model,
            [{ id: 1, minterms: [0, 1] }],
            'POS',
            solveKMap(model, 'POS'),
        );

        expect(analysis.requiredMinterms).toEqual([0, 1]);
        expect(analysis.isComplete).toBe(true);
        expect(analysis.matchesSolverGroupCount).toBe(true);
    });

    it('detects redundant manual groups', () => {
        const model = withValues(2, { 0: 1, 1: 1 });

        const analysis = analyzeManualGroups(
            model,
            [
                { id: 1, minterms: [0, 1] },
                { id: 2, minterms: [0] },
            ],
            'SOP',
            solveKMap(model, 'SOP'),
        );

        expect(analysis.redundantGroupIds).toEqual([2]);
        expect(analysis.isComplete).toBe(true);
        expect(analysis.matchesSolverGroupCount).toBe(false);
    });
});
