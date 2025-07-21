import "@stdlib/tvm-dicts";
import "constants/size";
import "constants/type";
import "ext-messages";

struct Auth {
    owner: address
    isCapabilityPublic: dict
    rolesWithCapability: dict
    userRoles: dict
}

fun Auth.getPublicCapability(self, opcode: Opcode): bool {
    var (publicCapability, found) = self.isCapabilityPublic.uDictGet(OPCODE_SIZE, opcode);
    return found ? publicCapability!.loadBool() : false;
}

fun Auth.getRoleCapability(self, opcode: Opcode): RoleMask {
    var (roleCapability, found) = self.rolesWithCapability.uDictGet(OPCODE_SIZE, opcode);    
    return (found ? roleCapability!.loadUint(ROLE_MASK_SIZE) : 0) as RoleMask;
}

fun Auth.getUserRoles(self, user: address): RoleMask {
    val userSlice = user as slice;
    var (userRoleCell, found) = self.userRoles.sDictGet(ADDRESS_SIZE, userSlice);
    return (found ? userRoleCell!.loadUint(ROLE_MASK_SIZE) : 0) as RoleMask;
}

fun Auth.setPublicCapability(mutate self, opcode: Opcode, enabled: bool) {
    self.isCapabilityPublic.uDictSet(OPCODE_SIZE, opcode, beginCell().storeBool(enabled).endCell().beginParse());
    emitPublicCapabilityUpdated(opcode, enabled);

    return self.toCell();
}

fun Auth.setRoleCapability(mutate self, role: RoleId, opcode: Opcode, enabled: bool) {
    val currentRoleCapability = self.getRoleCapability(opcode);
    val newRoleCapability = enabled ? (currentRoleCapability | 1 << role) : (currentRoleCapability & ~(1 << role));
    self.rolesWithCapability.uDictSet(OPCODE_SIZE, opcode, beginCell().storeUint(newRoleCapability, ROLE_MASK_SIZE).endCell().beginParse());
    emitRoleCapabilityUpdated(opcode, role, enabled);

    return self.toCell();
}

fun Auth.setUserRole(mutate self, user: address, role: RoleId, enabled: bool) {
    val currentRoles = self.getUserRoles(user);
    val newRoles = enabled ? (currentRoles | 1 << role) : (currentRoles & ~(1 << role));
    self.userRoles.sDictSet(ADDRESS_SIZE, user as slice, beginCell().storeUint(newRoles, ROLE_MASK_SIZE).endCell().beginParse());
    emitUserRoleUpdated(user, role, enabled);
    
    return self.toCell();
}