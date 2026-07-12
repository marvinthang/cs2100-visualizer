// a default program where every toggle changes the cycle count:
// the lw + add chain shows forwarding, the taken beq shows early branch,
// the not-taken beq shows prediction
export const DEFAULT_PIPELINE_PROGRAM = [
    'addi $1, $zero, 1',
    'lw   $2, 0($0)',
    'add  $3, $2, $1',
    'add  $4, $3, $1',
    'add  $5, $4, $1',
    'add  $6, $5, $1',
    'beq  $0, $0, T0',
    'add  $7, $1, $1',
    'T0: add $8, $1, $1',
    'beq  $1, $0, N1',
    'N1: add $9, $1, $1',
].join('\n');
