# Cache Visualizer — Detailed Design Specification

## 1. Purpose

The Cache Visualizer is an interactive CS2100 learning module for converting memory-access traces into step-by-step cache behavior.

It is intended to help students answer questions such as:

- How is a 32-bit byte address divided into tag, index, block offset, and byte offset?
- Which cache line or set does an address map to?
- Why is an access a hit or miss?
- Which block is evicted from a direct-mapped or 2-way set-associative cache?
- How does least-recently-used (LRU) replacement change after each access?
- How do array access patterns and instruction loops affect hit rate?
- Which observations demonstrate spatial or temporal locality?
- What is the final cache state after a trace?

The module is an educational simulator, not a cycle-accurate hardware model. It should use CS2100 terminology, expose intermediate calculations, reject ambiguous configurations, and avoid claiming explanations that cannot be derived reliably.

The architectural boundary is:

```text
Manual input / array generator / instruction loop / executed MIPS program
                              |
                              v
                    normalized access trace
                              |
                              v
                       pure cache engine
                              |
                              v
          step results / cache states / totals / explanations
                              |
                              v
                         React interface
```

The cache engine must not know whether an address originated from an array, a MIPS instruction, or manual input. Trace generators may attach descriptive metadata, but simulation behavior depends only on the normalized address and operation.

---

## 2. Product Goals and Non-Goals

### 2.1 Goals

The first complete release must:

1. Simulate direct-mapped caches.
2. Simulate 2-way set-associative caches.
3. Use LRU replacement for 2-way caches.
4. Accept manual data or instruction addresses.
5. Generate common array access traces.
6. Generate instruction-cache traces for sequential regions and loops.
7. Display address decomposition and cache lookup calculations.
8. Support stepping forward, backward, first, and last.
9. Show the cache state before and after each access.
10. Show hit count, miss count, and hit rate.
11. Give conservative, correct explanations of compulsory misses and locality.
12. Provide deterministic presets and automated tests.

### 2.2 Non-goals for the first release

The first release will not implement:

- arbitrary associativity beyond 1-way and 2-way;
- FIFO, random, pseudo-LRU, or optimal replacement;
- multi-level caches;
- unified instruction/data caches;
- cache coherence;
- virtual memory, TLBs, or physical address translation;
- cache timing, miss penalties, CPI impact, or AMAT;
- arbitrary JavaScript-style array expressions;
- write-back, write-through, dirty bits, or write buffers;
- automatic proof of spatial or temporal locality as a unique cause;
- full C execution or a full MIPS operating environment.

Store tracing and executed-MIPS integration are designed extension points, but they should not delay a correct read/fetch-only release.

---

## 3. Terminology and Mathematical Model

### 3.1 Units

The simulator uses byte addresses. The default machine word is 4 bytes.

Internally, all cache sizes are stored in bytes:

- `capacityBytes`: total data capacity across all cache lines;
- `blockSizeBytes`: bytes loaded into one cache line on a miss;
- `wordSizeBytes`: bytes in one displayed word, normally 4;
- `associativity`: number of ways per set, 1 or 2.

The UI may allow values to be entered in words or bytes. Values are converted to bytes before validation and simulation.

Metadata such as tags and valid bits does not count toward cache capacity.

### 3.2 Derived values

For a valid configuration:

```text
lineCount = capacityBytes / blockSizeBytes
setCount  = lineCount / associativity

byteOffsetBits  = log2(wordSizeBytes)
blockOffsetBits = log2(blockSizeBytes / wordSizeBytes)
setIndexBits    = log2(setCount)
tagBits         = addressBits
                  - byteOffsetBits
                  - blockOffsetBits
                  - setIndexBits
```

`setIndexBits` may be zero when there is one set. `blockOffsetBits` may be zero when a block contains one word.

For a normalized unsigned address `A`:

```text
byteOffset       = A mod wordSizeBytes
blockOffset      = floor(A / wordSizeBytes) mod wordsPerBlock
offsetWithinBlock = A mod blockSizeBytes
blockNumber      = floor(A / blockSizeBytes)
blockBaseAddress = blockNumber * blockSizeBytes
setIndex         = blockNumber mod setCount
tag              = floor(blockNumber / setCount)
wordAddress      = floor(A / wordSizeBytes)
```

For a direct-mapped cache, `setIndex` is displayed as `Index`. For a 2-way cache, it is displayed as `Set`.

### 3.3 Configuration invariants

The following must be true before a trace can run:

- `addressBits` is 32 in the first release.
- `wordSizeBytes` is 4 in the first release.
- `capacityBytes > 0`.
- `blockSizeBytes > 0`.
- `blockSizeBytes <= capacityBytes`.
- `capacityBytes` and `blockSizeBytes` are powers of two.
- `blockSizeBytes` is divisible by `wordSizeBytes`.
- `capacityBytes` is divisible by `blockSizeBytes * associativity`.
- `setCount` is a positive power of two.
- all addresses are integers in `[0, 2^addressBits - 1]`.
- data addresses used as word operations are word-aligned.
- instruction fetch addresses are word-aligned.

Invalid configurations must be blocked before simulation. Validation errors should state the violated relationship and, where practical, suggest a valid value.

Example:

```text
Capacity 24 words is invalid for a 2-way cache with 8-word blocks.
Each set requires 16 words, so capacity must be a multiple of 16 words.
Try 16 or 32 words.
```

---

## 4. Scope by Release

### 4.1 Release A — Cache engine and manual trace

