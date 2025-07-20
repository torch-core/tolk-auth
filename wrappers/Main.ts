import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';
import { OPCODE_SIZE, QUERY_ID_SIZE } from './constants/size';

export type MainConfig = {
    id: number;
    counter: number;
    owner: Address;
};

export function mainConfigToCell(config: MainConfig): Cell {
    return beginCell()
        .storeUint(config.id, 32)
        .storeUint(config.counter, 32)
        .storeRef(beginCell().storeAddress(config.owner).storeDict(null).storeDict(null).storeDict(null).endCell())
        .endCell();
}

export const Opcodes = {
    OP_INCREASE: 0x7e8764ef,
    OP_RESET: 0x3a752f06,
    OP_SET_USER_ROLE: 0xdd28b73e,
    OP_SET_ROLE_CAPABILITY: 0xc6012bd0,
    OP_SET_PUBLIC_CAPABILITY: 0x714a73bb,
    OP_TRANSFER_OWNERSHIP: 0x7bb334c7,
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
                .storeUint(Opcodes.OP_INCREASE, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.increaseBy, 32)
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
                .storeUint(Opcodes.OP_RESET, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .endCell(),
        });
    }

    async sendSetUserRole(
        provider: ContractProvider,
        via: Sender,
        user: Address,
        role: bigint,
        enabled: boolean,
        queryID?: bigint,
    ) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_SET_USER_ROLE, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeAddress(user)
                .storeUint(role, 8)
                .storeBit(enabled)
                .endCell(),
        });
    }

    async sendSetRoleCapability(
        provider: ContractProvider,
        via: Sender,
        role: bigint,
        opcode: number,
        enabled: boolean,
        queryID?: bigint,
    ) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_SET_ROLE_CAPABILITY, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeUint(role, 8)
                .storeUint(opcode, OPCODE_SIZE)
                .storeBit(enabled)
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
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_SET_PUBLIC_CAPABILITY, OPCODE_SIZE)
                .storeUint(queryID ?? 0n, QUERY_ID_SIZE)
                .storeUint(opcode, OPCODE_SIZE)
                .storeBit(enabled)
                .endCell(),
        });
    }

    async sendTransferOwnerShip(provider: ContractProvider, via: Sender, newOwner: Address, queryID?: bigint) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_TRANSFER_OWNERSHIP, OPCODE_SIZE)
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
}
