import "storage";
import "role-authority/constants/type";
import "role-authority/auth";

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

/// Returns detailed information about the ownership status of the authority system.
/// @notice Provides the current owner, pending owner (if any), propose time, and timelock duration.
/// @return The OwnershipInfo structure containing:
///   - owner: The address of the current owner.
///   - pendingOwner: The address of the pending owner (address(0) if not set).
///   - proposeTime: The timestamp when the ownership transfer was proposed (0 if not set).
///   - timelockPeriod: The timelock period in seconds required before claiming ownership.
get fun ownerInfo(): OwnerInfo {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.ownerInfo;
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