- cache configuration in words or bytes;
- manual read/fetch trace parser;
- direct-mapped simulation;
- 2-way LRU simulation;
- address decomposition;
- access table;
- current cache table;
- step controls;
- summary counts;
- compulsory-miss classification;
- locality observations;
- core unit tests.

### 4.2 Release B — Educational trace generators

- array generator with a constrained pattern builder;
- instruction loop generator;
- built-in presets;
- trace preview and warnings;
- generator-specific tests.

### 4.3 Release C — Executed MIPS integration

- MIPS source editor;
- initial registers and memory;
- dynamic PC trace;
- dynamic `lw` data trace;
- optional `sw` trace when a write policy is implemented;
- maximum-instruction guard;
- termination/error reporting;
- links from cache accesses back to source instructions.

### 4.4 Later extensions

- exact 3C miss classification using a fully associative shadow cache;
- store policies;
- arbitrary associativity;
- AMAT;
- trace export/import;
- practice-question mode;
- shareable URL state;
- end-to-end browser tests.

---

## 5. User Experience

### 5.1 Navigation

Add a fifth top-level tab:

```text
Datapath | Assembly | Karnaugh Maps | Pipeline | Cache
```

The new tab ID is `cache`. `App.tsx` renders `CachePage` when selected.

On narrow screens, the current fixed five-column tab strip may become cramped. The navigation should either scroll horizontally or use shorter labels at small breakpoints.

### 5.2 Page layout

Desktop layout:

```text
+-----------------------------------------------------------------------+
| Cache Visualizer                         [Preset] [Reset] [Help]       |
+----------------------+------------------------------------------------+
| Trace source         | Cache configuration                            |
| Manual / Array /     | Type, capacity, block size, derived geometry   |
| Instruction Loop     |                                                |
+----------------------+------------------------------------------------+
| [Generate / Run]  validation messages  trace-length warning           |
+-----------------------------------------------------------------------+
| Summary: 12 accesses | 8 hits | 4 misses | 66.7% hit rate             |
+-------------------------------+---------------------------------------+
| Access trace                  | Selected access                        |
| step/source/address/result    | address bit split and calculation      |
| scrollable table              | lookup and educational explanation     |
+-------------------------------+---------------------------------------+
| Cache state at step N         | Step controls                          |
| set/index and ways            | |<  <  Play/Pause  >  >|              |
+-------------------------------+---------------------------------------+
```

Tablet and mobile layout:

- configuration sections stack vertically;
- results appear below configuration;
- access trace, cache state, and explanation use a segmented control or stacked cards;
- tables retain horizontal scrolling rather than shrinking fields until unreadable;
- stepping controls remain sticky near the bottom of the viewport while results are active.

### 5.3 Primary workflow

1. Choose a trace source.
2. Configure the source.
3. Configure the cache.
4. Review automatically calculated cache geometry.
5. Select **Generate and run**.
6. Inspect the first result or jump to a selected step.
7. Step through changes.
8. Review totals and final state.

Changing an input after a run marks the results as stale. The old result may remain visible but must show:

```text
Inputs changed. Run again to update these results.
```

The simulator should not silently rerun on every keystroke, because partially entered addresses and sizes are expected.

### 5.4 Configuration panel

Fields:

| Field              | Values                               | Default       |
| ------------------ | ------------------------------------ | ------------- |
| Cache organization | Direct-mapped, 2-way set associative | Direct-mapped |
| Capacity unit      | Words, bytes                         | Words         |
| Capacity           | Positive integer                     | 16 words      |
| Block-size unit    | Words, bytes                         | Words         |
| Block size         | Positive integer                     | 4 words       |
| Address width      | 32-bit, read-only initially          | 32-bit        |
| Word size          | 4 bytes, read-only initially         | 4 bytes       |
| Replacement        | LRU, read-only for 2-way             | LRU           |

Derived geometry appears immediately when inputs are valid:

```text
Capacity: 64 bytes
Block size: 16 bytes = 4 words
Cache lines: 4
Associativity: 2 ways
Sets: 2
Address split: 27 tag | 1 set | 2 block | 2 byte bits
```

### 5.5 Run, reset, and source switching

- **Generate and run** parses or generates the trace and simulates it from an empty cache.
- **Reset stepping** returns the selected step to the initial state without deleting inputs.
- **Clear trace** clears only trace-source input.
- **Reset all** restores the selected preset or application defaults after confirmation only if substantial input would be lost.
- Switching source mode preserves each mode's draft in component state during the current session.
- Selecting a preset replaces both source and cache configuration after a lightweight confirmation when edited input exists.

---

## 6. Trace Source Designs

### 6.1 Normalized cache access

All generators produce this contract:

```ts
export type CacheAccessOperation = 'read' | 'write' | 'fetch';

export type CacheAccessKind = 'data' | 'instruction';

export type CacheAccessMetadata = {
    sourceMode: 'manual' | 'array' | 'instruction-loop' | 'mips';
    sourceText?: string;
    arrayName?: string;
    elementIndex?: number;
    expression?: string;
    pc?: number;
    instructionIndex?: number;
    instructionText?: string;
    sourceLine?: number;
};

export type CacheAccess = {
    id: string;
    ordinal: number;
    kind: CacheAccessKind;
    operation: CacheAccessOperation;
    address: number;
    label?: string;
    metadata: CacheAccessMetadata;
};
```

`ordinal` is zero-based internally and displayed as step `ordinal + 1`. The stable `id` supports React row selection.

The initial simulator accepts `read` and `fetch`. `write` remains in the contract for future compatibility but is rejected unless a write policy is configured.

### 6.2 Manual trace mode

#### Input grammar

One access per line:

