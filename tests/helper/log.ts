import { SendMessageResult } from '@ton/sandbox';
import { Topics } from '../../wrappers/Main';
import { OPCODE_SIZE, ROLE_ID_SIZE, TIMESTAMP_SIZE } from '../../wrappers/constants/size';
import { Address } from '@ton/core';

export function expectPublicCapabilityEmitLog(result: SendMessageResult, opcode: number, enabled: boolean) {
    expect(result.externals[0].info.dest?.value).toBe(Topics.PUBLIC_CAPABILITY_UPDATED);
    const extBody = result.externals[0].body.beginParse();

    expect(extBody.loadUintBig(OPCODE_SIZE)).toBe(Topics.PUBLIC_CAPABILITY_UPDATED);
    expect(extBody.loadUint(OPCODE_SIZE)).toBe(opcode);
    expect(extBody.loadBoolean()).toBe(enabled);
}

export function expectRoleCapabilityEmitLog(result: SendMessageResult, role: bigint, opcode: number, enabled: boolean) {
    expect(result.externals[0].info.dest?.value).toBe(Topics.ROLE_CAPABILITY_UPDATED);
    const extBody = result.externals[0].body.beginParse();

    expect(extBody.loadUintBig(OPCODE_SIZE)).toBe(Topics.ROLE_CAPABILITY_UPDATED);
    expect(extBody.loadUint(OPCODE_SIZE)).toBe(opcode);
    expect(extBody.loadUintBig(ROLE_ID_SIZE)).toBe(role);
    expect(extBody.loadBoolean()).toBe(enabled);
}

export function expectUserRoleEmitLog(result: SendMessageResult, user: Address, role: bigint, enabled: boolean) {
    expect(result.externals[0].info.dest?.value).toBe(Topics.USER_ROLE_UPDATED);
    const extBody = result.externals[0].body.beginParse();

    expect(extBody.loadUintBig(OPCODE_SIZE)).toBe(Topics.USER_ROLE_UPDATED);
    expect(extBody.loadAddress().equals(user)).toBeTruthy();
    expect(extBody.loadUintBig(ROLE_ID_SIZE)).toBe(role);
    expect(extBody.loadBoolean()).toBe(enabled);
}

export function expectOwnershipProposedEmitLog(
    result: SendMessageResult,
    currentOwner: Address,
    pendingOwner: Address,
    proposeTime: number,
    timelockPeriod: number,
) {
    expect(result.externals[0].info.dest?.value).toBe(Topics.OWNERSHIP_PROPOSED);
    const extBody = result.externals[0].body.beginParse();

    expect(extBody.loadUintBig(OPCODE_SIZE)).toBe(Topics.OWNERSHIP_PROPOSED);
    expect(extBody.loadAddress().equals(currentOwner)).toBeTruthy();
    expect(extBody.loadAddress().equals(pendingOwner)).toBeTruthy();
    expect(extBody.loadUint(TIMESTAMP_SIZE)).toBe(proposeTime);
    expect(extBody.loadUint(TIMESTAMP_SIZE)).toBe(timelockPeriod);
}

export function expectOwnershipClaimedEmitLog(result: SendMessageResult, currentOwner: Address) {
    expect(result.externals[0].info.dest?.value).toBe(Topics.OWNERSHIP_CLAIMED);
    const extBody = result.externals[0].body.beginParse();

    expect(extBody.loadUintBig(OPCODE_SIZE)).toBe(Topics.OWNERSHIP_CLAIMED);
    expect(extBody.loadAddress().equals(currentOwner)).toBeTruthy();
}

export function expectOwnershipRevokedEmitLog(
    result: SendMessageResult,
    revoker: Address,
    revokedPendingOwner: Address,
) {
    expect(result.externals[0].info.dest?.value).toBe(Topics.OWNERSHIP_REVOKED);
    const extBody = result.externals[0].body.beginParse();

    expect(extBody.loadUintBig(OPCODE_SIZE)).toBe(Topics.OWNERSHIP_REVOKED);
    expect(extBody.loadAddress().equals(revoker)).toBeTruthy();
    expect(extBody.loadAddress().equals(revokedPendingOwner)).toBeTruthy();
}
