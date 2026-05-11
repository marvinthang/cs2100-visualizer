export type DatapathInspectID =
    | 'PC'
    | 'INSTRUCTION_MEMORY'
    | 'INSTRUCTION_REGISTER'
    | 'REGISTER_FILE'
    | 'REGDST_MUX'
    | 'ALUSRC_MUX'
    | 'MEMTOREG_MUX'
    | 'PCSRC_MUX'
    | 'SIGN_EXTEND'
    | 'LEFT_SHIFT_2'
    | 'ADD4'
    | 'BRANCH_ADDER'
    | 'ALU'
    | 'DATA_MEMORY';

export type DatapathInspectInfo = {
    id: DatapathInspectID;
    title: string;
    subtitle: string;
    rows: {
        label: string;
        value: string;
    }[];
};
