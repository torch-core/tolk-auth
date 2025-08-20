import { Coverage } from '@ton/sandbox';
import { readFileSync, writeFileSync } from 'fs';

function main() {
    // Merge coverage data in separate script after tests
    const publicCapabilityCoverage = Coverage.fromJson(readFileSync('./coverage/public-capability.json', 'utf-8'));
    const setRoleCoverage = Coverage.fromJson(readFileSync('./coverage/set-role.json', 'utf-8'));
    const ownerCoverage = Coverage.fromJson(readFileSync('./coverage/owner.json', 'utf-8'));
    const bitMaskCoverage = Coverage.fromJson(readFileSync('./coverage/bit-mask.json', 'utf-8'));
    const totalCoverage = publicCapabilityCoverage
        .mergeWith(setRoleCoverage)
        .mergeWith(ownerCoverage)
        .mergeWith(bitMaskCoverage);
    const htmlReport = totalCoverage.report('html');
    writeFileSync('./coverage/coverage.html', htmlReport);
    console.log(`Combined coverage: ${totalCoverage.summary().coveragePercentage}%`);
}

main();
