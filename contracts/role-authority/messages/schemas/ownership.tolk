import "../../../constants/type"

struct (0x9c25dd71) ProposeOwnership {
    queryId: QueryId
    newOwner: address
}

struct (0xb835b5cb) ClaimOwnership {
    queryId: QueryId
}

struct (0x3d89e313) RevokePendingOwnership {
    queryId: QueryId
}

// Logs
struct(0x261921b7) OwnershipProposed {
    currentOwner: address
    pendingOwner: address
    proposeTime: Timestamp
    timelockPeriod: Timestamp
}

struct(0x5aab7991) OwnershipClaimed {
    newOwner: address
}

struct(0x4f2bd7df) OwnershipRevoked {
    revoker: address
    revokedPendingOwner: address
}

/* Auth external messages topics */
const TOPIC_OWNERSHIP_PROPOSED = OwnershipProposed.getDeclaredPackPrefix();
const TOPIC_OWNERSHIP_CLAIMED = OwnershipClaimed.getDeclaredPackPrefix();
const TOPIC_OWNERSHIP_REVOKED = OwnershipRevoked.getDeclaredPackPrefix();
