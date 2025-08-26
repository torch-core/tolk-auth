import "../../../constants/type"
import "../../constants/type"

struct (0xdd28b73e) SetUserRole {
    queryId: QueryId
    user: address       // Target user to set the role for
    role: RoleId        // Grant this role to the user
    enabled: bool       // Whether to enable or disable the user role
}

// Logs
struct(0x31322498) UserRoleUpdated {
    user: address
    role: RoleId
    enabled: bool
}

const TOPIC_USER_ROLE_UPDATED = UserRoleUpdated.getDeclaredPackPrefix();
