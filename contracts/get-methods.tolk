import "messages";
import "storage";
import "constants/type";
import "auth/constants/type";

// get methods are a means to conveniently read contract data using, for example, HTTP APIs
// note that unlike in many other smart contract VMs, get methods cannot be called by other contracts
get fun currentCounter(): int {
    val storage = lazy Storage.load();
    return storage.counter;
}

get fun initialId(): int {
    val storage = lazy Storage.load();
    return storage.id;
}

get fun doesUserHaveRole(user: address, role: RoleMask): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.doesUserHaveRole(user, role);
}

get fun doesRoleHaveCapability(role: RoleMask, opcode: Opcode): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.doesRoleHaveCapability(role, opcode);
}

get fun doesPublicCapabilityExist(opcode: Opcode): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.doesPublicCapabilityExist(opcode);
}

get fun owner(): address {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.owner;
}