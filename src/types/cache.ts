export type CacheConfig = {
    addressBits: 32;
    wordSizeBytes: 4;
    capacityBytes: number;
    blockSizeBytes: number;
    wayCount: number;
};

export type CacheAccess = {
    ordinal: number;
    operation: 'read' | 'write';
    address: number;
    label?: string;
    sourceLine?: number;
};

export type CacheLine = {
    valid: boolean;
    tag: number | null;
    blockNumber: number | null;
    lastAccessedAtStep: number | null;
};

export type CacheSet = {
    ways: CacheLine[];
};

export type CacheState = {
    config: CacheConfig;
    sets: CacheSet[];
};

export type CacheLayout = {
    lineCount: number;
    setCount: number;
    wordCountPerBlock: number;

    byteOffsetBits: number;
    blockOffsetBits: number;
    setIndexBits: number;
    tagBits: number;
};

export type CacheValidationResult =
    | {
          valid: true;
          layout: CacheLayout;
      }
    | {
          valid: false;
          errors: string[];
      };

export type AddressDecomposition = {
    blockNumber: number;
    blockOffset: number;
    byteOffset: number;
    setIndex: number;
    tag: number;
};

export type CacheStepResult = {
    access: CacheAccess;
    decomposedAddress: AddressDecomposition;

    hit: boolean;
    wayIndex: number;

    evictedLine: CacheLine | null;
    stateAfter: CacheState;
};

export type CacheSimulation = {
    initialState: CacheState;
    steps: CacheStepResult[];

    hitCount: number;
    missCount: number;
};

export type CacheMissType = 'compulsory' | 'capacity' | 'conflict';
export type CacheLocality = 'temporal' | 'spatial';

export type CacheStepAnalysis = {
    missType: CacheMissType | null;
    locality: CacheLocality | null;
    relatedStep: number | null;
};

export type CacheAnalysis = {
    simulation: CacheSimulation;
    steps: CacheStepAnalysis[];
};

export type CacheSummary = {
    accessCount: number;

    hitCount: number;
    missCount: number;
    hitRate: number | null;
};

export type AddressTraceResult = {
    accesses: CacheAccess[];
    errors: string[];
};

export type CacheArrayPattern = {
    arrayName: string;
    multiplier: number;
    offset: number;
};

export type CacheArrayLoop = {
    startIndex: number;
    endExclusiveIndex: number;

    stride: number;
};

export type CacheArrayTraceResult = {
    accesses: CacheAccess[];
    errors: string[];
};