```text
[OP] ADDRESS [LABEL]
```

- `OP` is optional: `R`, `READ`, `F`, or `FETCH`, case-insensitive.
- Omitted `OP` defaults to `R` for data mode or `F` for instruction mode.
- `ADDRESS` accepts hexadecimal with `0x`, decimal, or bare hexadecimal containing `A-F`.
- `LABEL` is all remaining text and is optional.
- blank lines are ignored.
- lines beginning with `#` or `//` are comments.
- trailing comments beginning with `#` are allowed.

Examples:

```text
R 0x804ab0 A[0]
0x804ab4 A[1]
FETCH 0x00400020 Inst9
```

Ambiguous all-digit input is interpreted as decimal. The preview always shows normalized hexadecimal so users can verify the interpretation.

#### Errors

Errors include line number and message:

```text
Line 3: "0x80ZZ" is not a valid address.
Line 5: address 0x10010002 is not word-aligned.
Line 8: WRITE is not supported in this release.
```

The parser returns all detectable errors, not only the first.

#### Preview

Before simulation, show normalized rows:

```text
1  Read   0x00804AB0  A[0]
2  Read   0x00804AB4  A[1]
```

### 6.3 Array pattern generator

#### Array definitions

Each array has:

```ts
type ArrayDefinition = {
    id: string;
    name: string;
    baseAddress: number;
    length: number;
    elementSizeBytes: number;
};
```

Initial release constraints:

- one to three arrays;
- names `A`, `B`, and `C` by default;
- length is a positive integer;
- element size is fixed to one 4-byte word;
- base addresses must be word-aligned;
- adjacent placement may derive a later base as `previous.base + previous.length * elementSizeBytes`;
- explicitly entered bases override adjacency.

When the UI says “B follows A,” it must show the resulting address rather than hiding it.

#### Loop definition

```ts
type LoopDefinition = {
    variable: 'i';
    start: number;
    endExclusive: number;
    step: number;
};
```

The UI may present an inclusive upper bound because exam questions commonly use `i = 0 to N - 1`; it must convert this explicitly and display the generated iteration count.

Initial release requires a positive step. Descending loops are a later extension.

#### Pattern builder

Avoid arbitrary expression evaluation. Represent each access as a constrained form:

```ts
type IndexExpression = {
    multiplier: number; // e.g. 2 in 2*i + 1
    offset: number; // e.g. 1 in 2*i + 1
};

type ArrayPatternAccess = {
    arrayId: string;
    index: IndexExpression;
    operation: 'read';
};
```

This supports:

- `A[i]` as `{ multiplier: 1, offset: 0 }`;
- `A[i + 1]` as `{ multiplier: 1, offset: 1 }`;
- `B[2i]` as `{ multiplier: 2, offset: 0 }`;
- `B[2i + 1]` as `{ multiplier: 2, offset: 1 }`.

For each loop iteration, accesses are generated in the order shown in the builder.

Address calculation:

```text
elementIndex = multiplier * i + offset
address = array.baseAddress + elementIndex * array.elementSizeBytes
```

Out-of-bounds generated indices block the run by default and identify the first failing iteration. An advanced “allow conceptual out-of-bounds addresses” option is not needed initially.

#### Trace-size guard

```text
accessCount = iterationCount * accessesPerIteration
```

- Up to 5,000 accesses: run normally.
- 5,001–20,000: warn and require explicit continuation.
- Above 20,000: block in the browser release.

These values are product guards, not algorithmic limits, and may be revised after performance measurement.

### 6.4 Instruction-loop generator

This generator handles exam questions without requiring executable MIPS.

Inputs:

```ts
type InstructionLoopSource = {
    baseAddress: number;
    instructionCount: number;
    loopStartIndex: number; // 0-based internally
    loopEndIndex: number; // inclusive, 0-based internally
    iterationCount: number;
    executePrefixOnce: boolean;
    executeSuffixOnce: boolean;
};
```

UI labels use `Inst1`, `Inst2`, and so forth. Conversion is explicit:

```text
PC(InstN) = baseAddress + (N - 1) * 4
```

Generation order:

1. If enabled, fetch instructions before the loop once.
2. Fetch `loopStart` through `loopEnd` for every loop iteration.
3. If enabled, fetch instructions after the loop once.

The preview groups rows by prefix, iteration, and suffix. Every result remains an ordinary `fetch` access.

### 6.5 Executed MIPS source

This mode is Release C.

#### Inputs

- MIPS source accepted by the existing assembler;
- instruction base address, default `0x00400000`;
- initial registers;
- initialized data memory;
- trace instruction fetches toggle;
- trace data reads toggle;
- future trace data writes toggle;
- maximum executed instruction count, default 10,000.

#### Integration behavior

The existing assembler assigns each instruction an `index`, and current execution uses a zero-based PC. The trace runner should keep execution PC semantics unchanged and translate for cache display:

```text
instructionFetchAddress = instructionBaseAddress + machine.pc
```

Before executing an instruction:

1. Resolve `programIndex = machine.pc / 4`.
2. Reject a misaligned PC.
3. Stop normally when the PC points immediately after the program.
4. Stop with an explanation if the PC points elsewhere outside the program.
5. Record the fetch when enabled.
6. For `lw`, calculate `effectiveAddress = register[rs] + immediate` before execution and record a data read.
7. For future `sw`, calculate the same way and record a write only when supported.
8. Execute with the existing instruction executor.

The generator returns one or two cache accesses for a single dynamic instruction, depending on selected targets. Instruction and data traces should normally be simulated separately because CS2100 questions generally describe separate instruction and data caches. The UI must not combine them unless unified-cache behavior is explicitly implemented later.

