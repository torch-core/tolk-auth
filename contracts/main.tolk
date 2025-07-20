tolk 1.0

import "storage";
import "role-authority";
import "messages";
import "get-methods";

// the main entrypoint: called when a contract receives an message from other contracts
fun onInternalMessage(in: InMessage) {
    // use `lazy` to defer loading fields until they are accessed
    val msg = lazy AllowedMessage.fromSlice(in.body);
    var storage = lazy Storage.load();
    var auth = lazy storage.auth.load();

    match (msg) {
        IncreaseCounter => {
            auth.requireAuth(in.senderAddress, OP_INCREASE);
            storage.counter += msg.increaseBy;
            storage.save();
        }
        ResetCounter => {
            auth.requireAuth(in.senderAddress, OP_RESET);
            storage.counter = 0;
            storage.save();
        }
        SetUserRole => {
            auth.requireAuth(in.senderAddress, OP_SET_USER_ROLE);
            storage.auth = auth.setUserRole(msg.user, msg.role, msg.enabled);
            storage.save();
        }
        SetRoleCapability => {
            auth.requireAuth(in.senderAddress, OP_SET_ROLE_CAPABILITY);
            storage.auth = auth.setRoleCapability(msg.role, msg.opcode, msg.enabled);
            storage.save();
        }
        SetPublicCapability => {
            auth.requireAuth(in.senderAddress, OP_SET_PUBLIC_CAPABILITY);
            storage.auth = auth.setPublicCapability(msg.opcode, msg.enabled);
            storage.save();
        }
        else => {
            // ignore empty messages, "wrong opcode" for others
            assert (in.body.isEmpty()) throw 0xFFFF
        }
    }
}