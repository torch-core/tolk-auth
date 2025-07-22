import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Opcodes, Main, ErrorCodes } from '../wrappers/Main';
import '@ton/test-utils';
import { createTestEnvironment } from './helper/setup';
import {
    expectOwnershipClaimedEmitLog,
    expectOwnershipProposedEmitLog,
    expectOwnershipRevokedEmitLog,
} from './helper/log';

describe('Owner role tests', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let newOwner: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    let now: number;
    let timelockPeriod: number;
    const { getTestContext, resetToSnapshot } = createTestEnvironment();
    beforeEach(async () => {
        await resetToSnapshot();
        ({ blockchain, owner, maxey, newOwner, main, now, timelockPeriod } = getTestContext());
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

    it('should owner increase counter without role capability and user role', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            const counterBefore = await main.getCounter();

            const increaseBy = Math.floor(Math.random() * 100);

            const increaseResult = await main.sendIncrease(owner.getSender(), increaseBy);

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
        await main.sendIncrease(owner.getSender(), increaseBy);

        expect(await main.getCounter()).toBe(increaseBy);

        await main.sendReset(owner.getSender());

        expect(await main.getCounter()).toBe(0);
    });

    it('should only owner can propose ownership', async () => {
        // maxey try to transfer ownership to new owner
        const newOwner = await blockchain.treasury('newOwner');
        const proposeResult = await main.sendProposeOwnership(maxey.getSender(), newOwner.address);

        // Expect maxey sends OP_PROPOSE_OWNERSHIP to main and exit with NOT_AUTHORIZED
        expect(proposeResult.transactions).toHaveTransaction({
            from: maxey.address,
            to: main.address,
            success: false,
            op: Opcodes.PROPOSE_OWNERSHIP,
            exitCode: ErrorCodes.NOT_AUTHORIZED,
        });
    });

    it('should only pending owner can claim ownership', async () => {
        // Propose ownership to new owner
        await main.sendProposeOwnership(owner.getSender(), newOwner.address);

        // maxey try to claim ownership
        const claimResult = await main.sendClaimOwnership(maxey.getSender());

        // Expect maxey sends OP_CLAIM_OWNERSHIP to main and exit with NOT_PENDING_OWNER
        expect(claimResult.transactions).toHaveTransaction({
            from: maxey.address,
            to: main.address,
            success: false,
            op: Opcodes.CLAIM_OWNERSHIP,
            exitCode: ErrorCodes.NOT_PENDING_OWNER,
        });
    });

    it('should only claim ownership after timelock period', async () => {
        // Propose ownership to new owner
        await main.sendProposeOwnership(owner.getSender(), newOwner.address);

        // New owner try to claim ownership
        const claimResult = await main.sendClaimOwnership(newOwner.getSender());

        // Expect new owner sends OP_CLAIM_OWNERSHIP to main and exit with CLAIM_TOO_EARLY
        expect(claimResult.transactions).toHaveTransaction({
            from: newOwner.address,
            to: main.address,
            success: false,
            op: Opcodes.CLAIM_OWNERSHIP,
            exitCode: ErrorCodes.CLAIM_TOO_EARLY,
        });
    });
});
