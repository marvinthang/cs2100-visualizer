/* oxlint-disable unicorn/number-literal-case */
/* eslint-disable @typescript-eslint/max-params */
const HEX_PREFIX = /^0x/iu
const TWO_POW_32 = 4_294_967_296
type S32 = number
type U32 = number
const u32 = (n: number): U32 => {
  const m = ((n % TWO_POW_32) + TWO_POW_32) % TWO_POW_32
  return Math.trunc(m)
}
const s32 = (n: number): S32 => {
  const m = u32(n)
  return m >= 2_147_483_648 ? m - TWO_POW_32 : m
}
const mask = (width: number): U32 => (width >= 32 ? 0xff_ff_ff_ff : 2 ** width - 1)
const toU32 = (n: number): U32 => u32(n)
const toS32 = (n: number): S32 => s32(n)
const signExtend = (value: U32, fromWidth: number): S32 => {
  const m = mask(fromWidth)
  const v = u32(value) % (m + 1)
  const signBit = 2 ** (fromWidth - 1)
  return v >= signBit ? v - (m + 1) : v
}
const zeroExtend = (value: U32, fromWidth: number): U32 => u32(value) % (mask(fromWidth) + 1)
const extractField = (word: U32, hi: number, lo: number): U32 => {
  const width = hi - lo + 1
  return Math.floor(u32(word) / 2 ** lo) % 2 ** width
}
const insertField = (word: U32, hi: number, lo: number, value: U32): U32 => {
  const width = hi - lo + 1
  const m = mask(width)
  const shifted = (u32(value) % (m + 1)) * 2 ** lo
  const cleared = u32(word) - (Math.floor(u32(word) / 2 ** lo) % (m + 1)) * 2 ** lo
  return u32(cleared + shifted)
}
const addU32 = (a: U32, b: U32): U32 => u32(a + b)
const subU32 = (a: U32, b: U32): U32 => u32(a - b)
const shlU32 = (a: U32, shamt: number): U32 => u32(a * 2 ** (shamt % 32))
const shrU32 = (a: U32, shamt: number): U32 => Math.floor(u32(a) / 2 ** (shamt % 32))
const sarS32 = (a: U32, shamt: number): S32 => {
  const sh = shamt % 32
  const v = s32(a)
  return Math.floor(v / 2 ** sh)
}
const ltS32 = (a: U32, b: U32): boolean => s32(a) < s32(b)
const ltU32 = (a: U32, b: U32): boolean => u32(a) < u32(b)
const popcount = (a: U32): number => {
  let v = u32(a)
  let count = 0
  while (v > 0) {
    if (v % 2 === 1) count += 1
    v = Math.floor(v / 2)
  }
  return count
}
const parity = (a: U32): 0 | 1 => (popcount(a) % 2) as 0 | 1
const reverseBits32 = (a: U32): U32 => {
  let v = u32(a)
  let result = 0
  for (let i = 0; i < 32; i += 1) {
    result = result * 2 + (v % 2)
    v = Math.floor(v / 2)
  }
  return u32(result)
}
const toHex32 = (a: U32): string => `0x${u32(a).toString(16).padStart(8, '0')}`
const toBin32 = (a: U32): string => u32(a).toString(2).padStart(32, '0')
const fromHex = (s: string): U32 => u32(Number.parseInt(s.replace(HEX_PREFIX, ''), 16))
const fromBin = (s: string): U32 => u32(Number.parseInt(s, 2))
export {
  addU32,
  extractField,
  fromBin,
  fromHex,
  insertField,
  ltS32,
  ltU32,
  mask,
  parity,
  popcount,
  reverseBits32,
  sarS32,
  shlU32,
  shrU32,
  signExtend,
  subU32,
  toBin32,
  toHex32,
  toS32,
  toU32,
  zeroExtend
}
export type { S32, U32 }
