import { SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Opcodes, Main, ErrorCodes, Roles } from '../wrappers/Main';
import '@ton/test-utils';
import { createTestEnvironment } from './helper/setup';

describe('Set Role Capability and User Role tests', () => {
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const { getTestContext, resetToSnapshot } = createTestEnvironment();
    beforeEach(async () => {
        await resetToSnapshot();
        ({ owner, maxey, main } = getTestContext());
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
