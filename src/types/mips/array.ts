import type { AddressFormat, ArrayLengthMode } from '../memory';
import type { RegisterNumber } from './register';

export type MipsArrayDefinitionDraft = {
    name: string;
    addressMode: 'fixed' | 'after-previous';
    baseAddress: string;
    lengthMode: ArrayLengthMode;
    length: string;
    addressFormat: AddressFormat;
    baseAddressRegister: RegisterNumber;
    lengthRegister: RegisterNumber;
    valuePattern: string;
};
