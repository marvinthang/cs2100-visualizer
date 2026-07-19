import type { AddressFormat } from '../../types/memory';

export function parseAddressToken(
    token: string,
    format: AddressFormat,
): number | null {
    if (format === 'hexadecimal') {
        if (!/^(?:0x)?[0-9a-f]+$/i.test(token)) {
            return null;
        }

        return Number.parseInt(token.replace(/^0x/i, ''), 16);
    }

    if (!/^[0-9]+$/.test(token)) {
        return null;
    }

    return Number.parseInt(token, 10);
}
