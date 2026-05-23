/* eslint-disable @typescript-eslint/max-params */
import type { Arbitrary } from 'fast-check'
import { describe, expect, test } from 'bun:test'
import { assert, integer, property } from 'fast-check'
import {
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
} from './index'

const TWO_POW_32 = 4_294_967_296
const u32arb = (): Arbitrary<number> => integer({ max: TWO_POW_32 - 1, min: 0 })
const widthBetween = (lo: number, hi: number): Arbitrary<number> => integer({ max: hi, min: lo })
describe('mask', () => {
  test('width 0 to 32', () => {
    expect(mask(0)).toBe(0)
    expect(mask(1)).toBe(1)
    expect(mask(8)).toBe(255)
    expect(mask(16)).toBe(65_535)
    expect(mask(31)).toBe(2_147_483_647)
    expect(mask(32)).toBe(TWO_POW_32 - 1)
  })
})
describe('signExtend', () => {
  test('16-bit -1 extends to -1', () => {
    expect(signExtend(65_535, 16)).toBe(-1)
  })
  test('16-bit 0x7fff stays positive', () => {
    expect(signExtend(32_767, 16)).toBe(32_767)
  })
  test('5-bit 0x10 extends to -16', () => {
    expect(signExtend(16, 5)).toBe(-16)
  })
  test('property: width=32 maps to S32', () => {
    assert(
      property(u32arb(), v => {
        const expected = v >= 2_147_483_648 ? v - TWO_POW_32 : v
        expect(signExtend(v, 32)).toBe(expected)
      })
    )
  })
})
describe('zeroExtend', () => {
  test('property: result <= mask(width)', () => {
    assert(
      property(u32arb(), widthBetween(1, 32), (v, w) => {
        expect(zeroExtend(v, w)).toBeLessThanOrEqual(mask(w))
      })
    )
  })
})
describe('field extract/insert', () => {
  test('R-type field decomposition', () => {
    const word = 19_546_144
    expect(extractField(word, 31, 26)).toBe(0)
    expect(extractField(word, 25, 21)).toBe(9)
    expect(extractField(word, 20, 16)).toBe(10)
    expect(extractField(word, 15, 11)).toBe(8)
    expect(extractField(word, 10, 6)).toBe(0)
    expect(extractField(word, 5, 0)).toBe(32)
  })
  test('property: insert then extract is identity (modulo mask)', () => {
    assert(
      property(u32arb(), integer({ max: 31, min: 0 }), integer({ max: 31, min: 0 }), u32arb(), (word, a, b, value) => {
        const lo = Math.min(a, b)
        const hi = Math.max(a, b)
        const width = hi - lo + 1
        const inserted = insertField(word, hi, lo, value)
        expect(extractField(inserted, hi, lo)).toBe(value % 2 ** width)
      })
    )
  })
})
describe('arithmetic wraps mod 2^32', () => {
  test('add overflow wraps', () => {
    expect(addU32(TWO_POW_32 - 1, 1)).toBe(0)
    expect(addU32(2_147_483_648, 2_147_483_648)).toBe(0)
  })
  test('sub underflow wraps', () => {
    expect(subU32(0, 1)).toBe(TWO_POW_32 - 1)
  })
  test('property: (a + b) - b === a mod 2^32', () => {
    assert(
      property(u32arb(), u32arb(), (a, b) => {
        expect(subU32(addU32(a, b), b)).toBe(a)
      })
    )
  })
})
describe('shifts', () => {
  test('shl shamt mod 32', () => {
    expect(shlU32(1, 32)).toBe(1)
    expect(shlU32(1, 33)).toBe(2)
  })
  test('shr logical', () => {
    expect(shrU32(TWO_POW_32 - 1, 1)).toBe(2_147_483_647)
  })
  test('sar arithmetic preserves sign', () => {
    expect(sarS32(TWO_POW_32 - 1, 1)).toBe(-1)
    expect(sarS32(2_147_483_648, 31)).toBe(-1)
  })
})
describe('comparisons', () => {
  test('ltS32 treats high bit as sign', () => {
    expect(ltS32(TWO_POW_32 - 1, 1)).toBe(true)
    expect(ltU32(TWO_POW_32 - 1, 1)).toBe(false)
  })
  test('property: ltU32 totally orders U32', () => {
    assert(
      property(u32arb(), u32arb(), (a, b) => {
        if (a === b) {
          expect(ltU32(a, b)).toBe(false)
          expect(ltU32(b, a)).toBe(false)
        } else expect(ltU32(a, b)).not.toBe(ltU32(b, a))
      })
    )
  })
})
describe('popcount / parity / reverseBits32', () => {
  test('popcount edges', () => {
    expect(popcount(0)).toBe(0)
    expect(popcount(TWO_POW_32 - 1)).toBe(32)
    expect(popcount(2_863_311_530)).toBe(16)
  })
  test('parity matches popcount mod 2', () => {
    assert(
      property(u32arb(), v => {
        expect(parity(v)).toBe((popcount(v) % 2) as 0 | 1)
      })
    )
  })
  test('reverseBits32 is involutive', () => {
    assert(
      property(u32arb(), v => {
        expect(reverseBits32(reverseBits32(v))).toBe(v)
      })
    )
  })
})
describe('hex/bin codecs', () => {
  test('toHex32 / fromHex round-trip', () => {
    assert(
      property(u32arb(), v => {
        expect(fromHex(toHex32(v))).toBe(v)
      })
    )
  })
  test('toBin32 / fromBin round-trip', () => {
    assert(
      property(u32arb(), v => {
        expect(fromBin(toBin32(v))).toBe(v)
      })
    )
  })
})
describe('coercions', () => {
  test('toU32 / toS32', () => {
    expect(toU32(-1)).toBe(TWO_POW_32 - 1)
    expect(toS32(TWO_POW_32 - 1)).toBe(-1)
  })
})
describe('targeted mutation kills', () => {
  test('mask(33) saturates (>= 32 not > 32)', () => {
    expect(mask(33)).toBe(0xff_ff_ff_ff)
    expect(mask(32)).toBe(0xff_ff_ff_ff)
  })
  test('extractField width = hi-lo+1', () => {
    expect(extractField(0b1111_0000, 7, 4)).toBe(0b1111)
    expect(extractField(0b1010_0101, 7, 4)).toBe(0b1010)
  })
  test('sarS32 modulo (not multiply) shamt', () => {
    expect(sarS32(0x80_00_00_00, 1)).toBe(-1_073_741_824)
    expect(sarS32(0x80_00_00_00, 33)).toBe(-1_073_741_824)
  })
  test('ltS32 strict less', () => {
    expect(ltS32(1, 1)).toBe(false)
    expect(ltS32(0, 1)).toBe(true)
  })
  test('ltU32 strict less', () => {
    expect(ltU32(1, 1)).toBe(false)
    expect(ltU32(0, 1)).toBe(true)
  })
  test('toHex32 pads 0 not empty', () => {
    expect(toHex32(0)).toBe('0x00000000')
    expect(toHex32(0xff)).toBe('0x000000ff')
  })
  test('toBin32 pads 0 to length 32', () => {
    expect(toBin32(0)).toBe('0'.repeat(32))
    expect(toBin32(1)).toBe(`${'0'.repeat(31)}1`)
  })
  test('fromHex anchored regex strips only leading 0x', () => {
    expect(fromHex('0xff')).toBe(255)
    expect(fromHex('0XFF')).toBe(255)
  })
})
