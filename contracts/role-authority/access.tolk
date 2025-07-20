import "auth";
import "constants/type";
import "constants/error";

fun Auth.hasRole(self, user: address, role: RoleId): bool {
    val userRoles = self.getUserRoles(user);
    return ((userRoles >> role) & 1) != 0;
}

fun Auth.hasCapability(self, role: RoleId, opcode: Opcode): bool {
    val roleCapability = self.getRoleCapability(opcode);
    return ((roleCapability >> role) & 1) != 0;
}

fun Auth.hasPublicCapability(self, opcode: Opcode): bool {
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