import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TraceSourceSwitch from './TraceSourceSwitch';

describe('TraceSourceSwitch', () => {
    it('renders all trace sources as one accessible radio group', () => {
        const markup = renderToStaticMarkup(
            <TraceSourceSwitch value="array" onChange={() => {}} />,
        );

        expect(markup).toContain('<fieldset');
        expect(markup).toContain(
            '<legend class="sr-only">Trace source</legend>',
        );
        expect(markup.match(/type="radio"/g)).toHaveLength(3);
        expect(markup).toContain('Manual addresses');
        expect(markup).toContain('Array pattern');
        expect(markup).toContain('MIPS program');
        expect(markup).toMatch(
            /<input[^>]*type="radio"[^>]*checked=""[^>]*value="array"/,
        );
    });
});