#### Termination states

```ts
type MipsTraceTermination =
    | { kind: 'completed'; executedInstructions: number }
    | { kind: 'limit'; executedInstructions: number }
    | { kind: 'invalid-pc'; pc: number; message: string }
    | { kind: 'execution-error'; message: string };
```

Reaching the instruction limit should retain the partial trace but require the user to acknowledge that totals do not represent a completed program.

#### Forced branch outcomes

Forced outcomes are not part of initial integration. They are difficult to define safely because a program can contain multiple static branch instructions, each executed a different number of times. A later design must identify a branch by source line or instruction index and associate an independent outcome sequence with that branch.

---

## 7. Cache Engine Design

### 7.1 Pure module boundary

The cache engine must be a pure TypeScript module under `src/core/cache`. It must not import React, browser APIs, or components.

Proposed API:

```ts
export function validateCacheConfig(config: CacheConfig): CacheValidationResult;

export function deriveCacheGeometry(config: CacheConfig): CacheGeometry;

export function decomposeAddress(
    address: number,
    geometry: CacheGeometry,
): AddressDecomposition;

export function simulateCache(
    accesses: CacheAccess[],
    config: CacheConfig,
): CacheSimulation;
```

Invalid input is reported with typed domain errors. UI formatting is not performed in the engine.

### 7.2 Types

```ts
export type CacheOrganization = 'direct-mapped' | '2-way';

export type CacheConfig = {
    addressBits: 32;
    wordSizeBytes: 4;
    capacityBytes: number;
    blockSizeBytes: number;
    associativity: 1 | 2;
    replacementPolicy: 'lru';
};

export type CacheGeometry = {
    addressBits: number;
    wordSizeBytes: number;
    capacityBytes: number;
    blockSizeBytes: number;
    wordsPerBlock: number;
    lineCount: number;
    associativity: 1 | 2;
    setCount: number;
    byteOffsetBits: number;
    blockOffsetBits: number;
    setIndexBits: number;
    tagBits: number;
};

export type AddressDecomposition = {
    address: number;
    wordAddress: number;
    byteOffset: number;
    blockOffset: number;
    offsetWithinBlock: number;
    blockNumber: number;
    blockBaseAddress: number;
    blockEndAddress: number;
    setIndex: number;
    tag: number;
};

export type CacheLine = {
    valid: boolean;
    tag: number | null;
    blockNumber: number | null;
    blockBaseAddress: number | null;
    insertedAtStep: number | null;
    lastAccessedAtStep: number | null;
};

export type CacheSet = {
    ways: CacheLine[];
    lruOrder: number[];
};

export type CacheState = {
    sets: CacheSet[];
};
```

`lruOrder` stores way indices from least recently used to most recently used. Invalid ways are excluded until populated. `lastAccessedAtStep` is useful for display and test diagnostics, but replacement should use the explicit ordering.

Cache lines store block identity, not invented memory contents. The UI derives the word address range from the block base and geometry.

### 7.3 Step results

```ts
export type MissType = 'compulsory' | 'conflict' | 'capacity' | 'unclassified';

export type LocalityObservation = {
    kind: 'spatial' | 'temporal';
    priorStep: number;
    explanationKey:
        | 'same-address-reused'
        | 'same-block-different-word'
        | 'same-block-reused';
};

export type CacheMutation = {
    setIndex: number;
    wayIndex: number;
    before: CacheLine;
    after: CacheLine;
    evicted: CacheLine | null;
    lruBefore: number[];
    lruAfter: number[];
};

export type CacheStepResult = {
    ordinal: number;
    access: CacheAccess;
    decomposition: AddressDecomposition;
    hit: boolean;
    hitWay: number | null;
    selectedWay: number;
    missType: MissType | null;
    locality: LocalityObservation[];
    mutation: CacheMutation;
    stateAfter: CacheState;
};

export type CacheSimulationSummary = {
    accessCount: number;
    hitCount: number;
    missCount: number;
    hitRate: number | null;
    missRate: number | null;
    compulsoryMissCount: number;
    conflictMissCount: number;
    capacityMissCount: number;
    unclassifiedMissCount: number;
};

export type CacheSimulation = {
    config: CacheConfig;
    geometry: CacheGeometry;
    initialState: CacheState;
    steps: CacheStepResult[];
    finalState: CacheState;
    summary: CacheSimulationSummary;
};
```

For zero accesses, `hitRate` and `missRate` are `null`, displayed as `—`, never `NaN`.

For initial trace limits, storing `stateAfter` at each step is acceptable and simplifies instant backward navigation. Cache states must be deep-cloned or constructed immutably so later mutations cannot modify earlier snapshots. If performance measurements show excessive memory use, replace snapshots with mutations plus periodic checkpoints without changing the public UI behavior.

### 7.4 Unsigned address handling

JavaScript bitwise operators coerce values to signed 32-bit integers. The engine should avoid using signed bit shifts as its primary decomposition mechanism.

Use safe integer arithmetic:

```ts
const blockNumber = Math.floor(address / blockSizeBytes);
const setIndex = blockNumber % setCount;
const tag = Math.floor(blockNumber / setCount);
```

All 32-bit unsigned addresses are exactly representable as JavaScript numbers. Parsing must reject negative values and values greater than `0xFFFFFFFF`.

Hex formatting should normalize with arithmetic and `toString(16)`, padding to eight hexadecimal digits. Do not format a high address by first converting it with a signed bitwise operation.

### 7.5 Initial state

The cache begins cold:

