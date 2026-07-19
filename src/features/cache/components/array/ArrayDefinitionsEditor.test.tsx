import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ArrayDefinitionDraft } from '../../arrayTraceDraft';
import ArrayDefinitionsEditor from './ArrayDefinitionsEditor';

describe('ArrayDefinitionsEditor', () => {
    it('shows the calculated address for an array placed after A', () => {
        const arrays: ArrayDefinitionDraft[] = [
            {
                name: 'A',
                addressMode: 'fixed',
                baseAddress: '100',
                lengthMode: 'fixed',
                length: '8',
            },
            {
                name: 'B',
                addressMode: 'after-previous',
                baseAddress: '200',
                lengthMode: 'fixed',
                length: '4',
            },
        ];

        const markup = renderToStaticMarkup(
            <ArrayDefinitionsEditor
                arrays={arrays}
                format="hexadecimal"
                onFormatChange={() => {}}
                onChange={() => {}}
            />,
        );

        expect(markup).toContain('1 / Memory layout');
        expect(markup).toContain('After A');
        expect(markup).toContain('0x00000120');
    });

    it('removes only the final array', () => {
        const arrays: ArrayDefinitionDraft[] = [
            {
                name: 'A',
                addressMode: 'fixed',
                baseAddress: '100',
                lengthMode: 'fixed',
                length: '8',
            },
            {
                name: 'B',
                addressMode: 'after-previous',
                baseAddress: '200',
                lengthMode: 'fixed',
                length: '8',
            },
            {
                name: 'C',
                addressMode: 'after-previous',
                baseAddress: '300',
                lengthMode: 'fixed',
                length: '8',
            },
        ];
        const onChange = vi.fn();
        const editor = ArrayDefinitionsEditor({
            arrays,
            format: 'hexadecimal',
            onFormatChange: () => {},
            onChange,
        });
        const header = editor.props.children[0];

        header.props.onRemove();

        expect(onChange).toHaveBeenCalledWith([arrays[0], arrays[1]]);
    });
});
