tolk 1.0

/*
 * @title Counter Example with Role Authority System
 * @notice This contract demonstrates a minimal Counter implementation secured by the `role-authority` system.
 * @dev For integration guidance, see the README (https://github.com/ipromise2324/tolk-auth?tab=readme-ov-file#bitmask-operations).
 */

import "role-authority/auth";
import "role-authority/access";
import "role-authority/messages/allowed"
import "role-authority/messages/schemas/set-public-capability"
import "role-authority/messages/schemas/set-role-capability"
import "role-authority/messages/schemas/set-user-role"
import "role-authority/messages/schemas/ownership"
import "role-authority/get-methods"; // Enables off-chain access to get methods. Removing this will disable them.
import "constants/error";
import "storage";
import "messages/schemas";
import "messages/allowed"
import "get-methods";

fun onInternalMessage(in: InMessage) {
    val inMsg = lazy AllowedMessage.fromSlice(in.body);
    var storage = lazy Storage.load();
    var auth = lazy storage.auth.load();

    match (inMsg) {
        /* Counter internal messages */
        IncreaseCounter => {
            auth.requireAuth(in.senderAddress, OP_INCREASE);
            storage.counter += inMsg.increaseBy;
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
            auth.setPublicCapability(inMsg.opcode, inMsg.enabled);
            storage.updateAuth(auth);
        }
        SetRoleCapability => {
            auth.requireAuth(in.senderAddress, OP_SET_ROLE_CAPABILITY);
            auth.setRoleCapability(inMsg.role, inMsg.opcode, inMsg.enabled);
            storage.updateAuth(auth);
        }
        SetUserRole => {
            auth.requireAuth(in.senderAddress, OP_SET_USER_ROLE);
            auth.setUserRole(inMsg.user, inMsg.role, inMsg.enabled);
            storage.updateAuth(auth);
        }
        ProposeOwnership => {
            auth.requireAuth(in.senderAddress, OP_PROPOSE_OWNERSHIP);
            auth.proposeOwnership(inMsg.newOwner, blockchain.now());
            storage.updateAuth(auth);
        }
        ClaimOwnership => {
            auth.requirePendingOwner(in.senderAddress);
            auth.requireTimelockPassed();
            auth.claimOwnership(in.senderAddress);
            storage.updateAuth(auth);
        }
        RevokePendingOwnership => {
            auth.requireAuth(in.senderAddress, OP_REVOKE_PENDING_OWNERSHIP);
            auth.revokePendingOwnership(in.senderAddress);
            storage.updateAuth(auth);
        }
        else => {
            assert (in.body.isEmpty()) throw ERR_INVALID_OPCODE
        }
    }
}

