tolk 1.0

import "constants/error";
import "messages";
import "storage";
import "get-methods";
import "role-authority/auth";
import "role-authority/access";
import "role-authority/messages";

fun onInternalMessage(in: InMessage) {
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
        SetPublicCapability => {
            auth.requireAuth(in.senderAddress, OP_SET_PUBLIC_CAPABILITY);
            storage.auth = auth.setPublicCapability(msg.opcode, msg.enabled);
            storage.save();
        }
        SetRoleCapability => {
            auth.requireAuth(in.senderAddress, OP_SET_ROLE_CAPABILITY);
            storage.auth = auth.setRoleCapability(msg.role, msg.opcode, msg.enabled);
            storage.save();
        }
        SetUserRole => {
            auth.requireAuth(in.senderAddress, OP_SET_USER_ROLE);
            storage.auth = auth.setUserRole(msg.user, msg.role, msg.enabled);
            storage.save();
        }
        TransferOwnership => {
            // NOTE: This is a basic ownership transfer implementation. 
            // A timelock mechanism for admin changes can also be implemented here.
            auth.requireAuth(in.senderAddress, OP_TRANSFER_OWNERSHIP);
            auth.owner = msg.newOwner;
            storage.auth = auth.toCell();
            storage.save();
        }
        else => {
            assert (in.body.isEmpty()) throw ERR_INVALID_OPCODE
        }
    }
}