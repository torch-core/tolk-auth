import { Cell } from '@ton/core';
import { Blockchain, BlockchainSnapshot, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Main } from '../../wrappers/Main';
import { compile } from '@ton/blueprint';

export const createTestEnvironment = () => {
    // Blockchain
    let blockchain: Blockchain;
    let initSnapshot: BlockchainSnapshot | null = null;

    let code: Cell;
    let now: number;
    let owner: SandboxContract<TreasuryContract>;
    let maxey: SandboxContract<TreasuryContract>;
    let newOwner: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    const timelockPeriod = 60 * 60 * 12; // 12 hours

    beforeAll(async () => {
        code = await compile('Main');
        now = Math.floor(Date.now() / 1000);
        blockchain = await Blockchain.create();
        blockchain.verbosity = { ...blockchain.verbosity, print: false };
        blockchain.enableCoverage();
        blockchain.now = now;
        owner = await blockchain.treasury('owner');
        maxey = await blockchain.treasury('maxey');
        newOwner = await blockchain.treasury('newOwner');

        main = blockchain.openContract(
            Main.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                    owner: owner.address,
                    timelockPeriod,
                },
                code,
            ),
        );

        const deployResult = await main.sendDeploy(owner.getSender());

        expect(deployResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            deploy: true,
            success: true,
        });

        initSnapshot = blockchain.snapshot();
    });

    // restore blockchain to initial state
    const resetToInitSnapshot = async () => {
        if (initSnapshot) {
            await blockchain.loadFrom(initSnapshot);
        }
    };

    const getTestContext = () => {
        return {
            blockchain,
            owner,
            maxey,
            newOwner,
            main,
            now,
            timelockPeriod,
        };
    };

    return {
        resetToInitSnapshot: resetToInitSnapshot,
        getTestContext,
    };
};
