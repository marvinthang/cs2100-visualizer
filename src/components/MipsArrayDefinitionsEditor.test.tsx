import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
    setMipsArrayAddressFormat,
    setMipsArrayLengthMode,
} from '../core/mips/arrayDefinitionDraft';
import type { MipsArrayDefinitionDraft } from '../types/mips';
import MipsArrayDefinitionsEditor from './MipsArrayDefinitionsEditor';

const definitions: MipsArrayDefinitionDraft[] = [
    {
        name: 'A',
        addressMode: 'fixed',
        baseAddress: '100',
        lengthMode: 'fixed',
        length: '8',
        addressFormat: 'hexadecimal',
        baseAddressRegister: 16,
        lengthRegister: 17,
        valuePattern: '1 2',
    },
    {
        name: 'B',
        addressMode: 'after-previous',
        baseAddress: '120',
        lengthMode: 'fixed',
        length: '8',
        addressFormat: 'hexadecimal',
        baseAddressRegister: 18,
        lengthRegister: 19,
        valuePattern: '',
    },
    {
        name: 'C',
        addressMode: 'after-previous',
        baseAddress: '140',
        lengthMode: 'fixed',
        length: '8',
        addressFormat: 'hexadecimal',
        baseAddressRegister: 20,
        lengthRegister: 21,
        valuePattern: '',
    },
];

describe('MipsArrayDefinitionsEditor', () => {
    it('renders one address-format selector for all arrays', () => {
        const markup = renderToStaticMarkup(
            <MipsArrayDefinitionsEditor
                definitions={definitions}
                onChange={() => {}}
            />,
        );

        expect(markup).toContain('Array memory layout');
        expect(markup).not.toContain('1 / Memory layout');
        expect(markup.match(/>HEX</g)).toHaveLength(1);
        expect(markup.match(/>DEC</g)).toHaveLength(1);
        expect(markup).toContain('Same as A');
        expect(markup).toContain('Same as B');
        expect(markup).not.toContain('>Own<');
    });

    it('changes the address format of every array together', () => {
        expect(setMipsArrayAddressFormat(definitions, 'decimal')).toEqual(
            definitions.map((definition) => ({
                ...definition,
                addressFormat: 'decimal',
            })),
        );
    });

    it('shows one remove-last control instead of per-array removal', () => {
        const markup = renderToStaticMarkup(
            <MipsArrayDefinitionsEditor
                definitions={definitions}
                onChange={() => {}}
            />,
        );

        expect(markup.match(/Remove last/g)).toHaveLength(1);
        expect(markup).not.toContain('aria-label="Remove array');
    });

    it('shows a repeating-value field for every array', () => {
        const markup = renderToStaticMarkup(
            <MipsArrayDefinitionsEditor
                definitions={definitions}
                onChange={() => {}}
            />,
        );

        expect(markup.match(/repeating values"/g)).toHaveLength(3);
        expect(markup).toContain('value="1 2"');
    });

    it('copies the previous array length and register', () => {
        const updated = setMipsArrayLengthMode(
            [
                { ...definitions[0], length: '12', lengthRegister: 4 },
                { ...definitions[1], length: '5', lengthRegister: 19 },
                { ...definitions[2], length: '3', lengthRegister: 21 },
            ],
            2,
            'same-as-previous',
        );

        expect(updated[2]).toMatchObject({
            lengthMode: 'same-as-previous',
            length: '5',
            lengthRegister: 19,
        });

        updated[2].lengthRegister = 20;
        expect(updated[2].lengthMode).toBe('same-as-previous');
        expect(updated[2].lengthRegister).toBe(20);
    });
});
