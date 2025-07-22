import "role-authority/int-messages";
import "role-authority/constants/type";

struct (0x7e8764ef) IncreaseCounter {
    queryId: QueryId
    increaseBy: uint32
}

struct (0x3a752f06) ResetCounter {
    queryId: QueryId
}

const OP_INCREASE = IncreaseCounter.getDeclaredPackPrefix();
const OP_RESET = ResetCounter.getDeclaredPackPrefix();

// Union AuthMessages to AllowedMessage to enable the Auth system.
type AllowedMessage = IncreaseCounter | ResetCounter | AuthMessages;