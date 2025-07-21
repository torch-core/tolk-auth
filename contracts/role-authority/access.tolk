import "auth";
import "constants/type";
import "constants/error";

/// Checks if a user has a specific role.
/// @param self The Auth structure instance.
/// @param user The address of the user to check.
/// @param role The role ID to query.
/// @return True if the user has the role, false otherwise.
/// @dev Checks the bit at position `role` in the user's RoleMask using bitwise operations.
///      Specifically: (userRoles >> role) shifts the bit to the lowest position, & 1 isolates it.
fun Auth.hasRole(self, user: address, role: RoleId): bool {
    val userRoles = self.getUserRoles(user);
    return ((userRoles >> role) & 1) != 0;
}

/// Checks if a role has capability for a specific opcode.
/// @param self The Auth structure instance.
/// @param role The role ID to check.
/// @param opcode The opcode to query.
/// @return True if the role has the capability, false otherwise.
/// @dev Uses the same bitmask logic as `hasRole` to check the role's permission on the opcode.
fun Auth.hasCapability(self, role: RoleId, opcode: Opcode): bool {
    val roleCapability = self.getRoleCapability(opcode);
    return ((roleCapability >> role) & 1) != 0;
}

/// Checks if an opcode has public capability.
/// @param self The Auth structure instance.
/// @param opcode The opcode to query.
/// @return True if the opcode has public capability, false otherwise.
fun Auth.hasPublicCapability(self, opcode: Opcode): bool {
    val publicCapability = self.getPublicCapability(opcode);
    return publicCapability;
}

/// Determines if a user can call a specific opcode based on roles or public capability.
/// @param self The Auth structure instance.
/// @param user The address of the user.
/// @param opcode The opcode to check.
/// @return True if the user can call the opcode, false otherwise.
/// @dev Returns true if the opcode is marked public, or if the user's RoleMask intersects
///      with the opcode's RoleMask (i.e., (userRoles & roleCapability) != 0).
fun Auth.canCall(self, user: address, opcode: Opcode): bool {
    val userRoles = self.getUserRoles(user);
    val publicCapability = self.getPublicCapability(opcode);
    val roleCapability = self.getRoleCapability(opcode);

    return (userRoles & roleCapability) != 0 || publicCapability;
}

/// Checks if a user is authorized for an opcode, including owner fallback.
/// @param self The Auth structure instance.
/// @param user The address of the user.
/// @param opcode The opcode to check.
/// @return True if authorized (via roles, public, or owner), false otherwise.
fun Auth.isAuthorized(self, user: address, opcode: Opcode): bool {
    return self.canCall(user, opcode) || user == self.owner;
}

/// Requires that a user is authorized for an opcode, or throws an error.
/// @param self The Auth structure instance.
/// @param user The address of the user.
/// @param opcode The opcode to check.
/// @dev Throws ERR_NOT_AUTHORIZED if not authorized.
fun Auth.requireAuth(self, user: address, opcode: Opcode) {
    assert(self.isAuthorized(user, opcode), ERR_NOT_AUTHORIZED);
}