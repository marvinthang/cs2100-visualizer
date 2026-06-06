import { describe, expect, it } from 'vitest';
import {
    canCreateKMapGroup,
    createKMapModel,
    updateKMapCell,
} from './kmapModel';

function withOnes(minterms: number[]) {
    return minterms.reduce(
        (model, minterm) => updateKMapCell(model, minterm, 1),
        createKMapModel(4),
    );
}

describe('canCreateKMapGroup', () => {
    it('accepts rectangular groups', () => {
        const model = withOnes([0, 1, 4, 5]);

        expect(canCreateKMapGroup(model, [0, 1, 4, 5])).toBe(true);
    });

    it('accepts wrapped rectangular groups', () => {
        const model = withOnes([0, 2, 8, 10]);

        expect(canCreateKMapGroup(model, [0, 2, 8, 10])).toBe(true);
    });

    it('rejects non-rectangular power-of-two selections', () => {
        const model = withOnes([0, 1, 2, 5]);

        expect(canCreateKMapGroup(model, [0, 1, 2, 5])).toBe(false);
    });

    it('rejects groups that include 0-valued cells', () => {
        const model = withOnes([0, 1, 4]);

        expect(canCreateKMapGroup(model, [0, 1, 4, 5])).toBe(false);
    });
});
