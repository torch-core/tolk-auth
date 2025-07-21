import "constants/type";
import "messages";

fun emitPublicCapabilityUpdated(opcode: Opcode, enabled: bool) {
    val emitMsg = createExternalLogMessage({
        dest: ExtOutLogBucket {topic: TOPIC_PUBLIC_CAPABILITY_UPDATED},
        body: PublicCapabilityUpdated {
            opcode: opcode,
            enabled: enabled,
        }
    });
    emitMsg.send(SEND_MODE_REGULAR);
}

fun emitRoleCapabilityUpdated(opcode: Opcode, role: RoleId, enabled: bool) {
    val emitMsg = createExternalLogMessage({
        dest: ExtOutLogBucket {topic: TOPIC_ROLE_CAPABILITY_UPDATED},
        body: RoleCapabilityUpdated {
            opcode: opcode,
            role: role,
            enabled: enabled,
        }
    });
    emitMsg.send(SEND_MODE_REGULAR);
}

fun emitUserRoleUpdated(user: address, role: RoleId, enabled: bool) {
    val emitMsg = createExternalLogMessage({
        dest: ExtOutLogBucket {topic: TOPIC_USER_ROLE_UPDATED},
        body: UserRoleUpdated {
            user: user,
            role: role,
            enabled: enabled,
        }
    });
    emitMsg.send(SEND_MODE_REGULAR);
}

fun emitOwnershipTransferred(sender: address, newOwner: address) {
    val emitMsg = createExternalLogMessage({
        dest: ExtOutLogBucket {topic: TOPIC_OWNERSHIP_TRANSFERRED},
        body: OwnershipTransferred {
            sender: sender,
            newOwner: newOwner,
        }
    });
    emitMsg.send(SEND_MODE_REGULAR);
}