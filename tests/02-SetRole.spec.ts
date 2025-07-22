import { SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Opcodes, Main, ErrorCodes, Roles } from '../wrappers/Main';
import '@ton/test-utils';
import { createTestEnvironment } from './helper/setup';
import { expectRoleCapabilityEmitLog, expectUserRoleEmitLog } from './helper/log';

describe('Set Role Capability and User Role tests', () => {
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const { getTestContext, resetToSnapshot } = createTestEnvironment();
    beforeEach(async () => {
        await resetToSnapshot();
        ({ owner, maxey, main } = getTestContext());
    });

    it('should set role capability and unset role capability', async () => {
        // Set RESET_ROLE to have OP_RESET capability
        const opcode = Opcodes.RESET;
        const setRoleResult = await main.sendSetRoleCapability(owner.getSender(), Roles.RESET, opcode, true);

        // Expect owner sends OP_SET_ROLE_CAPABILITY to main and success
        expect(setRoleResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.SET_ROLE_CAPABILITY,
        });

        // Get role capability
        const roleCapability = await main.getRoleHasCapability(Roles.RESET, opcode);

        // Expect role capability to be true
        expect(roleCapability).toBe(true);

        // Check Role capability
        const storage = await main.getStorage();
        expect(storage.rolesWithCapability.get(opcode)).toBe(1n << Roles.RESET);

        // Check emit role capability
        expectRoleCapabilityEmitLog(setRoleResult, Roles.RESET, opcode, true);

        // Unset role capability
        const unsetRoleResult = await main.sendSetRoleCapability(owner.getSender(), Roles.RESET, opcode, false);

        // Expect owner sends OP_SET_ROLE_CAPABILITY to main and success
        expect(unsetRoleResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.SET_ROLE_CAPABILITY,
        });

        // Get role capability
        const roleCapability2 = await main.getRoleHasCapability(Roles.RESET, opcode);

        // Expect role capability to be false
        expect(roleCapability2).toBe(false);

        // Check Role capability
        const storage2 = await main.getStorage();
        expect(storage2.rolesWithCapability.get(opcode)).toBe(0n);

        // Check emit role capability
        expectRoleCapabilityEmitLog(unsetRoleResult, Roles.RESET, opcode, false);
    });

    it('should set user role and unset user role', async () => {
        // Set maxey to have RESET_ROLE
        const setUserRoleResult = await main.sendSetUserRole(owner.getSender(), maxey.address, Roles.RESET, true);

        // Expect owner sends OP_SET_maxey_ROLE to main and success
        expect(setUserRoleResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.SET_USER_ROLE,
        });

        // Get maxey role
        const maxeyRole = await main.getUserHasRole(maxey.address, Roles.RESET);

        // Expect maxey role to be true
        expect(maxeyRole).toBe(true);

        // Check User role
        const storage = await main.getStorage();
        expect(storage.userRoles.get(maxey.address)).toBe(1n << Roles.RESET);

        // Check emit user role
        expectUserRoleEmitLog(setUserRoleResult, maxey.address, Roles.RESET, true);

        // Unset user role
        const unsetUserRoleResult = await main.sendSetUserRole(owner.getSender(), maxey.address, Roles.RESET, false);

        // Expect owner sends OP_SET_USER_ROLE to main and success
        expect(unsetUserRoleResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.SET_USER_ROLE,
        });

        // Get maxey role
        const maxeyRole2 = await main.getUserHasRole(maxey.address, Roles.RESET);

        // Expect maxey role to be false
        expect(maxeyRole2).toBe(false);

        // Check User role
        const storage2 = await main.getStorage();
        expect(storage2.userRoles.get(maxey.address)).toBe(0n);

        // Check emit user role
        expectUserRoleEmitLog(unsetUserRoleResult, maxey.address, Roles.RESET, false);
    });
    it('should reset counter after setting role capability and user role', async () => {
        // Owner increase counter
        await main.sendIncrease(owner.getSender(), 1);

        // Get counter before
        const counterBefore = await main.getCounter();

        // Expect counter to be 1
        expect(counterBefore).toBe(1);

        // Set reset opcode as public
        await main.sendSetRoleCapability(owner.getSender(), Roles.RESET, Opcodes.RESET, true);

        // Set maxey to have RESET_ROLE
        await main.sendSetUserRole(owner.getSender(), maxey.address, Roles.RESET, true);

        // Reset counter
        const resetResult = await main.sendReset(maxey.getSender());

        // Expect maxey sends OP_RESET to main and success
        expect(resetResult.transactions).toHaveTransaction({
            from: maxey.address,
            to: main.address,
            success: true,
            op: Opcodes.RESET,
        });

        // Get counter after reset
        const counterAfterReset = await main.getCounter();

        // Expect counter to be 0
        expect(counterAfterReset).toBe(0);
    });
    it('should throw when reset counter before setting role capability and user role', async () => {
        // maxey try to reset counter
        const resetResult = await main.sendReset(maxey.getSender());

        // Expect maxey sends OP_RESET to main and exit with NOT_AUTHORIZED
        expect(resetResult.transactions).toHaveTransaction({
            from: maxey.address,
            to: main.address,
            success: false,
            op: Opcodes.RESET,
            exitCode: ErrorCodes.NOT_AUTHORIZED,
        });
    });
});
