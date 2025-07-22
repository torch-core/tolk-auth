import { SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Opcodes, Main, ErrorCodes } from '../wrappers/Main';
import '@ton/test-utils';
import { createTestEnvironment } from './helper/setup';

describe('Public Capability tests', () => {
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const { getTestContext, resetToSnapshot } = createTestEnvironment();
    beforeEach(async () => {
        await resetToSnapshot();
        ({ owner, maxey, main } = getTestContext());
    });
    it('should increase counter after setting public capability', async () => {
        // Set increase opcode as public
        await main.sendSetPublicCapability(owner.getSender(), Opcodes.INCREASE, true);

        // Get counter before
        const counterBefore = await main.getCounter();

        // increase counter
        const increaseResult = await main.sendIncrease(maxey.getSender(), 1);

        // Expect maxey sends OP_INCREASE to main and success
        expect(increaseResult.transactions).toHaveTransaction({
            from: maxey.address,
            to: main.address,
            success: true,
            op: Opcodes.INCREASE,
        });

        // Get counter after
        const counterAfter = await main.getCounter();

        // Expect counter to be increased by 1
        expect(counterAfter).toBe(counterBefore + 1);
    });

    it('should throw when increasing counter is not public', async () => {
        // maxey try to increase counter
        const increaseResult = await main.sendIncrease(maxey.getSender(), 1);

        // Expect maxey sends OP_INCREASE to main and exit with NOT_AUTHORIZED
        expect(increaseResult.transactions).toHaveTransaction({
            from: maxey.address,
            to: main.address,
            success: false,
            op: Opcodes.INCREASE,
            exitCode: ErrorCodes.NOT_AUTHORIZED,
        });
    });
});
