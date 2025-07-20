import "role-authority";
import "constants/error";
import "constants/type";

fun isAuthorized(auth: Auth, owner: address, user: address, opcode: Opcode): bool {
    return auth.canCall(user, opcode) || user == owner;
}

fun address.requireAuth(self, auth: Auth, user: address, opcode: Opcode) {
    assert(isAuthorized(auth, self, user, opcode), ERROR_NOT_AUTHORIZED);
}