- every line is invalid;
- tag and block fields are `null`;
- LRU order is empty;
- the seen-block set is empty.

The initial state is displayed as step 0.

### 7.6 Lookup and replacement algorithm

For every access at ordinal `s`:

1. Decompose the address.
2. Select `state.sets[setIndex]`.
3. Search ways for a valid line whose tag equals the computed tag.
4. If found:
    - mark a hit;
    - select the matching way;
    - leave the stored block unchanged;
    - set `lastAccessedAtStep = s`;
    - move the way to the most-recently-used end of `lruOrder`.
5. Otherwise mark a miss:
    - prefer the lowest-index invalid way;
    - if all ways are valid, choose `lruOrder[0]`;
    - record a cloned evicted line when the victim was valid;
    - replace the victim with the accessed block;
    - set both timestamp fields appropriately;
    - remove the selected way from any old LRU position and append it as MRU.
6. Record classification and locality observations.
7. Add the block number to the seen-block set.
8. create the immutable step result and state snapshot.

For direct-mapped caches, every set has one way. LRU order remains `[0]` after the line becomes valid, but the UI hides LRU because it conveys no choice.

### 7.7 LRU behavior

For two ways:

```text
[]       -- fill way 0 --> [0]
[0]      -- fill way 1 --> [0, 1]   (way 0 is LRU)
[0, 1]   -- hit way 0  --> [1, 0]   (way 1 is LRU)
[1, 0]   -- miss/full  --> evict way 1, then [0, 1]
```

LRU is updated on both hits and block fills. A deterministic empty-way rule is required so tests and screenshots are stable.

### 7.8 Miss classification

#### Required initial behavior

Track all previously referenced block numbers:

- if a missed block has never appeared, classify it as `compulsory`;
- otherwise classify it as `unclassified` unless exact 3C classification is enabled.

Never infer “conflict” only because a block was evicted from the selected set. A non-compulsory miss may be caused by overall capacity rather than mapping conflict.

#### Exact 3C extension

To distinguish conflict and capacity misses, run a shadow cache with:

- the same total line count as the real cache;
- one fully associative set;
- LRU replacement;
- the same block size.

For a real-cache miss:

1. If this is the block's first reference, it is compulsory.
2. Else, if the shadow cache hits, it is conflict.
3. Else, it is capacity.

Update the shadow cache for every access after observing its pre-access hit state.

The initial UI should hide zero-valued conflict/capacity metrics when exact classification is disabled and show “Other misses” rather than presenting unclassified misses as a known theoretical type.

### 7.9 Locality observations

Locality is evidence about the trace, not a mutually exclusive hit/miss type.

Maintain:

- last access step per exact address;
- last access step per block number;
- set of word offsets previously referenced within each block.

Suggested observations:

- exact address seen before: temporal locality (`same-address-reused`);
- same block seen before, but this word offset has not been seen: spatial locality (`same-block-different-word`);
- same block seen before and exact address metadata is unavailable or byte offsets differ: temporal block reuse (`same-block-reused`).

An access may have more than one observation. Explanations must not say that locality guarantees a hit. Example:

```text
This address was accessed at step 2, showing temporal reuse. It is still a
miss because its block is no longer present in set 0.
```

The first access to a new block has no locality observation even though loading the entire block may enable future spatial hits.

---

## 8. Explanation System

### 8.1 Principle

The engine returns structured facts. The presentation layer converts those facts into readable text. Avoid storing only one prebuilt explanation string, because structured facts are easier to test, render, and revise.

### 8.2 Explanation sections

For the selected access, render:

1. **Access** — operation, source label, decimal/hex address.
2. **Block calculation** — block number and block address range.
3. **Address split** — tag, set/index, block offset, byte offset.
4. **Lookup** — tags compared in each relevant way.
5. **Result** — hit or miss and selected way.
6. **Cache change** — loaded or evicted block.
7. **LRU change** — only for 2-way caches.
8. **Learning note** — compulsory miss and/or locality observation.

### 8.3 Example: compulsory miss

```text
Address 0x00804AB0 belongs to memory block 0x00804AB0–0x00804ABF.
Block number 525483 maps to cache index 3 and has tag 0x2012A.

Index 3 is invalid, so no matching block is present. This access misses.
The block is loaded into index 3.

This is a compulsory (cold) miss because this memory block has not appeared
earlier in the trace.
```

### 8.4 Example: spatial hit

```text
Address 0x00804AB4 belongs to the same block as the access at step 1.
Index 3 contains a valid matching tag, so this access hits in word offset 1.

The access demonstrates spatial locality: a nearby word is being used after
the block was loaded.
```

### 8.5 Example: 2-way replacement

```text
Set 1 contains two valid lines, but neither tag matches 0x18.
The access therefore misses. Way 0 is the least recently used way, so block
0x00000100–0x0000010F is evicted and the new block is loaded into way 0.
Way 0 becomes most recently used; way 1 becomes least recently used.
```

### 8.6 Comparison details

Show each relevant way:

| Way | Valid | Stored tag | Requested tag | Result   |
| --- | ----- | ---------- | ------------- | -------- |
| 0   | 1     | `0x12`     | `0x18`        | No match |
| 1   | 1     | `0x15`     | `0x18`        | No match |

Invalid ways should say “Invalid; tag is ignored,” not “tag mismatch.”

---

## 9. Address Breakdown Visualization

### 9.1 Bit strip

Render a 32-bit strip grouped into four semantic regions:

```text
|             Tag             | Set | Block offset | Byte offset |
|          27 bits            |  1  |      2       |      2      |
```

Each region shows:

