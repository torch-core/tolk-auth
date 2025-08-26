import "../../../constants/type"

struct (0x714a73bb) SetPublicCapability {
    queryId: QueryId
    opcode: Opcode      // Target opcode to set public access for
    enabled: bool       // Whether to enable or disable public access to the opcode
}

// Logs
struct(0xd213468c) PublicCapabilityUpdated {
    opcode: Opcode
    enabled: bool
}

const TOPIC_PUBLIC_CAPABILITY_UPDATED = PublicCapabilityUpdated.getDeclaredPackPrefix();
