import { describe, expect, it } from 'vitest';
import { parseArrayTraceDraft, type ArrayTraceDraft } from './arrayTraceDraft';

function draft(): ArrayTraceDraft {
    return {
        format: 'hexadecimal',
        arrays: [
            {
                name: 'A',
                addressMode: 'fixed',
                baseAddress: '100',
                lengthMode: 'fixed',
                length: '8',
            },
        ],
        patterns: [{ arrayName: 'A', multiplier: '1', offset: '0' }],
        loop: { startIndex: '0', endExclusiveIndex: '4', stride: '1' },
    };
}

describe('array trace draft parsing', () => {
    it('parses a complete draft', () => {
        expect(parseArrayTraceDraft(draft())).toEqual({
            definitions: [
                {
                    name: 'A',
                    baseAddress: 0x100,
                    length: 8,
                    elementSizeBytes: 4,
                },
            ],
            patterns: [{ arrayName: 'A', multiplier: 1, offset: 0 }],
            loop: { startIndex: 0, endExclusiveIndex: 4, stride: 1 },
            errors: [],
        });
    });

    it('accepts signed multipliers and offsets', () => {
        const value = draft();
        value.patterns[0] = {
            arrayName: 'A',
            multiplier: '-2',
            offset: '+3',
        };

        const parsed = parseArrayTraceDraft(value);

        expect(parsed.errors).toEqual([]);
        expect(parsed.patterns).toEqual([
            { arrayName: 'A', multiplier: -2, offset: 3 },
        ]);
    });

    it('returns field-specific errors for an incomplete draft', () => {
        const value = draft();
        value.arrays[0].baseAddress = 'not hex';
        value.patterns[0].offset = '1.5';
        value.loop.stride = '';

        const parsed = parseArrayTraceDraft(value);

        expect(parsed.loop).toBeNull();
        expect(parsed.errors).toEqual([
            'Array A: enter a valid hexadecimal base address.',
            'Pattern for array A: enter a valid offset.',
            'Loop: enter a valid stride.',
        ]);
    });
});