- name;
- bit range, such as `31–5`;
- number of bits;
- selected access value in binary and hexadecimal/decimal.

If a field has zero bits, show a compact disabled segment:

```text
Set index: 0 bits (one set)
```

Do not render a fake positive-width bit box.

### 9.2 Binary readability

- Use a monospace font.
- Group binary digits in fours within large tag regions.
- Provide a “Binary / Values” display toggle if the full strip becomes crowded.
- Keep hex values visible by default because exam inputs are commonly hexadecimal.
- Include accessible text conveying the same split; color must not be the only identifier.

### 9.3 Calculation card

Alongside the bit strip, show the arithmetic route:

```text
Block number = floor(0x00804AB4 / 16) = 0x000804AB
Set index    = 0x000804AB mod 4       = 3
Tag          = floor(0x000804AB / 4)  = 0x0002012A
Word offset  = floor(4 / 4)           = 1
Byte offset  = 0
```

This is important for students who understand division/modulo more readily than bit slicing.

---

## 10. Result Views

### 10.1 Summary bar

Show:

- total accesses;
- hits;
- misses;
- hit rate;
- miss rate;
- compulsory misses;
- other or exact conflict/capacity misses depending on classification mode.

Percentages use one decimal place by default while tooltips show exact fractions:

```text
Hit rate 66.7% (8 / 12)
```

### 10.2 Access trace table

Columns:

| Column      | Content                                 |
| ----------- | --------------------------------------- |
| Step        | One-based ordinal                       |
| Operation   | Read or Fetch                           |
| Source      | Label, expression, or instruction       |
| Address     | Padded uppercase hex                    |
| Block       | Block number or base address            |
| Tag         | Hex tag                                 |
| Index/Set   | Decimal index                           |
| Word offset | Decimal offset                          |
| Result      | Hit or Miss badge                       |
| Change      | Loaded/evicted block summary            |
| Note        | Compulsory, temporal, spatial, or other |

Behavior:

- clicking a row selects that step;
- selected row uses `aria-selected` and a strong visual highlight;
- changed set/way in the cache table highlights simultaneously;
- keyboard Up/Down changes selection when the table has focus;
- headers remain sticky within the scroll container;
- large traces may use simple row virtualization later, but correctness takes priority initially.

### 10.3 Cache state table

Direct-mapped columns:

```text
Index | Valid | Tag | Block range | Word addresses | Last used
```

2-way layout:

```text
Set | Way | Valid | Tag | Block range | Word addresses | LRU status | Last used
```

Use one row per way rather than placing every way field into a single very wide row. Visually group rows belonging to the same set.

At selected step `N`, show the state after executing step `N`. At step 0, show the cold initial state.

Highlight semantics:

- blue: accessed line on a hit;
- green: newly loaded line;
- red outline or evicted badge: victim shown in the change panel, not as if it remains in the table;
- amber: current LRU way.

Colors must be accompanied by text or icons.

“Word addresses” list the addresses covered by the block. They do not pretend to contain data values. For large blocks, display the first/last word and expand on demand.

### 10.4 Step controls

Controls:

```text
First | Previous | Play/Pause | Next | Last | Step N of M
```

- First selects step 0.
- Previous decrements one step.
- Next increments one step.
- Last selects the final result.
- Play advances at a selectable speed and stops at the final step.
- Default speed is approximately one step per second.
- Available speeds: 0.5x, 1x, 2x, and 4x.
- Manual selection while playing pauses playback.
- Controls are disabled appropriately at boundaries.
- Left/Right arrow shortcuts work when focus is within the results area and do not intercept text input.

### 10.5 Before/after change card

For the selected step:

```text
Set 1, Way 0
Before: valid, tag 0x12, block 0x100–0x10F, LRU
After:  valid, tag 0x18, block 0x180–0x18F, MRU
Evicted block: 0x100–0x10F
```

On a hit, state that the tag/block did not change and only recency metadata changed.

---

## 11. Presets

Each preset contains an immutable source definition, cache configuration, title, learning objectives, and optional expected totals.

```ts
type CachePreset = {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    source: TraceSourceDraft;
    config: CacheConfigDraft;
    expected?: {
        accesses: number;
        hits: number;
        misses: number;
    };
};
```

Required presets:

### 11.1 Spatial and temporal locality

```text
Direct-mapped, 16 words, 4-word blocks
R 0x00804AB0
R 0x00804AB4
R 0x00804AB8
R 0x00804AB0
```

Demonstrates one compulsory miss, spatial use, and exact-address temporal reuse.

### 11.2 Direct-mapped conflict

Use a deliberately small cache and two blocks separated by exactly one cache capacity so they map to the same index. Repeat the first block after accessing the second.

Demonstrates a mapping collision and eviction. If exact 3C classification is not enabled, describe it as “the earlier block was evicted by another block mapping to this index,” without assigning the theoretical conflict label.

### 11.3 Two-way LRU

Use three distinct blocks mapping to one set:

```text
A, B, A, C, B
```

This makes the recency update observable: after reusing A, B becomes LRU and is evicted by C.

### 11.4 Adjacent arrays

Two adjacent arrays with `A[i], B[i]` and parameters chosen to demonstrate how alignment and cache geometry affect the trace.

### 11.5 Instruction loop

Sequential prefix, repeated loop body, and suffix. Choose block size so the first iteration loads instruction blocks and later iterations mostly hit.

Every preset must have a unit test for its trace and expected cache result.

---

## 12. React and File Architecture

Proposed structure:

