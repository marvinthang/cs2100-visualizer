import type { DatapathStep } from '../../../../types/mips';

export const datapathSteps: DatapathStep[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];

export function getCurrentStep(stepIndex: number | null): DatapathStep | null {
    if (stepIndex === null) {
        return null;
    }
    return datapathSteps[stepIndex] ?? null;
}

export function getPreviousStepIndex(stepIndex: number | null): number {
    if (stepIndex === null) {
        return 0;
    }
    return Math.max(stepIndex - 1, 0);
}

export function getNextStepIndex(stepIndex: number | null): number {
    if (stepIndex === null) {
        return 0;
    }
    return Math.min(stepIndex + 1, datapathSteps.length - 1);
}

export function isLastStep(stepIndex: number | null): boolean {
    return stepIndex !== null && stepIndex >= datapathSteps.length - 1;
}
