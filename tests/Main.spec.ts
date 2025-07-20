import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Opcodes, Main } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Test', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Main');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const INCREASE_ROLE = 1n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        main = blockchain.openContract(
            Main.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                    owner: deployer.address,
                },
                code,
            ),
        );

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and test are ready to use
    });

    it('should set role capability', async () => {
        const opcode = Opcodes.OP_INCREASE;
        await main.sendSetRoleCapability(deployer.getSender(), INCREASE_ROLE, opcode, true);

        const roleCapability = await main.getHasCapability(INCREASE_ROLE, opcode);
        expect(roleCapability).toBe(true);
    });

    it('should set user role', async () => {
        await main.sendSetUserRole(deployer.getSender(), deployer.address, INCREASE_ROLE, true);

        // Get user role
        const userRole = await main.getHasRole(deployer.address, INCREASE_ROLE);
        expect(userRole).toBe(true);
    });

    it('should set public capability', async () => {
        const opcode = Opcodes.OP_INCREASE;
        await main.sendSetPublicCapability(deployer.getSender(), opcode, true);
        const publicCapability = await main.getHasPublicCapability(opcode);
        expect(publicCapability).toBe(true);
    });

    it('should transfer ownership', async () => {
        const newOwner = await blockchain.treasury('newOwner');
        await main.sendTransferOwnerShip(deployer.getSender(), newOwner.address);
        const owner = await main.getOwner();
        expect(owner.equals(newOwner.address)).toBeTruthy();
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            console.log(`increase ${i + 1}/${increaseTimes}`);

            const counterBefore = await main.getCounter();

            console.log('counter before increasing', counterBefore);

            const increaseBy = Math.floor(Math.random() * 100);

            console.log('increasing by', increaseBy);

            const increaseResult = await main.sendIncrease(deployer.getSender(), {
                increaseBy,
                value: toNano('0.05'),
            });

            expect(increaseResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: main.address,
                success: true,
            });

            const counterAfter = await main.getCounter();

            console.log('counter after increasing', counterAfter);

            expect(counterAfter).toBe(counterBefore + increaseBy);
        }
    });

    it('should reset counter', async () => {
        expect(await main.getCounter()).toBe(0);

        const increaseBy = 5;
        await main.sendIncrease(deployer.getSender(), {
            increaseBy,
            value: toNano('0.05'),
        });

        expect(await main.getCounter()).toBe(increaseBy);

        await main.sendReset(deployer.getSender(), {
            value: toNano('0.05'),
        });

        expect(await main.getCounter()).toBe(0);
    });
});