```text
src/
  core/
    cache/
      types.ts
      config.ts
      address.ts
      simulator.ts
      classification.ts
      explanations.ts          # structured explanation helpers, no React
      simulator.test.ts
      address.test.ts
      classification.test.ts
      presets.test.ts
      trace/
        manualTrace.ts
        arrayTrace.ts
        instructionLoopTrace.ts
        mipsTrace.ts            # Release C
        manualTrace.test.ts
        arrayTrace.test.ts
        instructionLoopTrace.test.ts
        mipsTrace.test.ts       # Release C
  features/
    cache/
      CachePage.tsx
      cachePresets.ts
      useCacheVisualizer.ts
      components/
        CacheHeader.tsx
        CacheConfigPanel.tsx
        DerivedGeometryCard.tsx
        TraceSourcePanel.tsx
        ManualTraceEditor.tsx
        ArrayTraceBuilder.tsx
        InstructionLoopBuilder.tsx
        TracePreview.tsx
        SimulationSummary.tsx
        AccessTraceTable.tsx
        CacheStateTable.tsx
        AddressBitSplit.tsx
        AccessExplanation.tsx
        CacheChangeCard.tsx
        CacheStepControls.tsx
```

The page may begin with fewer files and split when components become substantial. The important dependency direction is:

```text
features/cache -> core/cache
core/cache -X-> features/cache or React
```

### 12.1 Hook state

`useCacheVisualizer` owns orchestration state:

```ts
type CacheVisualizerState = {
    sourceMode: TraceSourceMode;
    sourceDrafts: Record<TraceSourceMode, TraceSourceDraft>;
    configDraft: CacheConfigDraft;
    simulation: CacheSimulation | null;
    selectedStep: number;
    isPlaying: boolean;
    playbackSpeed: number;
    resultsAreStale: boolean;
    validationErrors: ValidationIssue[];
};
```

Draft types keep text fields as strings so users can temporarily clear or partially type values. Domain types contain only validated numbers.

The hook:

- converts drafts to domain values;
- invokes generators and simulation;
- maintains selection and playback;
- resets selection to step 0 after a new run;
- marks results stale after draft changes;
- exposes commands but contains no cache arithmetic.

### 12.2 No persistence in initial release

Inputs remain in memory while the tab is mounted. URL/local-storage persistence is optional later. Do not introduce schema migration complexity for the first version.

---

## 13. Validation and Error Handling

### 13.1 Validation layers

1. **Draft validation** — required fields, numeric parsing, address syntax.
2. **Domain validation** — cache geometry invariants and aligned ranges.
3. **Trace validation** — access count, supported operations, address alignment.
4. **Simulation assertions** — impossible internal state, treated as programmer errors.

### 13.2 Typed issues

```ts
type ValidationIssue = {
    severity: 'error' | 'warning';
    code: string;
    message: string;
    field?: string;
    line?: number;
};
```

Errors block running. Warnings permit running after acknowledgment when necessary.

### 13.3 Important messages

- capacity or block size is not a power of two;
- capacity is incompatible with associativity;
- block contains a non-integer number of words;
- address exceeds 32-bit range;
- address is unaligned;
- manual trace line cannot be parsed;
- array index is outside its declared array;
- generated trace exceeds recommended size;
- instruction loop bounds are invalid;
- MIPS execution reaches its instruction limit;
- selected operation has no implemented cache policy.

### 13.4 Internal failures

The UI should catch simulator exceptions at the feature boundary and show:

```text
The cache simulation could not be completed. Your inputs were preserved.
```

In development, log the detailed error. Domain validation should prevent ordinary user input from reaching this path.

---

## 14. Accessibility and Interaction Requirements

- All inputs have visible labels and associated descriptions.
- Result badges include text, not color alone.
- Tables use semantic table markup where feasible.
- Interactive rows are keyboard selectable.
- Step controls have accessible names and disabled states.
- The bit split has an equivalent textual description.
- Focus moves to the first validation summary after a failed run.
- After a successful run, announce totals through a polite live region without unexpectedly moving keyboard focus.
- Animation respects `prefers-reduced-motion`; autoplay is never started automatically.
- Hit/miss colors must meet contrast requirements.
- Tooltips are supplementary; essential information remains visible or keyboard accessible.

---

## 15. Testing Strategy

### 15.1 Address decomposition tests

Test:

- zero address;
- highest 32-bit unsigned address;
- one-word blocks;
- one-set cache;
- example high-bit addresses such as `0x804AB0` and `0x80000000`;
- block boundaries;
- each offset field;
- derived bit counts summing to 32.

For every valid generated configuration and address, assert:

```text
address = blockBaseAddress + offsetWithinBlock
blockNumber = tag * setCount + setIndex
offsetWithinBlock = blockOffset * wordSizeBytes + byteOffset
```

### 15.2 Configuration tests

Accept valid direct and 2-way geometries. Reject:

- zero/negative values;
- non-powers of two;
- block larger than capacity;
- capacity not divisible by set width;
- invalid associativity;
- impossible field widths.

### 15.3 Direct-mapped tests

- cold fill;
- same-address hit;
- same-block different-word hit;
- mapping collision and eviction;
- invalid line preferred naturally;
- final tags and block bases;
- exact hit/miss counts.

### 15.4 Two-way LRU tests

- fill way 0 then way 1;
- hit updates MRU order;
- third same-set block evicts LRU;
- accesses in another set do not change this set's order;
- victim and before/after mutation are immutable;
- final set state and summary.

### 15.5 Classification/locality tests

- first block access is compulsory;
- first access to another word of an already seen block is not compulsory;
- exact-address reuse produces temporal evidence;
- new word in the same seen block produces spatial evidence;
- temporal reuse may still miss after eviction;
- exact shadow-cache classification when that extension is enabled.

