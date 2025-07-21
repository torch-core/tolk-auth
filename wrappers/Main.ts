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
import {
    COUNTER_SIZE,
    ID_SIZE,
    OPCODE_SIZE,
    QUERY_ID_SIZE,
    ROLE_ID_SIZE,
    ROLE_MASK_SIZE,
    TIMESTAMP_SIZE,
} from './constants/size';

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

export interface OwnerInfo {
    owner: Address;
    pendingOwner: Address | null;
    proposeTime: number;
    timelockPeriod: number;
}

export interface MainStorage {
    id: number;
    counter: number;
    ownerInfo: OwnerInfo;
    isCapabilityPublic: Dictionary<number, boolean>;
    rolesWithCapability: Dictionary<number, bigint>;
    userRoles: Dictionary<Address, bigint>;
}

export const Roles = {
    RESET: 0n,
};

export const Opcodes = {
    INCREASE: 0x7e8764ef,
    RESET: 0x3a752f06,
    SET_USER_ROLE: 0xdd28b73e,
    SET_ROLE_CAPABILITY: 0xc6012bd0,
    SET_PUBLIC_CAPABILITY: 0x714a73bb,
    PROPOSE_OWNERSHIP: 0x9c25dd71,
    CLAIM_OWNERSHIP: 0xb835b5cb,
    REVOKE_PENDING_OWNERSHIP: 0x3d89e313,
};

export const Topics = {
    PUBLIC_CAPABILITY_UPDATED: BigInt(0xd213468c),
    ROLE_CAPABILITY_UPDATED: BigInt(0x6aa264fa),
    USER_ROLE_UPDATED: BigInt(0x31322498),
    OWNERSHIP_PROPOSED: BigInt(0x261921b7),
    OWNERSHIP_CLAIMED: BigInt(0x5aab7991),
    OWNERSHIP_REVOKED: BigInt(0x4f2bd7df),
};

export const ErrorCodes = {
    NOT_AUTHORIZED: 1000,
    NOT_PENDING_OWNER: 1001,
    CLAIM_TOO_EARLY: 1002,
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
                .storeUint(opcode, OPCODE_SIZE)
                .storeUint(role, ROLE_ID_SIZE)
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

    static createProposeOwnershipArg(newOwner: Address, queryID?: bigint) {
        return {
            value: toNano('0.03'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.PROPOSE_OWNERSHIP, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeAddress(newOwner)
                .endCell(),
        };
    }

    static createClaimOwnershipArg(queryID?: bigint) {
        return {
            value: toNano('0.03'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.CLAIM_OWNERSHIP, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .endCell(),
        };
    }

    static createRevokePendingOwnershipArg(queryID?: bigint) {
        return {
            value: toNano('0.03'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.REVOKE_PENDING_OWNERSHIP, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
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

    async sendProposeOwnership(provider: ContractProvider, via: Sender, newOwner: Address, queryID?: bigint) {
        await provider.internal(via, Main.createProposeOwnershipArg(newOwner, queryID));
    }

    async sendClaimOwnership(provider: ContractProvider, via: Sender, queryID?: bigint) {
        await provider.internal(via, Main.createClaimOwnershipArg(queryID));
    }

    async sendRevokePendingOwnership(provider: ContractProvider, via: Sender, queryID?: bigint) {
        await provider.internal(via, Main.createRevokePendingOwnershipArg(queryID));
    }

    async getCounter(provider: ContractProvider) {
        const result = await provider.get('currentCounter', []);
        return result.stack.readNumber();
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('initialId', []);
        return result.stack.readNumber();
    }

    async getPublicCapability(provider: ContractProvider, opcode: number) {
        const result = await provider.get('publicCapability', [
            {
                type: 'int',
                value: BigInt(opcode),
            },
        ]);
        return result.stack.readBoolean();
    }

    async getRoleHasCapability(provider: ContractProvider, role: bigint, opcode: number) {
        const result = await provider.get('roleHasCapability', [
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

    async getUserHasRole(provider: ContractProvider, user: Address, role: bigint) {
        const result = await provider.get('userHasRole', [
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

    async getOwnerInfo(provider: ContractProvider): Promise<OwnerInfo> {
        const result = await provider.get('ownerInfo', []);
        const owner = result.stack.readAddress();
        const pendingOwner = result.stack.readAddressOpt();
        const timelockPeriod = result.stack.readNumber();
        const proposeTime = result.stack.readNumber();
        return { owner, pendingOwner, proposeTime, timelockPeriod };
    }

    async getStorage(provider: ContractProvider): Promise<MainStorage> {
        const { state } = await provider.getState();
        if (state.type !== 'active' || !state.code || !state.data) {
            throw new Error('Main Contract is not active');
        }
        const storageBoc = Cell.fromBoc(state.data)[0];
        if (!storageBoc) {
            throw new Error('Main Contract is not initialized');
        }
        const storageSlice = storageBoc.beginParse();
        const id = storageSlice.loadUint(ID_SIZE);
        const counter = storageSlice.loadUint(COUNTER_SIZE);
        const authSlice = storageSlice.loadRef().beginParse();
        const owner = authSlice.loadAddress();
        const pendingOwner = authSlice.loadMaybeAddress();
        const timelockPeriod = authSlice.loadUint(TIMESTAMP_SIZE);
        const proposeTime = authSlice.loadUint(TIMESTAMP_SIZE);
        const ownerInfo: OwnerInfo = { owner, pendingOwner, proposeTime, timelockPeriod };
        const isCapabilityPublic = authSlice.loadDict(Dictionary.Keys.Uint(OPCODE_SIZE), Dictionary.Values.Bool());
        const rolesWithCapability = authSlice.loadDict(
            Dictionary.Keys.Uint(OPCODE_SIZE),
            Dictionary.Values.BigUint(256),
        );
        const userRoles = authSlice.loadDict(Dictionary.Keys.Address(), Dictionary.Values.BigUint(ROLE_MASK_SIZE));

        return { id, counter, ownerInfo, isCapabilityPublic, rolesWithCapability, userRoles };
    }
}
