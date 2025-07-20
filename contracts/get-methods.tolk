import "storage";
import "role-authority/constants/type";

get fun currentCounter(): int {
    val storage = lazy Storage.load();
    return storage.counter;
}

get fun initialId(): int {
    val storage = lazy Storage.load();
    return storage.id;
}

// Auth get methods
get fun owner(): address {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.owner;
}

get fun hasPublicCapability(opcode: Opcode): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.hasPublicCapability(opcode);
}

get fun hasCapability(role: RoleId, opcode: Opcode): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.hasCapability(role, opcode);
}

get fun hasRole(user: address, role: RoleId): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.hasRole(user, role);
}
