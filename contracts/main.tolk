tolk 1.0

import "constants/error";
import "int-messages";
import "storage";
import "role-authority/auth";
import "role-authority/access";
import "role-authority/int-messages";
import "role-authority/ext-messages";
import "get-methods"; // Enables off-chain access to get methods. Removing this will disable them.

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessage.fromSlice(in.body);
    var storage = lazy Storage.load();
    var auth = lazy storage.auth.load();

    match (msg) {
        /* Counter internal messages */
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

        /* Auth internal messages */
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
        ProposeOwnership => {
            auth.requireAuth(in.senderAddress, OP_PROPOSE_OWNERSHIP);
            auth.ownerInfo.pendingOwner = msg.newOwner;
            auth.ownerInfo.proposeTime = blockchain.now();
            emitOwnershipProposed(in.senderAddress, msg.newOwner, auth.ownerInfo.proposeTime, auth.ownerInfo.timelockPeriod);
            storage.auth = auth.toCell();
            storage.save();
        }
        ClaimOwnership => {
            auth.requirePendingOwner(in.senderAddress);
            auth.requireTimelockPassed();
            auth.ownerInfo.owner = in.senderAddress;
            auth.ownerInfo.pendingOwner = createAddressNone();
            auth.ownerInfo.proposeTime = 0;
            emitOwnershipClaimed(in.senderAddress);
            storage.auth = auth.toCell();
            storage.save();
        }
        RevokePendingOwnership => {
            auth.requireAuth(in.senderAddress, OP_REVOKE_PENDING_OWNERSHIP);
            emitOwnershipRevoked(in.senderAddress, auth.ownerInfo.pendingOwner);
            auth.ownerInfo.pendingOwner = createAddressNone();
            auth.ownerInfo.proposeTime = 0;
            storage.auth = auth.toCell();
            storage.save();
        }
        else => {
            assert (in.body.isEmpty()) throw ERR_INVALID_OPCODE
        }
    }
}