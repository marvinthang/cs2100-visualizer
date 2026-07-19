import { Children, isValidElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { simulateCache } from '../../../core/cache/simulator';
import type { CacheAccess, CacheConfig } from '../../../types/cache';
import CacheVisualization, { CacheStepNavigation } from './CacheVisualization';
import { scrollCacheSetIntoView } from '../visualizationModel';

const oneLineFourWordConfig: CacheConfig = {
    addressBits: 32,
    wordSizeBytes: 4,
    capacityBytes: 16,
    blockSizeBytes: 16,
    wayCount: 1,
};

function access(address: number, ordinal: number): CacheAccess {
    return { address, ordinal, operation: 'read' };
}

function renderStep(
    addresses: number[],
    stepIndex: number,
    instructionLayout: {
        baseAddress: number;
        instructionCount: number;
    } | null = null,
): string {
    const simulation = simulateCache(
        oneLineFourWordConfig,
        addresses.map(access),
    );
    const step = simulation.steps[stepIndex];
    const previousStep = simulation.steps[stepIndex - 1] ?? null;

    return renderToStaticMarkup(
        <CacheVisualization
            state={step.stateAfter}
            activeSetIndex={step.decomposedAddress.setIndex}
            activeWayIndex={step.wayIndex}
            currentWordIndex={step.decomposedAddress.blockOffset}
            previousBlockNumber={
                previousStep?.decomposedAddress.blockNumber ?? null
            }
            previousWordIndex={
                previousStep?.decomposedAddress.blockOffset ?? null
            }
            hit={step.hit}
            evictedLine={step.evictedLine}
            addressFormat="hexadecimal"
            stepIndex={stepIndex}
            stepCount={simulation.steps.length}
            arrayDefinitions={[]}
            instructionLayout={instructionLayout}
            onStepChange={() => {}}
        />,
    );
}

function renderInitialState(): string {
    const simulation = simulateCache(oneLineFourWordConfig, []);

    return renderToStaticMarkup(
        <CacheVisualization
            state={simulation.initialState}
            activeSetIndex={null}
            activeWayIndex={null}
            currentWordIndex={0}
            previousBlockNumber={null}
            previousWordIndex={null}
            hit={false}
            evictedLine={null}
            addressFormat="hexadecimal"
            stepIndex={0}
            stepCount={0}
            arrayDefinitions={[]}
            instructionLayout={null}
            onStepChange={() => {}}
        />,
    );
}

type NavigationButtonProps = {
    'aria-label': string;
    disabled: boolean;
    onClick: () => void;
};

function getNavigationButtons(
    stepIndex: number,
    stepCount: number,
    onStepChange: (step: number) => void,
): ReactElement<NavigationButtonProps>[] {
    const navigation = CacheStepNavigation({
        stepIndex,
        stepCount,
        onStepChange,
    });

    return Children.toArray(navigation.props.children).filter(
        (child): child is ReactElement<NavigationButtonProps> =>
            isValidElement<NavigationButtonProps>(child) &&
            child.type === 'button',
    );
}

function findButton(
    buttons: ReactElement<NavigationButtonProps>[],
    label: string,
) {
    const button = buttons.find(
        (candidate) => candidate.props['aria-label'] === label,
    );
    if (button === undefined) {
        throw new Error(`Missing navigation button: ${label}`);
    }
    return button;
}

describe('CacheVisualization word states', () => {
    it('exposes the cache grid as an accessible region', () => {
        const markup = renderStep([0x00], 0);

        expect(markup).toContain('role="region"');
        expect(markup).toContain(
            'aria-label="Cache with 1 sets and 1 ways. Set 0, way 0 is selected."',
        );
        expect(markup).not.toContain('role="img"');
    });

    it('describes an unchanged cache without limiting the message to data', () => {
        const markup = renderInitialState();

        expect(markup).toContain('No access changed the cache.');
        expect(markup).toContain(
            'aria-label="Empty cache with 1 sets and 1 ways."',
        );
    });

    it('shows previous and current on different words in the same block', () => {
        const markup = renderStep([0x00, 0x04], 1);

        expect(markup).toMatch(/data-word-index="0"[^>]*data-previous="true"/);
        expect(markup).toMatch(/data-word-index="1"[^>]*data-current="true"/);
        expect(markup).toContain('Prev');
        expect(markup).toContain('Current');
    });

    it('shows previous and current together for the exact same word', () => {
        const markup = renderStep([0x00, 0x00], 1);

        expect(markup).toMatch(
            /data-word-index="0"[^>]*data-current="true"[^>]*data-previous="true"/,
        );
        expect(markup).toContain('Prev');
        expect(markup).toContain('Current');
    });

    it('shows every evicted and loaded address inside its word box', () => {
        const markup = renderStep([0x00, 0x10], 1);

        expect(markup.match(/data-word-state="evicted"/g)).toHaveLength(4);
        expect(markup.match(/data-word-state="loaded"/g)).toHaveLength(4);

        for (let wordIndex = 0; wordIndex < 4; wordIndex++) {
            const oldAddress = (wordIndex * 4)
                .toString(16)
                .toUpperCase()
                .padStart(8, '0');
            const newAddress = (0x10 + wordIndex * 4)
                .toString(16)
                .toUpperCase()
                .padStart(8, '0');

            expect(markup).toContain(`0x${oldAddress}`);
            expect(markup).toContain(`0x${newAddress}`);
        }
    });

    it('labels every loaded instruction word as I1, I2, and so on', () => {
        const markup = renderStep([0x00400000], 0, {
            baseAddress: 0x00400000,
            instructionCount: 3,
        });

        expect(markup).toContain('I1');
        expect(markup).toContain('I2');
        expect(markup).toContain('I3');
        expect(markup).not.toContain('I4');
    });

    it('labels evicted and loaded instruction words in place', () => {
        const markup = renderStep([0x00400000, 0x00400010], 1, {
            baseAddress: 0x00400000,
            instructionCount: 8,
        });

        for (let instruction = 1; instruction <= 8; instruction++) {
            expect(markup).toContain(`I${instruction}`);
        }
    });
});

describe('CacheStepNavigation', () => {
    it('disables the correct controls at the first and last steps', () => {
        const onStepChange = vi.fn();
        const first = getNavigationButtons(0, 4, onStepChange);

        expect(
            findButton(first, 'Show first cache access').props.disabled,
        ).toBe(true);
        expect(
            findButton(first, 'Show previous cache access').props.disabled,
        ).toBe(true);
        expect(findButton(first, 'Show next cache access').props.disabled).toBe(
            false,
        );
        expect(findButton(first, 'Show last cache access').props.disabled).toBe(
            false,
        );

        const last = getNavigationButtons(3, 4, onStepChange);

        expect(findButton(last, 'Show first cache access').props.disabled).toBe(
            false,
        );
        expect(
            findButton(last, 'Show previous cache access').props.disabled,
        ).toBe(false);
        expect(findButton(last, 'Show next cache access').props.disabled).toBe(
            true,
        );
        expect(findButton(last, 'Show last cache access').props.disabled).toBe(
            true,
        );
    });

    it('moves First, Previous, Next, and Last to the expected steps', () => {
        const onStepChange = vi.fn();
        const buttons = getNavigationButtons(2, 5, onStepChange);

        findButton(buttons, 'Show first cache access').props.onClick();
        findButton(buttons, 'Show previous cache access').props.onClick();
        findButton(buttons, 'Show next cache access').props.onClick();
        findButton(buttons, 'Show last cache access').props.onClick();

        expect(onStepChange.mock.calls.map(([step]) => step)).toEqual([
            0, 1, 3, 4,
        ]);
    });
});

describe('scrollCacheSetIntoView', () => {
    it('uses nearest smooth scrolling and respects reduced motion', () => {
        const scrollIntoView = vi.fn();
        const element = { scrollIntoView };

        scrollCacheSetIntoView(element, false);
        scrollCacheSetIntoView(element, true);

        expect(scrollIntoView).toHaveBeenNthCalledWith(1, {
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
        expect(scrollIntoView).toHaveBeenNthCalledWith(2, {
            behavior: 'auto',
            block: 'nearest',
            inline: 'nearest',
        });
    });
});
