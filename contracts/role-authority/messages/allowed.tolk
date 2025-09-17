import "schemas/set-user-role"
import "schemas/set-role-capability"
import "schemas/set-public-capability"
import "schemas/ownership"

// Add `AuthMessages` to your internal messages union to enable the Auth system. 
type AuthMessages = SetUserRole | SetRoleCapability | SetPublicCapability | ProposeOwnership | ClaimOwnership | RevokePendingOwnership;



