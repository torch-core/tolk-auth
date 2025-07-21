import "storage";
import "role-authority/constants/type";

/* Counter get methods */

get fun currentCounter(): int {
    val storage = lazy Storage.load();
    return storage.counter;
}

get fun initialId(): int {
    val storage = lazy Storage.load();
    return storage.id;
}

/* Auth get methods */

/// Returns the address of the contract owner, who also controls the authority system.
/// @return The owner address.
get fun owner(): address {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.owner;
}

/// Checks if an opcode has public capability.
/// @param opcode The opcode to check.
/// @return True if the opcode has public capability, false otherwise.
get fun hasPublicCapability(opcode: Opcode): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.hasPublicCapability(opcode);
}

/// Checks if a role has capability for a specific opcode.
/// @param role The role ID to check.
/// @param opcode The opcode to query.
/// @return True if the role has the capability, false otherwise.
get fun hasCapability(role: RoleId, opcode: Opcode): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.hasCapability(role, opcode);
}

/// Checks if a user has a specific role.
/// @param user The address of the user to check.
/// @param role The role ID to query.
/// @return True if the user has the role, false otherwise.
get fun hasRole(user: address, role: RoleId): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.hasRole(user, role);
}
