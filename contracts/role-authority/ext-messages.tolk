import "constants/type";

/* Auth external messages structs */
struct(0xd213468c) PublicCapabilityUpdated {
    opcode: Opcode
    enabled: bool
}

struct(0x6aa264fa) RoleCapabilityUpdated {
    opcode: Opcode
    role: RoleId
    enabled: bool
}

struct(0x31322498) UserRoleUpdated {
    user: address
    role: RoleId
    enabled: bool
}

struct(0x45b9ecc7) OwnershipTransferred {
    sender: address
    newOwner: address
}

/* Auth external messages topics */
const TOPIC_PUBLIC_CAPABILITY_UPDATED = PublicCapabilityUpdated.getDeclaredPackPrefix();
const TOPIC_ROLE_CAPABILITY_UPDATED = RoleCapabilityUpdated.getDeclaredPackPrefix();
const TOPIC_USER_ROLE_UPDATED = UserRoleUpdated.getDeclaredPackPrefix();
const TOPIC_OWNERSHIP_TRANSFERRED = OwnershipTransferred.getDeclaredPackPrefix();

/* Auth external messages functions */

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