import "../constants/type";
import "core";
import "constants/error";
import "constants/type";

fun Auth.doesUserHaveRole(self, user: address, role: RoleMask): bool {
    val userRoles = self.getUserRoles(user);
    return ((userRoles >> role) & 1) != 0;
}

fun Auth.doesRoleHaveCapability(self, role: RoleMask, opcode: Opcode): bool {
    val roleCapability = self.getRoleCapability(opcode);
    return ((roleCapability >> role) & 1) != 0;
}

fun Auth.doesPublicCapabilityExist(self, opcode: Opcode): bool {
    val publicCapability = self.getPublicCapability(opcode);
    return publicCapability;
}

fun Auth.canCall(self, user: address, opcode: Opcode): bool {
    val userRoles = self.getUserRoles(user);
    val publicCapability = self.getPublicCapability(opcode);
    val roleCapability = self.getRoleCapability(opcode);

    return (userRoles & roleCapability) != 0 || publicCapability;
}

fun Auth.isAuthorized(self, user: address, opcode: Opcode): bool {
    return self.canCall(user, opcode) || user == self.owner;
}

fun Auth.requireAuth(self, user: address, opcode: Opcode) {
    assert(self.isAuthorized(user, opcode), ERR_NOT_AUTHORIZED);
}