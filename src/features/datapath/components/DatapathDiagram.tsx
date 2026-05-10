import type { ControlSignals, DatapathSegment } from '../../../types/mips';
import StaticDatapathSvg from './StaticDatapathSvg';

export default function DatapathDiagram({
    defaultActiveSegments,
    currentActiveSegments,
    modifiedActiveSegments,
    defaultSignals,
    signals,
}: {
    defaultActiveSegments: readonly DatapathSegment[];
    currentActiveSegments: readonly DatapathSegment[];
    modifiedActiveSegments: readonly DatapathSegment[];
    defaultSignals: ControlSignals;
    signals: ControlSignals;
}) {
    const isModified = (id: DatapathSegment) => modifiedActiveSegments.includes(id);
    const isDefault = (id: DatapathSegment) => defaultActiveSegments.includes(id) && !isModified(id);
    const isCurrent = (id: DatapathSegment) => currentActiveSegments.includes(id);

    const wireStroke = (id: DatapathSegment) => isCurrent(id) ? isDefault(id) ? '#FF0000' : '#facc15' : 'black';
    const wireStrokeWidth = (id: DatapathSegment) => isCurrent(id) ? 2.3 : 1.5;
    const wireFill = (id: DatapathSegment) => isCurrent(id) ? isDefault(id) ? '#FF0000' : '#facc15' : 'black';
    const wireArrow = (id: DatapathSegment) => isCurrent(id) ? isDefault(id) ? 'url(#arrow-red)' : 'url(#arrow-yellow)' : 'url(#arrow-black)';
    const signalFill = (signal: keyof ControlSignals) => signals[signal] === defaultSignals[signal] ? '#2C1AF4' : '#ea580c';

    return <StaticDatapathSvg 
        signals={signals}
        wireStroke={wireStroke}
        wireStrokeWidth={wireStrokeWidth}
        wireFill={wireFill}
        wireArrow={wireArrow}
        signalFill={signalFill}
    />;
}
