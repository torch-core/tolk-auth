import "constants/type";

struct (0xdd28b73e) SetUserRole {
    queryId: QueryID
    user: address
    role: uint8
    enabled: bool
}

struct (0xc6012bd0) SetRoleCapability {
    queryId: QueryID
    role: uint8
    opcode: uint32
    enabled: bool
}

struct (0x714a73bb) SetPublicCapability {
    queryId: QueryID
    opcode: uint32
    enabled: bool
}

struct (0x7bb334c7) TransferOwnership {
    queryId: QueryID
    newOwner: address
}

struct PublicCapabilityUpdated {
    opcode: Opcode
    enabled: bool
}

struct RoleCapabilityUpdated {
    opcode: Opcode
    role: RoleId
    enabled: bool
}

struct UserRoleUpdated {
    user: address
    role: RoleId
    enabled: bool
}

struct OwnershipTransferred {
    sender: address
    newOwner: address
}

const OP_SET_USER_ROLE = SetUserRole.getDeclaredPackPrefix();
const OP_SET_ROLE_CAPABILITY = SetRoleCapability.getDeclaredPackPrefix();
const OP_SET_PUBLIC_CAPABILITY = SetPublicCapability.getDeclaredPackPrefix();
const OP_TRANSFER_OWNERSHIP = TransferOwnership.getDeclaredPackPrefix();
const TOPIC_PUBLIC_CAPABILITY_UPDATED = 0xd213468c;
const TOPIC_ROLE_CAPABILITY_UPDATED = 0x6aa264fa;
const TOPIC_USER_ROLE_UPDATED = 0x31322498;
const TOPIC_OWNERSHIP_TRANSFERRED = 0x45b9ecc7;;

type AuthMessages = SetUserRole | SetRoleCapability | SetPublicCapability | TransferOwnership;