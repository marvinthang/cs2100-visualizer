import type { CacheConfig } from '../../types/cache';
import type { AddressFormat } from '../../types/memory';

export function formatAddress(address: number, format: AddressFormat): string {
    if (format === 'decimal') {
        return String(address);
    }

    return `0x${address.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function formatHex(value: number | null): string {
    return value === null ? '—' : `0x${value.toString(16).toUpperCase()}`;
}

export function describeOrganization(config: CacheConfig): string {
    const lineCount = config.capacityBytes / config.blockSizeBytes;

    if (config.wayCount === 1) {
        return 'Direct mapped';
    }

    if (config.wayCount === lineCount) {
        return 'Fully associative';
    }

    return `${config.wayCount}-way set associative`;
}
