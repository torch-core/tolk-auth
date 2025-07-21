import { SendMessageResult } from "@ton/sandbox";
import { Topics } from "../../wrappers/Main";
import { OPCODE_SIZE, ROLE_ID_SIZE } from "../../wrappers/constants/size";
import { Address } from "@ton/core";


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

export function expectOwnershipTransferredEmitLog(result: SendMessageResult, sender: Address, newOwner: Address) {
    expect(result.externals[0].info.dest?.value).toBe(Topics.OWNERSHIP_TRANSFERRED);
    const extBody = result.externals[0].body.beginParse();

    expect(extBody.loadUintBig(OPCODE_SIZE)).toBe(Topics.OWNERSHIP_TRANSFERRED);
    expect(extBody.loadAddress().equals(sender)).toBeTruthy();
    expect(extBody.loadAddress().equals(newOwner)).toBeTruthy();
}
