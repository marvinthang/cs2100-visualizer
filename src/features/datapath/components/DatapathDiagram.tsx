import type {
    ControlSignalId,
    RuntimeControlSignals,
} from '../../../core/mips/single-cycle/control/types';
import type {
    DatapathSegment,
    DatapathValueId,
} from '../../../core/mips/single-cycle/diagram/types';
import type { DatapathHighlightState } from '../../../core/mips/single-cycle/highlight/types';
import type { DatapathInspectID } from '../../../core/mips/single-cycle/inspector/types';
import type { EncodedInstruction } from '../../../core/mips/instruction/encodeMipsInstruction';
import StaticDatapathSvg from './StaticDatapathSvg';
import { getHighlightSvgFill } from '../../../core/mips/single-cycle/highlight/datapathHighlightState';

export default function DatapathDiagram({
    bits,
    defaultActiveSegments,
    currentActiveSegments,
    modifiedActiveSegments,
    defaultSignals,
    signals,
    datapathHighlight,
    selectedInspectId,
    onInspect,
}: {
    bits: EncodedInstruction;
    defaultActiveSegments: readonly DatapathSegment[];
    currentActiveSegments: readonly DatapathSegment[];
    modifiedActiveSegments: readonly DatapathSegment[];
    defaultSignals: RuntimeControlSignals;
    signals: RuntimeControlSignals;
    datapathHighlight: DatapathHighlightState;
    selectedInspectId: DatapathInspectID | null;
    onInspect: (id: DatapathInspectID | null) => void;
}) {
    const isModified = (id: DatapathSegment) =>
        modifiedActiveSegments.includes(id);
    const isDefault = (id: DatapathSegment) =>
        defaultActiveSegments.includes(id) && !isModified(id);
    const isCurrent = (id: DatapathSegment) =>
        currentActiveSegments.includes(id);

    const wireStroke = (id: DatapathSegment) =>
        isCurrent(id)
            ? isDefault(id)
                ? '#FF0000'
                : '#facc15'
            : 'var(--dp-ink)';
    const wireStrokeWidth = (id: DatapathSegment) =>
        isCurrent(id) ? 2.3 : 1.5;
    const wireFill = (id: DatapathSegment) =>
        isCurrent(id)
            ? isDefault(id)
                ? '#FF0000'
                : '#facc15'
            : 'var(--dp-ink)';
    const wireArrow = (id: DatapathSegment) =>
        isCurrent(id)
            ? isDefault(id)
                ? 'url(#arrow-red)'
                : 'url(#arrow-yellow)'
            : 'url(#arrow-black)';
    const signalFill = (signal: ControlSignalId) =>
        signals[signal] === defaultSignals[signal]
            ? 'var(--dp-blue)'
            : '#ea580c';
    const muxFill = (signal: ControlSignalId) =>
        getHighlightSvgFill(datapathHighlight.controls[signal] ?? 'normal');
    const valueFill = (id: DatapathValueId) =>
        getHighlightSvgFill(datapathHighlight.values[id] ?? 'normal');

    return (
        <StaticDatapathSvg
            bits={bits}
            signals={signals}
            wireStroke={wireStroke}
            wireStrokeWidth={wireStrokeWidth}
            wireFill={wireFill}
            wireArrow={wireArrow}
            signalFill={signalFill}
            muxFill={muxFill}
            valueFill={valueFill}
            selectedInspectId={selectedInspectId}
            onInspect={onInspect}
        />
    );
}
