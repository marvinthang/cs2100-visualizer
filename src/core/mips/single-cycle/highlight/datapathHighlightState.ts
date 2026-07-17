import type { ControlSignalId, RuntimeControlSignals } from '../control/types';
import type { DatapathStep } from '../../../../types/mips';
import { getDatapathStepValueHighlights } from './datapathStepValueHighlights';
import type { HighlightRole, DatapathHighlightState } from './types';
import type { ExecutionContext } from '../execution/executionContext';

export function getDatapathHighlightState(
    step: DatapathStep | null,
    signals: RuntimeControlSignals,
    defaultSignals: RuntimeControlSignals,
    context: ExecutionContext,
): DatapathHighlightState {
    const state: DatapathHighlightState = {
        values: {},
        controls: {},
    };

    const stepHighlights = getDatapathStepValueHighlights(
        step,
        signals,
        context,
    );

    for (const id of stepHighlights.inputs) {
        state.values[id] = 'input';
    }

    for (const id of stepHighlights.outputs) {
        state.values[id] = 'output';
    }

    for (const signal of stepHighlights.controls) {
        const name = signal as ControlSignalId;
        state.controls[signal] =
            signals[name] === defaultSignals[name] ? 'control' : 'modified';
    }

    return state;
}

export function getHighlightSvgFill(
    role: HighlightRole,
    normalColor = 'var(--dp-ink)',
): string {
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

export function getHighlightTextClass(
    role: HighlightRole,
    normalText = 'text-slate-900 dark:text-slate-100',
): string {
    if (role === 'input') {
        return 'text-blue-600 dark:text-blue-400';
    }

    if (role === 'output') {
        return 'text-green-600 dark:text-green-400';
    }

    if (role === 'control' || role === 'modified') {
        return 'text-yellow-600 dark:text-yellow-400';
    }

    return normalText;
}

export function getHighlightBackgroundClass(
    role: HighlightRole,
    normalBg = '',
): string {
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

    return normalBg;
}
