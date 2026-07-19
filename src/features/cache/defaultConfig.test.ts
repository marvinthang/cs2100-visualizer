import { describe, expect, it } from 'vitest';
import { buildMipsCacheTrace } from '../../core/cache/mipsTrace';
import { prepareMipsArrays } from '../../core/mips/execution/prepareMipsArrays';
import {
    createInitialMachineState,
    readRegister,
} from '../../core/mips/single-cycle/execution/machineState';
import { DEFAULT_CACHE_ARRAYS, DEFAULT_CACHE_PROGRAM } from './defaultConfig';

describe('default cache configuration', () => {
    it('initializes A and B and completes the full cache trace', () => {
        const prepared = prepareMipsArrays(
            createInitialMachineState(),
            DEFAULT_CACHE_ARRAYS,
        );

        expect(prepared.errors).toEqual([]);
        expect(prepared.definitions).toEqual([
            {
                name: 'A',
                baseAddress: 0x80082108,
                length: 1026,
                elementSizeBytes: 4,
            },
            {
                name: 'B',
                baseAddress: 0x80083110,
                length: 1026,
                elementSizeBytes: 4,
            },
        ]);
        expect(readRegister(prepared.machine, 4)).toBe(1026);
        expect(readRegister(prepared.machine, 5) >>> 0).toBe(0x80082108);
        expect(readRegister(prepared.machine, 6) >>> 0).toBe(0x80083110);

        const trace = buildMipsCacheTrace(
            DEFAULT_CACHE_PROGRAM,
            prepared.machine,
        );

        expect(trace.errors).toEqual([]);
        expect(trace.truncated).toBe(false);
        expect(trace.dataAccesses).toHaveLength(2052);
        expect(
            trace.dataAccesses.slice(0, 2).map(({ address }) => address),
        ).toEqual([0x80082108, 0x80083110]);
        expect(
            trace.dataAccesses.slice(-2).map(({ address }) => address),
        ).toEqual([0x8008310c, 0x80084114]);
    });
});
