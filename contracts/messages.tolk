import "role-authority/messages";
import "role-authority/constants/type";

struct (0x7e8764ef) IncreaseCounter {
    queryId: QueryID
    increaseBy: uint32
}

struct (0x3a752f06) ResetCounter {
    queryId: QueryID
}

const OP_INCREASE = IncreaseCounter.getDeclaredPackPrefix();
const OP_RESET = ResetCounter.getDeclaredPackPrefix();

type AllowedMessage = IncreaseCounter | ResetCounter | AuthMessages;