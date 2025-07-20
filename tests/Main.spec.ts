import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Opcodes, Main, ErrorCodes } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Test', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Main');
    });

    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const RESET_ROLE = 1n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('deployer');
        maxey = await blockchain.treasury('maxey');

        main = blockchain.openContract(
            Main.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                    owner: owner.address,
                },
                code,
            ),
        );

        const deployResult = await main.sendDeploy(owner.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    describe('Basic Role Authority tests', () => {
        it('should set role capability', async () => {
            // Set RESET_ROLE to have OP_RESET capability
            const opcode = Opcodes.OP_RESET;
            const result = await main.sendSetRoleCapability(owner.getSender(), RESET_ROLE, opcode, true);

            // Expect owner sends OP_SET_ROLE_CAPABILITY to main and success
            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_SET_ROLE_CAPABILITY,
            });

            // Get role capability
            const roleCapability = await main.getHasCapability(RESET_ROLE, opcode);

            // Expect role capability to be true
            expect(roleCapability).toBe(true);
        });

        it('should set user role', async () => {
            // Set maxey to have RESET_ROLE
            const result = await main.sendSetUserRole(owner.getSender(), maxey.address, RESET_ROLE, true);

            // Expect owner sends OP_SET_maxey_ROLE to main and success
            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_SET_USER_ROLE,
            });

            // Get maxey role
            const maxeyRole = await main.getHasRole(maxey.address, RESET_ROLE);

            // Expect maxey role to be true
            expect(maxeyRole).toBe(true);
        });

        it('should set public capability', async () => {
            // Set OP_INCREASE as public
            const opcode = Opcodes.OP_INCREASE;
            const result = await main.sendSetPublicCapability(owner.getSender(), opcode, true);

            // Expect owner sends OP_SET_PUBLIC_CAPABILITY to main and success
            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_SET_PUBLIC_CAPABILITY,
            });

            // Get public capability
            const publicCapability = await main.getHasPublicCapability(opcode);

            // Expect public capability to be true
            expect(publicCapability).toBe(true);
        });

        it('should transfer ownership', async () => {
            // Create new owner
            const newOwner = await blockchain.treasury('newOwner');

            // Transfer ownership to new owner
            const result = await main.sendTransferOwnerShip(owner.getSender(), newOwner.address);

            // Expect owner sends OP_TRANSFER_OWNERSHIP to main and success
            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_TRANSFER_OWNERSHIP,
            });

            // Get current owner
            const currentOwner = await main.getOwner();

            // Expect current owner to be new owner
            expect(currentOwner.equals(newOwner.address)).toBeTruthy();
        });
    });

    describe('Public Capability tests', () => {
        it('should increase counter after setting public capability', async () => {
            // Set increase opcode as public
            await main.sendSetPublicCapability(owner.getSender(), Opcodes.OP_INCREASE, true);

            // Get counter before
            const counterBefore = await main.getCounter();

            // increase counter
            const increaseResult = await main.sendIncrease(maxey.getSender(), {
                increaseBy: 1,
                value: toNano('0.05'),
            });

            // Expect maxey sends OP_INCREASE to main and success
            expect(increaseResult.transactions).toHaveTransaction({
                from: maxey.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_INCREASE,
            });

            // Get counter after
            const counterAfter = await main.getCounter();

            // Expect counter to be increased by 1
            expect(counterAfter).toBe(counterBefore + 1);
        });

        it('should throw when increasing counter is not public', async () => {
            // maxey try to increase counter
            const result = await main.sendIncrease(maxey.getSender(), {
                increaseBy: 1,
                value: toNano('0.05'),
            });

            // Expect maxey sends OP_INCREASE to main and exit with NOT_AUTHORIZED
            expect(result.transactions).toHaveTransaction({
                from: maxey.address,
                to: main.address,
                success: false,
                op: Opcodes.OP_INCREASE,
                exitCode: ErrorCodes.NOT_AUTHORIZED,
            });
        });
    });

    describe('Set Role Capability and User Role tests', () => {
        it('should reset counter after setting role capability and user role', async () => {
            // Owner increase counter
            await main.sendIncrease(owner.getSender(), {
                increaseBy: 1,
                value: toNano('0.05'),
            });

            // Get counter before
            const counterBefore = await main.getCounter();

            // Expect counter to be 1
            expect(counterBefore).toBe(1);

            // Set reset opcode as public
            await main.sendSetRoleCapability(owner.getSender(), RESET_ROLE, Opcodes.OP_RESET, true);

            // Set maxey to have RESET_ROLE
            await main.sendSetUserRole(owner.getSender(), maxey.address, RESET_ROLE, true);

            // Reset counter
            const resetResult = await main.sendReset(maxey.getSender(), {
                value: toNano('0.05'),
            });

            // Expect maxey sends OP_RESET to main and success
            expect(resetResult.transactions).toHaveTransaction({
                from: maxey.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_RESET,
            });

            // Get counter after reset
            const counterAfterReset = await main.getCounter();

            // Expect counter to be 0
            expect(counterAfterReset).toBe(0);
        });
        it('should throw when reset counter before setting role capability and user role', async () => {
            // maxey try to reset counter
            const result = await main.sendReset(maxey.getSender(), {
                value: toNano('0.05'),
            });

            // Expect maxey sends OP_RESET to main and exit with NOT_AUTHORIZED
            expect(result.transactions).toHaveTransaction({
                from: maxey.address,
                to: main.address,
                success: false,
                op: Opcodes.OP_RESET,
                exitCode: ErrorCodes.NOT_AUTHORIZED,
            });
        });
    });

    describe('Owner role tests', () => {
        it('should owner increase counter without role capability and user role', async () => {
            const increaseTimes = 3;
            for (let i = 0; i < increaseTimes; i++) {
                console.log(`increase ${i + 1}/${increaseTimes}`);

                const counterBefore = await main.getCounter();

                console.log('counter before increasing', counterBefore);

                const increaseBy = Math.floor(Math.random() * 100);

                console.log('increasing by', increaseBy);

                const increaseResult = await main.sendIncrease(owner.getSender(), {
                    increaseBy,
                    value: toNano('0.05'),
                });

                expect(increaseResult.transactions).toHaveTransaction({
                    from: owner.address,
                    to: main.address,
                    success: true,
                });

                const counterAfter = await main.getCounter();

                console.log('counter after increasing', counterAfter);

                expect(counterAfter).toBe(counterBefore + increaseBy);
            }
        });

        it('should owner reset counter without role capability and user role', async () => {
            expect(await main.getCounter()).toBe(0);

            const increaseBy = 5;
            await main.sendIncrease(owner.getSender(), {
                increaseBy,
                value: toNano('0.05'),
            });

            expect(await main.getCounter()).toBe(increaseBy);

            await main.sendReset(owner.getSender(), {
                value: toNano('0.05'),
            });

            expect(await main.getCounter()).toBe(0);
        });
    });
});
