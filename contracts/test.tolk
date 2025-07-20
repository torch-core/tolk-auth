tolk 1.0

import "constants/size";
import "constants/type";
import "storage";
import "auth";

// the struct uses a 32-bit opcode prefix for message identification
struct (0x7e8764ef) IncreaseCounter {
    queryId: QueryID  // query id, typically included in messages
    increaseBy: uint32
}

struct (0x3a752f06) ResetCounter {
    queryId: QueryID
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

// using unions to represent available messages
// this allows processing them with pattern matching
type AllowedMessage = IncreaseCounter | ResetCounter | SetUserRole | SetRoleCapability | SetRoleCapability

// the main entrypoint: called when a contract receives an message from other contracts
fun onInternalMessage(in: InMessage) {
    // use `lazy` to defer loading fields until they are accessed
    val msg = lazy AllowedMessage.fromSlice(in.body);

    match (msg) {
        IncreaseCounter => {
            // load contract storage lazily (efficient for large or partial reads/updates)
            var storage = lazy Storage.load();
            storage.counter += msg.increaseBy;
            storage.save();
        }

        ResetCounter => {
            var storage = lazy Storage.load();
            storage.counter = 0;
            storage.save();
        }
        SetUserRole => {
            var storage = lazy Storage.load();
            var auth = lazy storage.auth.load();
            storage.auth = auth.setUserRole(msg.user, msg.role, msg.enabled);
            storage.save();
        }
        SetRoleCapability => {
            var storage = lazy Storage.load();
            var auth = lazy storage.auth.load();
            storage.auth = auth.setRoleCapability(msg.role, msg.opcode, msg.enabled);
            storage.save();
        }
        else => {
            // ignore empty messages, "wrong opcode" for others
            assert (in.body.isEmpty()) throw 0xFFFF
        }
    }
}

// a handler for bounced messages (not used here, may be ommited)
fun onBouncedMessage(in: InMessageBounced) {
}

// get methods are a means to conveniently read contract data using, for example, HTTP APIs
// note that unlike in many other smart contract VMs, get methods cannot be called by other contracts
get fun currentCounter(): int {
    val storage = lazy Storage.load();
    return storage.counter;
}

get fun initialId(): int {
    val storage = lazy Storage.load();
    return storage.id;
}

get fun userRole(user: address): RoleMask {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.getUserRoles(user);
}

get fun roleCapability(opcode: Opcode): RoleMask {
    val storage = lazy Storage.load();
    val auth = lazy storage.auth.load();
    return auth.getRoleCapability(opcode);
}