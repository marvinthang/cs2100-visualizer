import type { AddressTraceResult, CacheAccess } from '../../types/cache';
import type { AddressFormat } from '../../types/memory';
import { parseAddressToken } from '../memory/address';
import { validateCacheAddress } from './address';

export function parseAddressTrace(
    source: string,
    format: AddressFormat,
): AddressTraceResult {
    const tokens = source.split(/[\s,]+/).filter(Boolean);
    const accesses: CacheAccess[] = [];
    const errors: string[] = [];

    tokens.forEach((token, index) => {
        const address = parseAddressToken(token, format);

        if (address === null) {
            errors.push(
                `Item ${index + 1}: "${token}" is not a valid ${format} address.`,
            );
            return;
        }

        const validationError = validateCacheAddress(address, 32, 4);
        if (validationError !== null) {
            errors.push(
                `Item ${index + 1}: "${token}" is invalid: ${validationError}`,
            );
            return;
        }

        accesses.push({
            ordinal: accesses.length,
            address,
            operation: 'read',
        });
    });

    return { accesses, errors };
}
