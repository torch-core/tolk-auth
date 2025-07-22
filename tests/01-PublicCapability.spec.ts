import { SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Opcodes, Main, ErrorCodes } from '../wrappers/Main';
import '@ton/test-utils';
import { createTestEnvironment } from './helper/setup';
import { expectPublicCapabilityEmitLog } from './helper/log';

describe('Public Capability tests', () => {
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const { getTestContext, resetToInitSnapshot } = createTestEnvironment();
    beforeEach(async () => {
        await resetToInitSnapshot();
        ({ owner, maxey, main } = getTestContext());
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
