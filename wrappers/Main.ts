import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';
import { COUNTER_SIZE, ID_SIZE, OPCODE_SIZE, QUERY_ID_SIZE, ROLE_ID_SIZE, ROLE_MASK_SIZE, TIMESTAMP_SIZE } from './constants/size';

export type MainConfig = {
    id: number;
    counter: number;
    owner: Address;
    timelockPeriod: number;
};

export function mainConfigToCell(config: MainConfig): Cell {
    return beginCell()
        .storeUint(config.id, ID_SIZE)
        .storeUint(config.counter, COUNTER_SIZE)
        .storeRef(
            beginCell()
                .storeAddress(config.owner)
                .storeAddress(null) // pendingOwner
                .storeUint(config.timelockPeriod, TIMESTAMP_SIZE)
                .storeUint(0, TIMESTAMP_SIZE) // proposeTime
                .storeDict(null) // isCapabilityPublic
                .storeDict(null) // rolesWithCapability
                .storeDict(null) // userRoles
                .endCell(),
        )
        .endCell();
}

export type MainStorage = {
    id: number;
    counter: number;
    owner: Address;
    userRoles: Dictionary<Address, bigint>;
    rolesWithCapability: Dictionary<bigint, bigint>;
};

export const Roles = {
    RESET: 0n,
};

export const Opcodes = {
    INCREASE: 0x7e8764ef,
    RESET: 0x3a752f06,
    SET_USER_ROLE: 0xdd28b73e,
    SET_ROLE_CAPABILITY: 0xc6012bd0,
    SET_PUBLIC_CAPABILITY: 0x714a73bb,
    TRANSFER_OWNERSHIP: 0x7bb334c7,
};

export const Topics = {
    PUBLIC_CAPABILITY_UPDATED: BigInt(0xd213468c),
    ROLE_CAPABILITY_UPDATED: BigInt(0x6aa264fa),
    USER_ROLE_UPDATED: BigInt(0x31322498),
    OWNERSHIP_TRANSFERRED: BigInt(0x45b9ecc7),
};

export const ErrorCodes = {
    NOT_AUTHORIZED: 1000,
};

export class Main implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Main(address);
    }

    static createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
        const data = mainConfigToCell(config);
        const init = { code, data };
        return new Main(contractAddress(workchain, init), init);
    }

    static createSetPublicCapabilityArg(opcode: number, enabled: boolean, queryID?: bigint) {
        return {
            value: toNano('0.03'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.SET_PUBLIC_CAPABILITY, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeUint(opcode, OPCODE_SIZE)
                .storeBit(enabled)
                .endCell(),
        };
    }

    static createSetRoleCapabilityArg(role: bigint, opcode: number, enabled: boolean, queryID?: bigint) {
        return {
            value: toNano('0.03'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.SET_ROLE_CAPABILITY, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeUint(role, ROLE_ID_SIZE)
                .storeUint(opcode, OPCODE_SIZE)
                .storeBit(enabled)
                .endCell(),
        };
    }

    static createSetUserRoleArg(user: Address, role: bigint, enabled: boolean, queryID?: bigint) {
        return {
            value: toNano('0.03'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.SET_USER_ROLE, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeAddress(user)
                .storeUint(role, ROLE_ID_SIZE)
                .storeBit(enabled)
                .endCell(),
        };
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrease(
        provider: ContractProvider,
        via: Sender,
        opts: {
            increaseBy: number;
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.INCREASE, OPCODE_SIZE)
                .storeUint(opts.queryID ?? 0, QUERY_ID_SIZE)
                .storeUint(opts.increaseBy, COUNTER_SIZE)
                .endCell(),
        });
    }

    async sendReset(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.RESET, OPCODE_SIZE)
                .storeUint(opts.queryID ?? 0, QUERY_ID_SIZE)
                .endCell(),
        });
    }

    async sendSetPublicCapability(
        provider: ContractProvider,
        via: Sender,
        opcode: number,
        enabled: boolean,
        queryID?: bigint,
    ) {
        await provider.internal(via, Main.createSetPublicCapabilityArg(opcode, enabled, queryID));
    }

    async sendSetRoleCapability(
        provider: ContractProvider,
        via: Sender,
        role: bigint,
        opcode: number,
        enabled: boolean,
        queryID?: bigint,
    ) {
        await provider.internal(via, Main.createSetRoleCapabilityArg(role, opcode, enabled, queryID));
    }

    async sendSetUserRole(
        provider: ContractProvider,
        via: Sender,
        user: Address,
        role: bigint,
        enabled: boolean,
        queryID?: bigint,
    ) {
        await provider.internal(via, Main.createSetUserRoleArg(user, role, enabled, queryID));
    }

    async sendTransferOwnerShip(provider: ContractProvider, via: Sender, newOwner: Address, queryID?: bigint) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.TRANSFER_OWNERSHIP, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeAddress(newOwner)
                .endCell(),
        });
    }

    async getCounter(provider: ContractProvider) {
        const result = await provider.get('currentCounter', []);
        return result.stack.readNumber();
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('initialId', []);
        return result.stack.readNumber();
    }

    async getHasPublicCapability(provider: ContractProvider, opcode: number) {
        const result = await provider.get('hasPublicCapability', [
            {
                type: 'int',
                value: BigInt(opcode),
            },
        ]);
        return result.stack.readBoolean();
    }

    async getHasCapability(provider: ContractProvider, role: bigint, opcode: number) {
        const result = await provider.get('hasCapability', [
            {
                type: 'int',
                value: role,
            },
            {
                type: 'int',
                value: BigInt(opcode),
            },
        ]);
        return result.stack.readBoolean();
    }

    async getHasRole(provider: ContractProvider, user: Address, role: bigint) {
        const result = await provider.get('hasRole', [
            {
                type: 'slice',
                cell: beginCell().storeAddress(user).endCell(),
            },
            {
                type: 'int',
                value: role,
            },
        ]);
        return result.stack.readBoolean();
    }

    async getOwner(provider: ContractProvider) {
        const result = await provider.get('owner', []);
        return result.stack.readAddress();
    }

    async getStorage(provider: ContractProvider) {
        const { state } = await provider.getState();
        if (state.type !== 'active' || !state.code || !state.data) {
            throw new Error('tgUSDEngine is not active');
        }
        const storageBoc = Cell.fromBoc(state.data)[0];
        if (!storageBoc) {
            throw new Error('Main is not initialized');
        }
        const storageSlice = storageBoc.beginParse();
        const id = storageSlice.loadUint(ID_SIZE);
        const counter = storageSlice.loadUint(COUNTER_SIZE);
        const authSlice = storageSlice.loadRef().beginParse();
        const owner = authSlice.loadAddress();
        const isCapabilityPublic = authSlice.loadDict(Dictionary.Keys.Uint(OPCODE_SIZE), Dictionary.Values.Bool());
        const rolesWithCapability = authSlice.loadDict(
            Dictionary.Keys.Uint(OPCODE_SIZE),
            Dictionary.Values.BigUint(256),
        );
        const userRoles = authSlice.loadDict(Dictionary.Keys.Address(), Dictionary.Values.BigUint(ROLE_MASK_SIZE));

        return { id, counter, owner, userRoles, rolesWithCapability, isCapabilityPublic };
    }
}
