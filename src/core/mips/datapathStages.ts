import type { DatapathStage } from '../../types/mips';

export const datapathStages: DatapathStage[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];

export function getCurrentStage(stepIndex: number | null): DatapathStage | null {
    if (stepIndex === null) {
        return null;
    }
    return datapathStages[stepIndex] ?? null;
}

export function getPreviousStageIndex(stepIndex: number | null): number {
    if (stepIndex === null) {
        return 0;
    }
    return Math.max(stepIndex - 1, 0);
}

export function getNextStageIndex(stepIndex: number | null): number {
    if (stepIndex === null) {
        return 0;
    }
    return Math.min(stepIndex + 1, datapathStages.length - 1);
}

export function isLastStage(stepIndex: number | null): boolean {
    return stepIndex !== null && stepIndex >= datapathStages.length - 1;
}