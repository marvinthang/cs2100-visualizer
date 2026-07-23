import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MipsCacheAccessMode } from '../../../core/cache/mipsTrace';
import MipsTraceInputPanel from './MipsTraceInputPanel';

function renderPanel(accessMode: MipsCacheAccessMode): string {
    return renderToStaticMarkup(
        <MipsTraceInputPanel
            program="addi $t0, $zero, 1"
            traceTruncated={false}
            arrayDefinitions={[]}
            accessMode={accessMode}
            instructionBaseAddress="0x00400000"
            instructionAddressFormat="hexadecimal"
            onProgramChange={() => {}}
            onArrayDefinitionsChange={() => {}}
            onAccessModeChange={() => {}}
            onInstructionBaseAddressChange={() => {}}
            onInstructionAddressFormatChange={() => {}}
            onRun={() => {}}
        />,
    );
}

describe('MipsTraceInputPanel', () => {
    it('shows the first instruction address in instruction mode', () => {
        const markup = renderPanel('instruction');

        expect(markup).toContain('First instruction address');
        expect(markup).toContain('value="0x00400000"');
        expect(markup).toContain('Number base');
    });

    it('hides the instruction address for data-cache modes', () => {
        expect(renderPanel('read-only')).not.toContain(
            'First instruction address',
        );
        expect(renderPanel('read-write')).not.toContain(
            'First instruction address',
        );
    });
});
