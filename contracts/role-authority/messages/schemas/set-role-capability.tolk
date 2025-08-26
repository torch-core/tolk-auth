import "../../../constants/type"
import "../../constants/type"

struct (0xc6012bd0) SetRoleCapability {
    queryId: QueryId
    opcode: Opcode      // Target opcode to set the capability for
    role: RoleId        // Set this role to have the capability for the opcode
    enabled: bool       // Whether to enable or disable the role capability
}

// Logs
struct(0x6aa264fa) RoleCapabilityUpdated {
    opcode: Opcode
    role: RoleId
    enabled: bool
}

const TOPIC_ROLE_CAPABILITY_UPDATED = RoleCapabilityUpdated.getDeclaredPackPrefix();
