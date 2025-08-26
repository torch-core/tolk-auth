import "schemas/set-user-role"
import "schemas/set-role-capability"
import "schemas/set-public-capability"
import "schemas/ownership"

// Add `AuthMessages` to your internal messages union to enable the Auth system. 
type AuthMessages = SetUserRole | SetRoleCapability | SetPublicCapability | ProposeOwnership | ClaimOwnership | RevokePendingOwnership;

/* Auth internal messages opcodes */
const OP_SET_USER_ROLE = SetUserRole.getDeclaredPackPrefix();
const OP_SET_ROLE_CAPABILITY = SetRoleCapability.getDeclaredPackPrefix();
const OP_SET_PUBLIC_CAPABILITY = SetPublicCapability.getDeclaredPackPrefix();   
const OP_PROPOSE_OWNERSHIP = ProposeOwnership.getDeclaredPackPrefix();
const OP_REVOKE_PENDING_OWNERSHIP = RevokePendingOwnership.getDeclaredPackPrefix();

