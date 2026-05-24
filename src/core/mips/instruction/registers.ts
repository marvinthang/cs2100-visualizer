import type { RegisterNumber } from '../../../types/mips';

// Standard MIPS register ABI names, indexed by register number 0–31.
export const registerNames = [
    '$zero',
    '$at',
    '$v0',
    '$v1',
    '$a0',
    '$a1',
    '$a2',
    '$a3',
    '$t0',
    '$t1',
    '$t2',
    '$t3',
    '$t4',
    '$t5',
    '$t6',
    '$t7',
    '$s0',
    '$s1',
    '$s2',
    '$s3',
    '$s4',
    '$s5',
    '$s6',
    '$s7',
    '$t8',
    '$t9',
    '$k0',
    '$k1',
    '$gp',
    '$sp',
    '$fp',
    '$ra',
] as const;

// Resolve a register operand to its number. Accepts an ABI name ($t0) or a
// numeric form ($8). Returns null if the token is not a valid register.
export function parseRegister(token: string): RegisterNumber | null {
    const aliasIndex = registerNames.indexOf(token as (typeof registerNames)[number]);
    if (aliasIndex !== -1) {
        return aliasIndex as RegisterNumber;
    }

    const numericMatch = /^\$(\d{1,2})$/.exec(token);
    if (numericMatch) {
        const num = Number(numericMatch[1]);
        if (num >= 0 && num <= 31) {
            return num as RegisterNumber;
        }
    }

    return null;
}
