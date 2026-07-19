import { describe, expect, it } from 'vitest';
import { parseAddressToken } from './address';

describe('parseAddressToken', () => {
    it('parses hexadecimal tokens with or without a prefix', () => {
        expect(parseAddressToken('100', 'hexadecimal')).toBe(0x100);
        expect(parseAddressToken('0x100', 'hexadecimal')).toBe(0x100);
        expect(parseAddressToken('0xABCD', 'hexadecimal')).toBe(0xabcd);
    });

    it('parses decimal tokens without guessing another base', () => {
        expect(parseAddressToken('100', 'decimal')).toBe(100);
    });

    it('rejects hexadecimal syntax in decimal mode', () => {
        expect(parseAddressToken('0x100', 'decimal')).toBeNull();
    });

    it('rejects invalid or empty tokens', () => {
        expect(parseAddressToken('2G', 'hexadecimal')).toBeNull();
        expect(parseAddressToken('-4', 'decimal')).toBeNull();
        expect(parseAddressToken('', 'hexadecimal')).toBeNull();
    });
});
