export type AddressFormat = 'hexadecimal' | 'decimal';

export type ArrayLengthMode = 'fixed' | 'same-as-previous';

export type MemoryArrayDefinition = {
    name: string;
    baseAddress: number;
    length: number;
    elementSizeBytes: 4;
};
