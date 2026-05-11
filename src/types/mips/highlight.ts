import type { ControlSignalId } from './control';
import type { DatapathValueId } from './datapath';
import type { RegisterNumber } from './register';

export type DatapathStepValueHighlights = {
    inputs: DatapathValueId[];
    outputs: DatapathValueId[];
    controls: ControlSignalId[];
};

export type HighlightRole =
    | 'normal'
    | 'input'
    | 'output'
    | 'control'
    | 'modified';

export type DatapathHighlightState = {
    values: Partial<Record<DatapathValueId, HighlightRole>>;
    controls: Partial<Record<ControlSignalId, HighlightRole>>;
};

export type MachineStateHighlightState = {
    registers: Partial<Record<RegisterNumber, HighlightRole>>;
    memory: Partial<Record<number, HighlightRole>>;
    pc?: HighlightRole;
};
