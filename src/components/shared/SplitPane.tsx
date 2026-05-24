import { Fragment, useRef, useState, type ReactNode } from 'react';

// Horizontal split layout with draggable dividers between panels. Panel widths
// are stored as flex-grow weights, so they stay proportional to the container.
// Dragging a divider shifts weight between the two panels it sits between.
export default function SplitPane({
    children,
    initialSizes,
    minSize = 140,
}: {
    children: ReactNode[];
    initialSizes: number[];
    minSize?: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [sizes, setSizes] = useState(initialSizes);

    function handleDragStart(index: number, event: React.MouseEvent) {
        event.preventDefault();
        const container = containerRef.current;
        if (container === null) {
            return;
        }

        const startX = event.clientX;
        const startSizes = [...sizes];
        const containerWidth = container.getBoundingClientRect().width;
        const totalWeight = startSizes.reduce((sum, size) => sum + size, 0);
        const minWeight = (minSize / containerWidth) * totalWeight;

        function handleMove(moveEvent: MouseEvent) {
            const deltaWeight =
                ((moveEvent.clientX - startX) / containerWidth) * totalWeight;
            const left = startSizes[index] + deltaWeight;
            const right = startSizes[index + 1] - deltaWeight;
            if (left < minWeight || right < minWeight) {
                return;
            }

            const nextSizes = [...startSizes];
            nextSizes[index] = left;
            nextSizes[index + 1] = right;
            setSizes(nextSizes);
        }

        function handleUp() {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        }

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    }

    return (
        <div ref={containerRef} className="flex w-full items-stretch">
            {children.map((child, index) => (
                <Fragment key={index}>
                    <div
                        className="min-w-0"
                        style={{ flexGrow: sizes[index], flexBasis: 0 }}
                    >
                        {child}
                    </div>

                    {index < children.length - 1 && (
                        <div
                            onMouseDown={(event) =>
                                handleDragStart(index, event)
                            }
                            className="mx-1 w-1.5 shrink-0 cursor-col-resize rounded bg-slate-200 hover:bg-slate-400"
                        />
                    )}
                </Fragment>
            ))}
        </div>
    );
}
