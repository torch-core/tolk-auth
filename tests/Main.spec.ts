import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Opcodes, Main, ErrorCodes } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Role Authority Test', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Main');
    });

    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const RESET_ROLE = 0n;

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
        it('should set public capability and unset public capability', async () => {
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

            // Unset public capability
            const result2 = await main.sendSetPublicCapability(owner.getSender(), opcode, false);

            // Expect owner sends OP_SET_PUBLIC_CAPABILITY to main and success
            expect(result2.transactions).toHaveTransaction({
                from: owner.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_SET_PUBLIC_CAPABILITY,
            });

            // Get public capability
            const publicCapability2 = await main.getHasPublicCapability(opcode);

            // Expect public capability to be false
            expect(publicCapability2).toBe(false);
        });
        it('should set role capability and unset role capability', async () => {
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

            // Check Role capability
            const storage = await main.getStorage();
            expect(storage.rolesWithCapability.get(opcode)).toBe(1n << RESET_ROLE);

            // Unset role capability
            const result2 = await main.sendSetRoleCapability(owner.getSender(), RESET_ROLE, opcode, false);

            // Expect owner sends OP_SET_ROLE_CAPABILITY to main and success
            expect(result2.transactions).toHaveTransaction({
                from: owner.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_SET_ROLE_CAPABILITY,
            });

            // Get role capability
            const roleCapability2 = await main.getHasCapability(RESET_ROLE, opcode);

            // Expect role capability to be false
            expect(roleCapability2).toBe(false);

            // Check Role capability
            const storage2 = await main.getStorage();
            expect(storage2.rolesWithCapability.get(opcode)).toBe(0n);
        });
        it('should set user role and unset user role', async () => {
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

            // Check User role
            const storage = await main.getStorage();
            expect(storage.userRoles.get(maxey.address)).toBe(1n << RESET_ROLE);

            // Unset user role
            const result2 = await main.sendSetUserRole(owner.getSender(), maxey.address, RESET_ROLE, false);

            // Expect owner sends OP_SET_USER_ROLE to main and success
            expect(result2.transactions).toHaveTransaction({
                from: owner.address,
                to: main.address,
                success: true,
                op: Opcodes.OP_SET_USER_ROLE,
            });

            // Get maxey role
            const maxeyRole2 = await main.getHasRole(maxey.address, RESET_ROLE);

            // Expect maxey role to be false
            expect(maxeyRole2).toBe(false);

            // Check User role
            const storage2 = await main.getStorage();
            expect(storage2.userRoles.get(maxey.address)).toBe(0n);
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
                const counterBefore = await main.getCounter();

                const increaseBy = Math.floor(Math.random() * 100);

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

    describe('Complex bit mask verification tests', () => {
        // Helper functions for bit calculation verification
        const calculateRoleMask = (roles: bigint[]): bigint => {
            return roles.reduce((mask, role) => mask | (1n << role), 0n);
        };

        it('should correctly manage multiple roles for OP_RESET capability', async () => {
            const opcode = Opcodes.OP_RESET;
            const testRoles = [0n, 1n, 2n, 4n, 7n]; // Test various roles including edge cases
            let expectedMask = 0n;

            // Add roles one by one and verify bit mask
            for (const role of testRoles) {
                await main.sendSetRoleCapability(owner.getSender(), role, opcode, true);
                expectedMask |= 1n << role;

                const storage = await main.getStorage();
                const actualMask = storage.rolesWithCapability.get(opcode) || 0;

                expect(actualMask).toBe(expectedMask);
                expect(await main.getHasCapability(role, opcode)).toBe(true);
            }

            // Verify all roles are set correctly
            const finalExpectedMask = calculateRoleMask(testRoles);
            expect((await main.getStorage()).rolesWithCapability.get(opcode)).toBe(finalExpectedMask);

            // Remove roles one by one and verify bit mask
            for (const role of testRoles) {
                await main.sendSetRoleCapability(owner.getSender(), role, opcode, false);
                expectedMask &= ~(1n << role);

                const storage = await main.getStorage();
                const actualMask = storage.rolesWithCapability.get(opcode);

                expect(actualMask).toBe(expectedMask);
                expect(await main.getHasCapability(role, opcode)).toBe(false);
            }

            // Final mask should be 0
            expect((await main.getStorage()).rolesWithCapability.get(opcode)).toBe(0n);
        });

        it('should correctly manage multiple roles for single user', async () => {
            const testUser = maxey.address;
            const testRoles = [1n, 2n, 5n, 10n, 50n, 100n, 200n, 255n]; // Test diverse roles including edge cases
            let expectedUserMask = 0n;

            // Add multiple roles to same user
            for (const role of testRoles) {
                await main.sendSetUserRole(owner.getSender(), testUser, role, true);
                expectedUserMask |= 1n << role;

                const storage = await main.getStorage();
                expect(storage.userRoles.get(testUser)).toBe(expectedUserMask);
                expect(await main.getHasRole(testUser, role)).toBe(true);
            }

            // Remove roles one by one and verify user mask
            for (const role of testRoles) {
                await main.sendSetUserRole(owner.getSender(), testUser, role, false);
                expectedUserMask &= ~(1n << role);

                const storage = await main.getStorage();
                const actualUserMask = storage.userRoles.get(testUser);

                expect(actualUserMask).toBe(expectedUserMask);
                expect(await main.getHasRole(testUser, role)).toBe(false);
            }

            // Final mask should be 0
            expect((await main.getStorage()).userRoles.get(testUser)).toBe(0n);
        });

        it('should handle all 256 roles edge case testing', async () => {
            const opcode = Opcodes.OP_INCREASE;

            // Add all 256 roles (0-255)
            for (let role = 0n; role < 256n; role++) {
                await main.sendSetRoleCapability(owner.getSender(), role, opcode, true);
            }

            // Should have all bits set (2^256 - 1)
            const storage = await main.getStorage();
            const maxValue = (1n << 256n) - 1n;
            expect(storage.rolesWithCapability.get(opcode)).toBe(maxValue);

            // Verify some sample roles
            const sampleRoles = [0n, 1n, 127n, 128n, 254n, 255n];
            for (const role of sampleRoles) {
                expect(await main.getHasCapability(role, opcode)).toBe(true);
            }

            // Remove even numbered roles (0, 2, 4, 6, ..., 254)
            for (let role = 0n; role < 256n; role += 2n) {
                await main.sendSetRoleCapability(owner.getSender(), role, opcode, false);
            }

            // Should have odd roles remaining (1, 3, 5, 7, ..., 255)
            const storageAfterEvenRemoval = await main.getStorage();
            // Calculate expected value: sum of 2^i where i is odd from 1 to 255
            let expectedOddMask = 0n;
            for (let i = 1n; i < 256n; i += 2n) {
                expectedOddMask |= 1n << i;
            }
            expect(storageAfterEvenRemoval.rolesWithCapability.get(opcode)).toBe(expectedOddMask);

            // Verify remaining odd roles
            const sampleOddRoles = [1n, 3n, 5n, 127n, 129n, 255n];
            for (const role of sampleOddRoles) {
                expect(await main.getHasCapability(role, opcode)).toBe(true);
            }

            // Verify removed even roles
            const sampleEvenRoles = [0n, 2n, 4n, 126n, 128n, 254n];
            for (const role of sampleEvenRoles) {
                expect(await main.getHasCapability(role, opcode)).toBe(false);
            }
        });

        it('should handle random fuzzing operations', async () => {
            const opcodes = [Opcodes.OP_INCREASE, Opcodes.OP_RESET];
            const users = [
                maxey.address,
                (await blockchain.treasury('user2')).address,
                (await blockchain.treasury('user3')).address,
            ];
            const numOperations = 50; // Number of random operations to perform

            // Track expected state
            let expectedOpcodeRoles = { [opcodes[0]]: 0n, [opcodes[1]]: 0n };
            let expectedUserRoles: { [key: string]: bigint } = {};

            // Initialize expected user roles
            for (const user of users) {
                expectedUserRoles[user.toString()] = 0n;
            }

            // Generate and execute random operations
            for (let i = 0; i < numOperations; i++) {
                const operationType = Math.random() < 0.5 ? 'roleCapability' : 'userRole';
                const role = BigInt(Math.floor(Math.random() * 8)); // Random role 0-7
                const opcode = opcodes[Math.floor(Math.random() * opcodes.length)];
                const user = users[Math.floor(Math.random() * users.length)];
                const enabled = Math.random() < 0.5;

                if (operationType === 'roleCapability') {
                    await main.sendSetRoleCapability(owner.getSender(), role, opcode, enabled);

                    if (enabled) {
                        expectedOpcodeRoles[opcode] |= 1n << role;
                    } else {
                        expectedOpcodeRoles[opcode] &= ~(1n << role);
                    }
                } else {
                    await main.sendSetUserRole(owner.getSender(), user, role, enabled);

                    const userKey = user.toString();
                    if (enabled) {
                        expectedUserRoles[userKey] |= 1n << role;
                    } else {
                        expectedUserRoles[userKey] &= ~(1n << role);
                    }
                }

                // Randomly verify state (not after every operation to speed up test)
                if (i % 10 === 0 || i === numOperations - 1) {
                    const storage = await main.getStorage();

                    // Verify opcode roles
                    for (const testOpcode of opcodes) {
                        const actualMask = storage.rolesWithCapability.get(testOpcode) || 0n;
                        expect(actualMask).toBe(expectedOpcodeRoles[testOpcode]);
                    }

                    // Verify user roles
                    for (const testUser of users) {
                        const actualUserMask = storage.userRoles.get(testUser) || 0n;
                        expect(actualUserMask).toBe(expectedUserRoles[testUser.toString()]);
                    }
                }
            }
        });

        it('should reject invalid role 256 (out of bounds)', async () => {
            const opcode = Opcodes.OP_INCREASE;
            const invalidRole = 256n; // Should be out of bounds for 256-bit mask (valid range: 0-255)

            // Attempt to set role capability for invalid role 256
            await expect(async () => {
                await main.sendSetRoleCapability(owner.getSender(), invalidRole, opcode, true);
            }).rejects.toThrow('bitLength is too small for a value 256');

            // Attempt to assign invalid role 256 to user
            await expect(async () => {
                await main.sendSetUserRole(owner.getSender(), maxey.address, invalidRole, true);
            }).rejects.toThrow('bitLength is too small for a value 256');
        });
    });
});
