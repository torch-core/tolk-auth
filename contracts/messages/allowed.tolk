import "schemas"
import "../role-authority/messages/internal/schemas"

type AllowedMessage = IncreaseCounter | ResetCounter | AuthMessages;

const OP_INCREASE = IncreaseCounter.getDeclaredPackPrefix();
const OP_RESET = ResetCounter.getDeclaredPackPrefix();