### 15.6 Trace generator tests

Manual parser:

- supported address formats;
- comments, blank lines, labels, and default operations;
- multiple line errors;
- unsigned range and alignment.

Array generator:

- adjacent base calculation;
- `i`, `i + 1`, and `2i`;
- per-iteration access ordering;
- bounds checks;
- trace-size calculation.

Instruction loop:

- prefix/body/suffix order;
- one and multiple iterations;
- PC calculation with nonzero base;
- invalid loop bounds.

MIPS trace:

- dynamic fetch order through taken and not-taken branches;
- loops;
- jump targets;
- effective `lw` addresses;
- instruction limit;
- invalid PC termination;
- correspondence to assembler source lines.

### 15.7 Component tests

If a React testing library is added, test:

- validation messages;
- selecting a trace row updates all result panels;
- stepping boundaries;
- stale-result state;
- direct versus 2-way cache columns;
- zero-bit address fields;
- preset loading.

### 15.8 End-to-end smoke tests

Later Playwright coverage should exercise:

1. Load spatial-locality preset.
2. Run it.
3. Verify totals.
4. Select a hit row.
5. Verify address explanation and cache highlight.
6. Load 2-way LRU preset.
7. Step to replacement.
8. Verify victim and final state.

---

## 16. Performance and Determinism

- Simulation complexity is `O(accesses * associativity)`, effectively linear because associativity is at most 2.
- State snapshots cost `O(accesses * lineCount)` memory in the simplest implementation.
- Initial trace and configuration guards keep this acceptable for exam-sized examples.
- Presets and generated IDs must be deterministic.
- Do not use wall-clock timestamps for LRU; use access ordinals.
- No random generated values are required in the core release.
- If later practice generation uses randomness, accept an explicit seed.

---

## 17. Acceptance Criteria

### 17.1 Functional

The feature is complete when a student can:

- open the Cache tab;
- choose manual, array, or instruction-loop input;
- configure a valid direct-mapped or 2-way cache;
- see derived lines, sets, ways, and bit widths;
- generate and preview a normalized trace;
- run from a cold cache;
- see a result for every access;
- select and step through accesses;
- see address arithmetic and bit decomposition;
- see tag comparisons and hit/miss reasoning;
- see fills, evictions, and LRU changes;
- inspect cache state at step 0, intermediate steps, and the end;
- see hit/miss totals and rates;
- see compulsory misses and conservative locality observations;
- load all required presets.

### 17.2 Correctness

- All configuration invariants are enforced.
- High unsigned 32-bit addresses remain nonnegative and format correctly.
- Direct-mapped mapping matches the formulas in Section 3.
- Two-way replacement selects the true LRU way.
- Hits update LRU.
- Prior snapshots never change after later accesses.
- A miss is never labeled conflict/capacity without the shadow-cache method.
- Locality is presented separately from hit/miss and miss type.
- Empty traces never produce invalid percentages.

### 17.3 Quality

- Core cache and generator logic has automated Vitest coverage.
- `npm test`, `npm run lint`, and `npm run build` pass.
- The page works at desktop and narrow viewport sizes.
- Essential behavior is keyboard accessible.
- No React dependency exists under `src/core/cache`.
- The implementation does not modify existing MIPS execution semantics.

---

## 18. Delivery Plan

### Phase 1 — Domain foundation

1. Add types and configuration validation.
2. Implement address decomposition.
3. Implement initial state and direct-mapped simulation.
4. Add 2-way LRU.
5. Add immutable step results and summaries.
6. Add compulsory/locality tracking.
7. Complete unit tests before UI integration.

### Phase 2 — Manual learning workflow

1. Add manual parser.
2. Add Cache tab and page shell.
3. Build configuration and derived-geometry panels.
4. Build trace preview.
5. Build summary, access table, cache table, and explanation.
6. Add stepping and playback.
7. Verify responsive and keyboard behavior.

### Phase 3 — Generators and presets

1. Add constrained array builder.
2. Add instruction-loop generator.
3. Add five presets and golden tests.
4. Add trace-size guards.
5. Polish educational copy.

### Phase 4 — MIPS integration

1. Extract or create a non-React dynamic program trace runner.
2. Add instruction-base translation.
3. Record fetch and `lw` accesses.
4. Add initial state editor reuse where practical.
5. Add termination guards and source links.
6. Add cross-module action such as “Send to Cache” only after the standalone workflow is stable.

---

## 19. Key Decisions Summary

1. The cache engine consumes normalized accesses and is independent of trace source.
2. All internal sizes are bytes; the UI may accept words.
3. Only power-of-two, bit-splittable configurations are accepted.
4. Addresses use unsigned safe-integer arithmetic rather than signed bitwise decomposition.
5. Cache lines represent block identity and do not invent memory contents.
6. LRU is an explicit deterministic ordering updated on hits and fills.
7. Compulsory/conflict/capacity classification and locality are distinct concepts.
8. Conflict/capacity labels require a fully associative LRU shadow cache.
9. Initial results may use immutable full snapshots for simpler stepping.
10. Arbitrary array expressions and forced branches are postponed until their semantics can be defined safely.
11. Instruction and data cache traces remain separate unless unified-cache behavior is intentionally added.
12. The first implementation is built and tested vertically, beginning with manual traces before MIPS integration.

This design preserves the proposal's strongest idea—trace generation followed by a reusable simulator—while making the mathematical rules, educational claims, UI behavior, and implementation boundaries precise enough to build and test.
