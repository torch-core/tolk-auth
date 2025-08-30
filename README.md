# 🔐 Role Authority System for TON

[![Built for TON](https://img.shields.io/badge/Built%20for-TON-0088cc?style=flat-square)](https://ton.org)
[![Language](https://img.shields.io/badge/Language-Tolk-green?style=flat-square)](https://docs.ton.org/v3/documentation/smart-contracts/tolk/overview)

<img width="11214" height="4560" alt="image" src="https://github.com/user-attachments/assets/9cc6ce21-80d1-4af2-825e-38ccfbf4652e" />

The Role Authority system is a role-based authority system designed specifically for TON smart contracts using the Tolk language. It enables developers to easily implement permission management without rewriting similar logic and tests for every project.

This system is inspired by [Solmate's RolesAuthority in Solidity](https://github.com/transmissions11/solmate/tree/main/src/auth) but adapted for TON's characteristics, utilizing efficient bitmask operations for roles.

## ⚠️ Security Notice

**This smart contract has not been audited.** Please exercise caution and perform your own security review before using this code in production. The authors are not responsible for any potential security vulnerabilities or losses that may occur from using this code.

## 🔍 Permission Check Mechanism

When the contract receives an internal message, the system validates the caller (`in.senderAddress`) after reading the opcode. There are three ways to pass the check:

### 👑 Owner

If the caller is the contract's owner, they can execute all opcodes. This serves as the ultimate fallback mechanism, ensuring the owner always has control over the system, even if other permissions fail.

### 🌐 Public Capability

If the opcode is set as public, any address can call it without requiring a specific role. This is suitable for open operations, such as deposit or swap.

### 🎭 Role Capability

Role permissions allow assigning roles to specific opcodes. Only users with matching roles can call them.

For example, in the Counter contract, you can set a "Reset Role" so only addresses with this role can call `OP_RESET`.

To determine if a user can call a specific opcode:

- First, check if the opcode is public. If yes, pass.
- If not, retrieve the user's role mask (`userRoleMask`) and the opcode's allowed role mask (`opRoleMask`).
    - `userRoleMask` represents the combined bitmask of roles the user possesses, retrieved from the `userRoles` dictionary.
    - `opRoleMask` represents the combined bitmask of roles allowed to execute the opcode, retrieved from the `rolesWithCapability` dictionary.
- Then, compute `(userRoleMask & opRoleMask) != 0` to check for intersection. The intersection (&) verifies if any bit is set in both masks, meaning the user has at least one required role.

---

📌 **Example: OP_RESET Role Check**

Roles:

- Role 0 → Guard (`0b0001`)
- Role 1 → Strategist (`0b0010`)
- Role 2 → Reset Role (`0b0100`)

```
Opcode: OP_RESET

userRoleMask:   0b0101   (Role 0 + Role 2)
opRoleMask:     0b0110   (Role 1 + Role 2)
-----------------------------------------
AND result:     0b0100   (Role 2 is common → allowed)

✅ User can call OP_RESET because they hold Reset Role (Role 2).
```

---

👉 See [**Bitmask Operations**](#bitmask-operations) for more details on how this works under the hood.

## 🏗️ Role Authority Architecture

### 📦 Auth Structure

- The `Auth` structure is the core data structure of the permission system, managing the owner and permission dictionaries.
- It supports up to 256 roles, using bitmasks in `RoleMask` (uint256).
- Add this structure to your contract's storage layout

```solidity
struct Auth {
    ownerInfo: OwnerInfo            // Stores ownership data, including current owner, pending owner, and timelock info.
    isCapabilityPublic: dict        // Dict<Opcode, bool>: Indicates if an opcode is public.
    rolesWithCapability: dict       // Dict<Opcode, RoleMask>: Maps each opcode to the roles that are allowed to execute it (an opcode can be assigned to multiple roles).
    userRoles: dict                 // Dict<address, RoleMask>: Maps user addresses to their assigned roles (a user can have multiple roles).
}
```

- `ownerInfo`: Stores ownership transfer-related data, including the current owner, pending owner, propose time, and timelock period.
- `isCapabilityPublic`: Dictionary marking whether opcodes are public.
- `rolesWithCapability`: Dictionary mapping opcodes to allowed role masks.
- `userRoles`: Dictionary mapping user addresses to their role masks.

During contract deployment, initialize the Auth structure with the owner and timelock period.

### 👤 OwnerInfo Structure

`OwnerInfo` encapsulates ownership transfer information, including timelock parameters:

```solidity
struct OwnerInfo {
    owner: address                  // Address of the contract owner, who also manages the authority logic.
    pendingOwner: address           // Address of the pending owner, who can claim the ownership after the timelock period.
    timelockPeriod: Timestamp = 0   // Timelock period for the ownership can be claimed.
    proposeTime: Timestamp = 0      // Timestamp of the ownership proposal.
}
```

- `owner`: The current contract owner address with full control.
- `pendingOwner`: The pending owner address (null indicates no pending transfer).
- `timelockPeriod`: The timelock duration for ownership transfer (in seconds, e.g., 86400 seconds = 1 day).
- `proposeTime`: The timestamp of the ownership transfer proposal (0 indicates no proposal).

## ⚙️ Setting Public Opcodes

Send a `OP_SET_PUBLIC_CAPABILITY` message to set whether an opcode is publicly callable.

```solidity
struct (0x714a73bb) SetPublicCapability {
    queryId: QueryID
    opcode: Opcode      // Target opcode to set public access for
    enabled: bool       // Whether to enable or disable public access to the opcode
}
```

- Updates the `isCapabilityPublic` dictionary with the `enabled` bool value for the opcode.
- Initially, only the owner can set this; later, roles can be assigned for others.
- Emits a `TOPIC_PUBLIC_CAPABILITY_UPDATED` event with the opcode and enabled status.

## 🔧 Role and Permission Management

### Step 1: Assign Role Permissions to Opcodes

Send a `OP_SET_ROLE_CAPABILITY` message to assign or remove role permissions for opcodes:

```solidity
struct (0xc6012bd0) SetRoleCapability {
    queryId: QueryID
    opcode: Opcode      // Target opcode to set the capability for
    role: RoleId        // Set this role to have the capability for the opcode
    enabled: bool       // Whether to enable or disable the role capability
}
```

### Step 2: Assign Roles to Users

Send a `OP_SET_USER_ROLE` message to assign or remove roles for users:

```solidity
struct (0xdd28b73e) SetUserRole {
    queryId: QueryID
    user: address       // Target user to set the role for
    role: RoleId        // Grant this role to the user
    enabled: bool       // Whether to enable or disable the user role
}
```

### Note: RoleId Specification

- `RoleId` is defined as `uint8`.
- This allows up to **2^8 = 256 distinct roles** to be supported.

### Bitmask Operations

#### ✅ Enable a Role

To **enable** a role, set the corresponding bit in the bitmask using bitwise OR:

```ts
mask = mask | (1 << role);
```

📌 **Example: Enable Role 2 on mask `0b0001` (currently only Role 0 enabled)**

- `1 << 2` = `0b0100` → this is the bitmask for **Role 2**
- `0b0001 | 0b0100` = `0b0101` → now **Role 0 and Role 2 are enabled**

#### ❌ Disable a Role

To **disable** a role, clear the corresponding bit using bitwise AND with the inverse:

```ts
mask = mask & ~(1 << role);
```

📌 **Example: Disable Role 2 from mask `0b0101` (currently Role 0 and Role 2 enabled)**

- `1 << 2` = `0b0100` → bitmask for **Role 2**
- `~(1 << 2)` = `~0b0100` = `0b1011`
- `0b0101 & 0b1011` = `0b0001` → now only **Role 0 is enabled**

Events are emitted for tracking: `TOPIC_ROLE_CAPABILITY_UPDATED` for opcode permissions and `TOPIC_USER_ROLE_UPDATED` for user roles.

# 🔄 Ownership Transfer

Ownership transfer is implemented as a two-stage process with a timelock for security.

**Process**:

- The current owner sends a `OP_PROPOSE_OWNERSHIP` message specifying the new owner.
    - The new owner is recorded in `pendingOwner`.
    - `proposeTime` is set to the current timestamp.
    - Emits an `TOPIC_OWNERSHIP_PROPOSED` event.
- The pending owner can claim ownership via ClaimOwnership.
    - Must wait until `proposeTime + timelockPeriod` has passed.
    - Emits an `TOPIC_OWNERSHIP_CLAIMED` event.
- The current owner (or guardians) can send `OP_REVOKE_PENDING_OWNERSHIP` to cancel the transfer.

The `timelockPeriod` is set during contract deployment.

# 👀 Get Methods

The `get-methods.tolk` file in the `role-authority` folder implements the following get methods:

- `ownerInfo()`: Returns with owner, pendingOwner, proposeTime, timelockPeriod.
- `hasPublicCapability(opcode: Opcode)`: Checks if the opcode is public.
- `hasCapability(role: RoleId, opcode: Opcode)`: Checks if the role has permission for the opcode.
- `hasRole(user: address, role: RoleId)`: Checks if the user has the role.

These get methods are optional; you can read the contract state off-chain to achieve the same results.

# 🚀 Integration Guide

To integrate the Role Authority system into your TON contract:

1. Copy the [role-authority folder](https://github.com/ipromise2324/tolk-auth/tree/main/contracts/role-authority) into your contract directory.
2. Add the `Auth` structure to your contract's storage layout and implement the `setAuth` function:

    ```solidity
    import "role-authority/auth";

    struct Storage {
        id: uint32
        counter: uint32
        auth: Cell<Auth> // Add Auth struct to contract's storage
    }

    // Add this function to set the auth struct in the storage
    fun Storage.setAuth(mutate self, auth: Auth) {
        self.auth = auth.toCell();
        self.save();
    }
    ```

3. Add `AuthMessages` to your `AllowedMessage` union:

    ```solidity
    import "../role-authority/messages/allowed";

    // Union AuthMessages to AllowedMessage to enable the Auth system.
    type AllowedMessage = IncreaseCounter | ResetCounter | AuthMessages;
    ```

4. In `onInternalMessage`, add match cases for `AuthMessages`:

    ```solidity
    import "role-authority/auth";
    import "role-authority/access";
    import "role-authority/messages/allowed"
    import "role-authority/messages/schemas/set-public-capability"
    import "role-authority/messages/schemas/set-role-capability"
    import "role-authority/messages/schemas/set-user-role"
    import "role-authority/messages/schemas/ownership"
    import "role-authority/messages/emit";
    import "role-authority/get-methods";

    /* Auth internal messages */
    SetPublicCapability => {
        auth.requireAuth(in.senderAddress, OP_SET_PUBLIC_CAPABILITY);
        auth.setPublicCapability(inMsg.opcode, inMsg.enabled);
        storage.setAuth(auth);
    }
    SetRoleCapability => {
        auth.requireAuth(in.senderAddress, OP_SET_ROLE_CAPABILITY);
        auth.setRoleCapability(inMsg.role, inMsg.opcode, inMsg.enabled);
        storage.setAuth(auth);
    }
    SetUserRole => {
        auth.requireAuth(in.senderAddress, OP_SET_USER_ROLE);
        auth.setUserRole(inMsg.user, inMsg.role, inMsg.enabled);
        storage.setAuth(auth);
    }
    ProposeOwnership => {
        auth.requireAuth(in.senderAddress, OP_PROPOSE_OWNERSHIP);
        auth.proposeOwnership(inMsg.newOwner, blockchain.now());
        storage.setAuth(auth);
    }
    ClaimOwnership => {
        auth.requirePendingOwner(in.senderAddress);
        auth.requireTimelockPassed();
        auth.ownerInfo.owner = in.senderAddress;
        emitOwnershipClaimed(in.senderAddress);
        auth.clearPendingOwner();
        storage.setAuth(auth);
    }
    RevokePendingOwnership => {
        auth.requireAuth(in.senderAddress, OP_REVOKE_PENDING_OWNERSHIP);
        emitOwnershipRevoked(in.senderAddress, auth.ownerInfo.pendingOwner);
        auth.clearPendingOwner();
        storage.setAuth(auth);
    }
    ```

5. Determine which opcodes should be public, which require specific roles, and assign roles to addresses accordingly.

# 🏃 How to Run

```
git clone https://github.com/ipromise2324/tolk-auth.git
cd tolk-auth
pnpm install
pnpm test
```

# 📞 Contact

If you have any questions or want to discuss, feel free to reach out:

- Email: maxeyliu2324@pm.me
- Telegram: https://t.me/throwunless
- TON Wallet: [UQDEFvtKVgB_xdwboASN3Eg05t3TTY84grE_Zc3lPZznnwcG](https://tonviewer.com/UQDEFvtKVgB_xdwboASN3Eg05t3TTY84grE_Zc3lPZznnwcG)
