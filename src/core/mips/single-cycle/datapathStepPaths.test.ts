import { describe, expect, it } from 'vitest';
import { datapathInstructionExamples } from '../instruction/datapathInstructionExamples';
import { getDatapathControlSignals } from './control/datapathControl';
import type { RuntimeControlSignals } from './control/types';
import { getDatapathStepPaths } from './diagram/datapathStepPaths';
import type { ExecutionContext } from './execution/executionContext';
import { createEmptyExecutionContext } from './execution/executionContext';

function signals(
    mnemonic: keyof typeof datapathInstructionExamples,
    overrides: Record<string, unknown> = {},
): RuntimeControlSignals {
    return {
        ...getDatapathControlSignals(mnemonic),
        ...overrides,
    } as RuntimeControlSignals;
}

describe('getDatapathStepPaths', () => {
    it('add in EX highlights ALU-related paths', () => {
        const paths = getDatapathStepPaths(
            'EX',
            datapathInstructionExamples.add,
            signals('add'),
            createEmptyExecutionContext(),
        );

        expect(paths).toEqual(
            expect.arrayContaining([
                'RF_RD1_TO_ALU1',
                'RF_RD2_TO_ALUSRC_MUX0',
                'ALUSRC_MUX_TO_ALU2',
            ]),
        );
    });

    it('lw in MEM highlights the data memory address path', () => {
        const paths = getDatapathStepPaths(
            'MEM',
            datapathInstructionExamples.lw,
            signals('lw'),
            createEmptyExecutionContext(),
        );

        // Current MEM-stage path logic exposes the address path. The read-data
        // path is visualized later through MemToReg during WB.
        expect(paths).toContain('ALU_TO_DM_ADDR');
    });

    it('sw in MEM highlights the data memory write path', () => {
        const paths = getDatapathStepPaths(
            'MEM',
            datapathInstructionExamples.sw,
            signals('sw'),
            createEmptyExecutionContext(),
        );

        expect(paths).toEqual(
            expect.arrayContaining(['ALU_TO_DM_ADDR', 'RF_RD2_TO_DM_WD']),
        );
    });

    it('RegWrite = 0 with an X write-back source produces no write-back path', () => {
        const paths = getDatapathStepPaths(
            'WB',
            datapathInstructionExamples.sw,
            signals('sw'),
            createEmptyExecutionContext(),
        );

        expect(paths).toEqual([]);
    });

    it('changing ALUSrc changes the selected ALU input path', () => {
        const registerInputPaths = getDatapathStepPaths(
            'EX',
            datapathInstructionExamples.add,
            signals('add', { ALUSrc: 0 }),
            createEmptyExecutionContext(),
        );
        const immediateInputPaths = getDatapathStepPaths(
            'EX',
            datapathInstructionExamples.addi,
            signals('addi', { ALUSrc: 1 }),
            createEmptyExecutionContext(),
        );

        expect(registerInputPaths).toContain('RF_RD2_TO_ALUSRC_MUX0');
        expect(registerInputPaths).not.toContain('SIGN_EXTEND_TO_ALUSRC_MUX1');
        expect(immediateInputPaths).toContain('SIGN_EXTEND_TO_ALUSRC_MUX1');
        expect(immediateInputPaths).not.toContain('RF_RD2_TO_ALUSRC_MUX0');
    });

    it('uses PCSrc context to select the branch or sequential PC path in MEM', () => {
        const takenContext: ExecutionContext = {
            ...createEmptyExecutionContext(),
            branchTaken: true,
        };
        const notTakenContext: ExecutionContext = {
            ...createEmptyExecutionContext(),
            branchTaken: false,
        };

        expect(
            getDatapathStepPaths(
                'MEM',
                datapathInstructionExamples.beq,
                signals('beq'),
                takenContext,
            ),
        ).toContain('BRANCH_ADDER_TO_PCSRC_MUX1');
        expect(
            getDatapathStepPaths(
                'MEM',
                datapathInstructionExamples.beq,
                signals('beq'),
                notTakenContext,
            ),
        ).toContain('ADD4_TO_PCSRC_MUX0');
    });
});
