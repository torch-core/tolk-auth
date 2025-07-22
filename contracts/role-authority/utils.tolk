import "auth";
import "constants/size";
import "constants/type";

/// @dev Packs a dictionary value (RoleMask or bool) into a slice
/// @param dictValue The value to pack, either a RoleMask or boolean
/// @return slice The packed value as a slice ready for dictionary storage
fun packDictSliceValue(dictValue: RoleMask | bool): slice {
    match (dictValue) {
        RoleMask => return beginCell().storeUint(dictValue, ROLE_MASK_SIZE).endCell().beginParse(),
        bool => return beginCell().storeBool(dictValue).endCell().beginParse(),
    }
}

/// @dev Clears pending owner information after ownership claim or revocation
/// @notice Resets pendingOwner to none and proposeTime to 0
/// @return cell The updated auth state as a cell
fun Auth.clearPendingOwner(mutate self) {
    self.ownerInfo.pendingOwner = createAddressNone();
    self.ownerInfo.proposeTime = 0;

    return self.toCell();
}