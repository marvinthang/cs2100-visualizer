import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { analyzeCacheSimulation } from '../../../core/cache/analysis';
import type { CacheAccess, CacheConfig } from '../../../types/cache';
import type { MemoryArrayDefinition } from '../../../types/memory';
import TraceResultsTable from './TraceResultsTable';

const config: CacheConfig = {
    addressBits: 32,
    wordSizeBytes: 4,
    capacityBytes: 16,
    blockSizeBytes: 16,
    wayCount: 1,
};

const arrays: MemoryArrayDefinition[] = [
    {
        name: 'A',
        baseAddress: 0x100,
        length: 4,
        elementSizeBytes: 4,
    },
    {
        name: 'B',
        baseAddress: 0x200,
        length: 4,
        elementSizeBytes: 4,
    },
    {
        name: 'C',
        baseAddress: 0x300,
        length: 4,
        elementSizeBytes: 4,
    },
];

function renderTable(accesses: CacheAccess[], selectedStepIndex = 0) {
    return renderToStaticMarkup(
        <TraceResultsTable
            analysis={analyzeCacheSimulation(config, accesses)}
            format="hexadecimal"
            arrayDefinitions={arrays}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={() => {}}
        />,
    );
}

describe('TraceResultsTable', () => {
    it('describes the rows as a cache-access trace', () => {
        const markup = renderTable([
            { ordinal: 0, operation: 'read', address: 0x100 },
        ]);

        expect(markup).toContain('Dynamic cache-access trace');
    });

    it('places source beside the hit or miss verdict', () => {
        const markup = renderTable([
            { ordinal: 0, operation: 'read', address: 0x100 },
        ]);
        const wordHeading = markup.indexOf('>Word</th>');
        const sourceHeading = markup.indexOf('>Source</th>');
        const verdictHeading = markup.indexOf('>Verdict</th>');

        expect(wordHeading).toBeGreaterThan(-1);
        expect(sourceHeading).toBeGreaterThan(wordHeading);
        expect(verdictHeading).toBeGreaterThan(sourceHeading);
    });

    it('shows an instruction line number instead of its read operation', () => {
        const markup = renderTable([
            {
                ordinal: 0,
                operation: 'read',
                address: 0x100,
                label: 'addi $t0, $zero, 1',
                sourceLine: 7,
            },
        ]);
        const source = markup.indexOf('addi $t0, $zero, 1');
        const line = markup.indexOf('Line 7');
        const verdict = markup.indexOf('>Miss</span>');

        expect(source).toBeGreaterThan(-1);
        expect(line).toBeGreaterThan(source);
        expect(verdict).toBeGreaterThan(line);
        expect(markup).toContain('>Line</th>');
        expect(markup).not.toContain('>read</span>');
    });

    it('shows the array element label alongside a MIPS source label', () => {
        const markup = renderTable([
            {
                ordinal: 0,
                operation: 'read',
                address: 0x104,
                label: 'lw $t0, 4($s0)',
            },
        ]);

        expect(markup).toContain('lw $t0, 4($s0)');
        expect(markup).toContain('A[1]');
    });

    it('does not duplicate an existing array access label', () => {
        const markup = renderTable([
            {
                ordinal: 0,
                operation: 'read',
                address: 0x108,
                label: 'A[2]',
            },
        ]);

        expect(markup.match(/A\[2\]/g)).toHaveLength(1);
    });

    it('uses a distinct stable color for each array', () => {
        const markup = renderTable([
            { ordinal: 0, operation: 'read', address: 0x100 },
            { ordinal: 1, operation: 'read', address: 0x200 },
            { ordinal: 2, operation: 'read', address: 0x300 },
        ]);

        expect(markup).toContain(
            'data-array-index="0" class="inline-flex rounded px-2 py-1 font-mono text-[10px] font-semibold ring-1 bg-cyan-50',
        );
        expect(markup).toContain(
            'data-array-index="1" class="inline-flex rounded px-2 py-1 font-mono text-[10px] font-semibold ring-1 bg-violet-50',
        );
        expect(markup).toContain(
            'data-array-index="2" class="inline-flex rounded px-2 py-1 font-mono text-[10px] font-semibold ring-1 bg-amber-50',
        );
    });

    it('renders a selected window with actual step numbers for a long trace', () => {
        const accesses = Array.from({ length: 300 }, (_, index) => ({
            ordinal: index,
            operation: 'read' as const,
            address: index * 4,
            label: `access-${index + 1}`,
        }));
        const markup = renderTable(accesses, 150);

        expect(markup).toContain('Showing 51–251 of 300 accesses');
        expect(markup).toContain('access-51');
        expect(markup).toContain('access-151');
        expect(markup).toContain('access-251');
        expect(markup).not.toContain('access-50<');
        expect(markup).not.toContain('access-252<');
        expect(markup).toContain('aria-selected="true"');
    });

    it('uses complete windows at the first and last trace boundaries', () => {
        const accesses = Array.from({ length: 1_000 }, (_, index) => ({
            ordinal: index,
            operation: 'read' as const,
            address: index * 4,
            label: `access-${index + 1}`,
        }));

        const firstWindow = renderTable(accesses, 0);
        expect(firstWindow).toContain('Showing 1–201 of 1000 accesses');
        expect(firstWindow).toContain('access-1');
        expect(firstWindow).toContain('access-201');
        expect(firstWindow).not.toContain('access-202<');

        const lastWindow = renderTable(accesses, 999);
        expect(lastWindow).toContain('Showing 800–1000 of 1000 accesses');
        expect(lastWindow).toContain('access-800');
        expect(lastWindow).toContain('access-1000');
        expect(lastWindow).not.toContain('access-799<');
    });

    it('does not show a range notice when every access is visible', () => {
        const markup = renderTable([
            { ordinal: 0, operation: 'read', address: 0x100 },
            { ordinal: 1, operation: 'read', address: 0x104 },
        ]);

        expect(markup).not.toContain('Showing ');
    });
});
