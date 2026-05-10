import type {
    ControlSignals,
    DatapathStage,
} from '../../types/mips';
import datapathStepValueHighlights from './datapathStepValueHighlights';
import type { HighlightRole, DatapathHighlightState } from '../../types/mips';
import type { ExecutionContext } from './executionContext';

export default function datapathHighlightState(
    stage: DatapathStage | null,
    signals: ControlSignals,
    defaultSignals: ControlSignals,
    context: ExecutionContext,
): DatapathHighlightState {
    const state: DatapathHighlightState = {
        values: {},
        controls: {},
    };

    const step = datapathStepValueHighlights(stage, signals, context);

    for (const id of step.inputs) {
        state.values[id] = 'input';
    }

    for (const id of step.outputs) {
        state.values[id] = 'output';
    }

    for (const signal of step.controls) {
        if (signal === 'PCSrc') {
            state.controls[signal] = 'control';
        } else {
            const name = signal as keyof ControlSignals;
            state.controls[signal] = signals[name] === defaultSignals[name] ? 'control' : 'modified';
        }
    }

    return state;
}

export function getHighlightSvgFill(role: HighlightRole, normalColor = 'black'): string {
    if (role === 'input') {
        return '#2563eb';
    }

    if (role === 'output') {
        return '#16a34a';
    }

    if (role === 'control') {
        return '#FF0000';
    }

    if (role === 'modified') {
        return '#dab00b';
    }

    return normalColor;
}

export function getHighlightTextClass(role: HighlightRole): string {
    if (role === 'input') {
        return 'text-blue-600';
    }

    if (role === 'output') {
        return 'text-green-600';
    }

    if (role === 'control' || role === 'modified') {
        return 'text-yellow-600';
    }

    return 'text-slate-900';
}

export function getHighlightBackgroundClass(role: HighlightRole): string {
    if (role === 'input') {
        return 'bg-blue-50';
    }

    if (role === 'output') {
        return 'bg-green-50';
    }

    if (role === 'control') {
        return 'bg-red-50';
    }

    if (role === 'modified') {
        return 'bg-yellow-50';
    }

    return '';
}