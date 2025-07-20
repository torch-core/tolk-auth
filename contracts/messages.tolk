import "role-authority/messages";
import "role-authority/constants/type";

// the struct uses a 32-bit opcode prefix for message identification
struct (0x7e8764ef) IncreaseCounter {
    queryId: QueryID  // query id, typically included in messages
    increaseBy: uint32
}

struct (0x3a752f06) ResetCounter {
    queryId: QueryID
}

const OP_INCREASE = IncreaseCounter.getDeclaredPackPrefix();
const OP_RESET = ResetCounter.getDeclaredPackPrefix();

// using unions to represent available messages
// this allows processing them with pattern matching
type AllowedMessage = IncreaseCounter | ResetCounter | AuthMessages