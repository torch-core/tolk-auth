import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Opcodes, Main } from '../wrappers/Main';
import '@ton/test-utils';
import { createTestEnvironment } from './helper/setup';

describe('Complex bit mask verification tests', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const { getTestContext, resetToInitSnapshot } = createTestEnvironment();

    beforeEach(async () => {
        await resetToInitSnapshot();
        ({ blockchain, owner, maxey, main } = getTestContext());
    });

    // Helper functions for bit calculation verification
    const calculateRoleMask = (roles: bigint[]): bigint => {
        return roles.reduce((mask, role) => mask | (1n << role), 0n);
    };

    it('should correctly manage multiple roles for OP_RESET capability', async () => {
        const opcode = Opcodes.RESET;
        const testRoles = [0n, 1n, 2n, 4n, 7n]; // Test various roles including edge cases
        let expectedMask = 0n;

        // Add roles one by one and verify bit mask
        for (const role of testRoles) {
            await main.sendSetRoleCapability(owner.getSender(), role, opcode, true);
            expectedMask |= 1n << role;

            const storage = await main.getStorage();
            const actualMask = storage.rolesWithCapability.get(opcode) || 0;

            expect(actualMask).toBe(expectedMask);
            expect(await main.getRoleHasCapability(role, opcode)).toBe(true);
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
            expect(await main.getRoleHasCapability(role, opcode)).toBe(false);
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
            expect(await main.getUserHasRole(testUser, role)).toBe(true);
        }

        // Remove roles one by one and verify user mask
        for (const role of testRoles) {
            await main.sendSetUserRole(owner.getSender(), testUser, role, false);
            expectedUserMask &= ~(1n << role);

            const storage = await main.getStorage();
            const actualUserMask = storage.userRoles.get(testUser);

            expect(actualUserMask).toBe(expectedUserMask);
            expect(await main.getUserHasRole(testUser, role)).toBe(false);
        }

        // Final mask should be 0
        expect((await main.getStorage()).userRoles.get(testUser)).toBe(0n);
    });

    it('should handle all 256 roles edge case testing', async () => {
        const opcode = Opcodes.INCREASE;

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
            expect(await main.getRoleHasCapability(role, opcode)).toBe(true);
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
            expect(await main.getRoleHasCapability(role, opcode)).toBe(true);
        }

        // Verify removed even roles
        const sampleEvenRoles = [0n, 2n, 4n, 126n, 128n, 254n];
        for (const role of sampleEvenRoles) {
            expect(await main.getRoleHasCapability(role, opcode)).toBe(false);
        }
    });

    it('should handle random fuzzing operations', async () => {
        const opcodes = [Opcodes.INCREASE, Opcodes.RESET];
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
        const opcode = Opcodes.INCREASE;
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
