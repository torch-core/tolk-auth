import "role-authority";
import "messages";
import "storage";
import "constants/type";

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

get fun userRole(user: address): RoleMask {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.getUserRoles(user);
}

get fun roleCapability(opcode: Opcode): RoleMask {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.getRoleCapability(opcode);
}

get fun publicCapability(opcode: Opcode): bool {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.getPublicCapability(opcode);
}