import { describe, expect, it } from 'vitest';
import type { DatapathInstructionFields } from '../../../../types/mips';
import { getDatapathControlSignals } from '../control/datapathControl';
import { createEmptyExecutionContext } from '../execution/executionContext';
import { createInitialMachineState } from '../execution/machineState';
import { getDatapathInspectInfo } from './datapathInspectInfo';

describe('getDatapathInspectInfo', () => {
    it('shows sign-extended immediates as signed decimal values', () => {
        const instruction: DatapathInstructionFields = {
            mnemonic: 'addi',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: -1,
        };
        const context = {
            ...createEmptyExecutionContext(),
            instruction,
            immediate: -1,
        };

        const info = getDatapathInspectInfo(
            'SIGN_EXTEND',
            'ID',
            createInitialMachineState(),
            context,
            getDatapathControlSignals('addi'),
            'dec',
        );

        expect(info?.rows).toEqual(
            expect.arrayContaining([
                {
                    label: 'Input immediate',
                    value: '-1 (0xFFFF)',
                },
                {
                    label: 'Output',
                    value: '-1 (0xFFFFFFFF)',
                },
            ]),
        );
    });
});
