import "@stdlib/tvm-dicts";
import "constants/size";
import "constants/type";

struct Auth {
    owner: address
    userRoles: dict
    isCapabilityPublic: dict
    getRolesWithCapability: dict
}

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

type AuthMessages = SetUserRole | SetRoleCapability | SetPublicCapability;

fun Auth.setPublicCapability(mutate self, opcode: Opcode, enabled: bool) {
    self.isCapabilityPublic.uDictSet(OPCODE_SIZE, opcode, beginCell().storeBool(enabled).endCell().beginParse());
    return self.toCell();
}

fun Auth.getPublicCapability(self, opcode: Opcode): bool {
    var (publicCapability, found) = self.isCapabilityPublic.uDictGet(OPCODE_SIZE, opcode);
    return found ? publicCapability!.loadBool() : false;
}

fun Auth.setRoleCapability(mutate self, role: RoleMask, opcode: Opcode, enabled: bool) {
    var (roleCapability, found) = self.isCapabilityPublic.uDictGet(OPCODE_SIZE, opcode);
    val currentRoleCapability = (found ? roleCapability!.loadUint(ROLE_SIZE) : 0) as RoleMask;
    val newRoleCapability = enabled ? (currentRoleCapability | 1 << role) : (currentRoleCapability & ~(1 << role));

    self.isCapabilityPublic.uDictSet(OPCODE_SIZE, opcode, beginCell().storeUint(newRoleCapability, ROLE_SIZE).endCell().beginParse());

    return self.toCell();
}

fun Auth.getRoleCapability(self, opcode: Opcode): RoleMask {
    var (roleCapability, found) = self.isCapabilityPublic.uDictGet(OPCODE_SIZE, opcode);    
    return (found ? roleCapability!.loadUint(ROLE_SIZE) : 0) as RoleMask;
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