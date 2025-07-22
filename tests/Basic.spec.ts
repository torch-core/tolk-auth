import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Opcodes, Main, Roles } from '../wrappers/Main';
import '@ton/test-utils';
import {
    expectOwnershipClaimedEmitLog,
    expectOwnershipProposedEmitLog,
    expectOwnershipRevokedEmitLog,
    expectPublicCapabilityEmitLog,
    expectRoleCapabilityEmitLog,
    expectUserRoleEmitLog,
} from './helper/log';
import { createTestEnvironment } from './helper/setup';

describe('Basic Role Authority tests', () => {
    let now: number;
    let timelockPeriod: number;

    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let newOwner: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const { getTestContext, resetToSnapshot } = createTestEnvironment();

    beforeEach(async () => {
        await resetToSnapshot();
        ({ blockchain, owner, maxey, newOwner, main, now, timelockPeriod } = getTestContext());
    });

    it('should set public capability and unset public capability', async () => {
        // Set OP_INCREASE as public
        const opcode = Opcodes.INCREASE;
        const setPublicResult = await main.sendSetPublicCapability(owner.getSender(), opcode, true);

        // Expect owner sends OP_SET_PUBLIC_CAPABILITY to main and success
        expect(setPublicResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.SET_PUBLIC_CAPABILITY,
        });

        // Get public capability
        const publicCapability = await main.getPublicCapability(opcode);

        // Expect public capability to be true
        expect(publicCapability).toBe(true);

        // Check emit public capability
        expectPublicCapabilityEmitLog(setPublicResult, Opcodes.INCREASE, true);

        // Unset public capability
        const unsetPublicResult = await main.sendSetPublicCapability(owner.getSender(), opcode, false);

        // Expect owner sends OP_SET_PUBLIC_CAPABILITY to main and success
        expect(unsetPublicResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.SET_PUBLIC_CAPABILITY,
        });

        // Get public capability
        const publicCapability2 = await main.getPublicCapability(opcode);

        // Expect public capability to be false
        expect(publicCapability2).toBe(false);

        // Check emit public capability
        expectPublicCapabilityEmitLog(unsetPublicResult, Opcodes.INCREASE, false);
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
    it('should propose ownership and claim ownership', async () => {
        // Propose ownership to new owner
        const proposeResult = await main.sendProposeOwnership(owner.getSender(), newOwner.address);

        // Expect owner sends OP_TRANSFER_OWNERSHIP to main and success
        expect(proposeResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.PROPOSE_OWNERSHIP,
        });

        // Get current owner
        const currentOwner = await main.getOwnerInfo();

        // Expect current owner to be owner
        expect(currentOwner.owner.equals(owner.address)).toBeTruthy();

        // Expect pending owner to be new owner
        expect(currentOwner.pendingOwner?.equals(newOwner.address)).toBeTruthy();

        // Expect propose time to be now
        expect(currentOwner.proposeTime).toBe(now);

        // Check emit ownership proposed
        expectOwnershipProposedEmitLog(proposeResult, owner.address, newOwner.address, now, timelockPeriod);

        // Wait for timelock period
        blockchain.now = now + timelockPeriod + 1;

        // Claim ownership
        const claimResult = await main.sendClaimOwnership(newOwner.getSender());

        // Expect new owner sends OP_CLAIM_OWNERSHIP to main and success
        expect(claimResult.transactions).toHaveTransaction({
            from: newOwner.address,
            to: main.address,
            success: true,
            op: Opcodes.CLAIM_OWNERSHIP,
        });

        // Get current owner
        const currentOwnerAfterClaim = await main.getOwnerInfo();

        // Expect current owner to be new owner
        expect(currentOwnerAfterClaim.owner.equals(newOwner.address)).toBeTruthy();

        // Expect pending owner to be null
        expect(currentOwnerAfterClaim.pendingOwner == null).toBeTruthy();

        // Expect propose time to be 0
        expect(currentOwnerAfterClaim.proposeTime).toBe(0);

        // Check emit ownership claimed
        expectOwnershipClaimedEmitLog(claimResult, newOwner.address);
    });

    it('should revoke pending ownership', async () => {
        // Propose ownership to new owner
        await main.sendProposeOwnership(owner.getSender(), newOwner.address);

        // Revoke pending ownership
        const revokeResult = await main.sendRevokePendingOwnership(owner.getSender());

        // Expect owner sends OP_REVOKE_PENDING_OWNERSHIP to main and success
        expect(revokeResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            op: Opcodes.REVOKE_PENDING_OWNERSHIP,
        });

        // Get current owner
        const currentOwner = await main.getOwnerInfo();

        // Expect current owner to be owner
        expect(currentOwner.owner.equals(owner.address)).toBeTruthy();

        // Expect pending owner to be zero address
        expect(currentOwner.pendingOwner == null).toBeTruthy();

        // Expect propose time to be 0
        expect(currentOwner.proposeTime).toBe(0);

        // Check emit ownership revoked
        expectOwnershipRevokedEmitLog(revokeResult, owner.address, newOwner.address);
    });
});
