export type RegisterValueFormat = 'hex' | 'dec' | 'bin';

export function formatRegisterValue(
    value: number,
    format: RegisterValueFormat,
): string {
    switch (format) {
        case 'hex':
            return `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
        case 'dec':
            return (value | 0).toString();
        case 'bin':
            return `0b${(value >>> 0).toString(2).padStart(32, '0')}`;
    }
}

export function parseRegisterValue(
    raw: string,
    format: RegisterValueFormat,
): number | null {
    const text = raw.trim();

    if (format === 'dec') {
        if (!/^-?\d+$/.test(text)) {
            return null;
        }

        const value = Number(text);

        if (!Number.isInteger(value)) {
            return null;
        }

        return value | 0;
    }

    if (format === 'hex') {
        const digits = text.replace(/^0x/i, '');

        if (!/^[0-9a-fA-F]{1,8}$/.test(digits)) {
            return null;
        }

        return Number.parseInt(digits, 16) | 0;
    }

    const digits = text.replace(/^0b/i, '');

    if (!/^[01]{1,32}$/.test(digits)) {
        return null;
    }

    return Number.parseInt(digits, 2) | 0;
}
