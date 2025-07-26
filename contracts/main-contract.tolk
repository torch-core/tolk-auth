tolk 1.0

/// @title Counter Example with Role Authority System
/// @notice This contract demonstrates a minimal Counter implementation secured by the `role-authority` system.
/// @dev For integration guidance, see the README (https://github.com/ipromise2324/tolk-auth?tab=readme-ov-file#bitmask-operations).

import "constants/error";
import "role-authority/messages/internal/schema";
import "storage";
import "get-methods";
import "messages/internal/schema";
import "role-authority/auth";
import "role-authority/access";
import "role-authority/messages/external/emit";
import "role-authority/get-methods"; // Enables off-chain access to get methods. Removing this will disable them.

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
            emitOwnershipClaimed(in.senderAddress);
            storage.auth = auth.clearPendingOwner();
            storage.save();
        }
        RevokePendingOwnership => {
            auth.requireAuth(in.senderAddress, OP_REVOKE_PENDING_OWNERSHIP);
            emitOwnershipRevoked(in.senderAddress, auth.ownerInfo.pendingOwner);
            storage.auth = auth.clearPendingOwner();
            storage.save();
        }
        else => {
            assert (in.body.isEmpty()) throw ERR_INVALID_OPCODE
        }
    }
}

