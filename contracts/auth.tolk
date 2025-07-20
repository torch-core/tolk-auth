import "@stdlib/tvm-dicts";
import "constants/size";
import "constants/type";

struct Auth {
    owner: address
    userRoles: dict
    isCapabilityPublic: dict
    getRolesWithCapability: dict
}

fun Auth.setUserRole(mutate self, user: address, role: RoleMask, enabled: bool) {
    val userSlice = user as slice;
    var (userRole: slice?, found) = self.userRoles.sDictGet(ADDRESS_SIZE, userSlice);
    val currentRoles = (found ? userRole!.loadUint(ROLE_SIZE) : 0) as RoleMask;
    val newRoles = enabled ? (currentRoles | 1 << role) : (currentRoles & ~(1 << role));
    
    self.userRoles.sDictSet(ADDRESS_SIZE, userSlice, beginCell().storeUint(newRoles, ROLE_SIZE).endCell().beginParse());

    return self.toCell();
}

fun Auth.getUserRoles(self, user: address): RoleMask {
    val userSlice = user as slice;
    var (userRoleCell, found) = self.userRoles.sDictGet(ADDRESS_SIZE, userSlice);
    return (found ? userRoleCell!.loadUint(ROLE_SIZE) : 0) as RoleMask;
}