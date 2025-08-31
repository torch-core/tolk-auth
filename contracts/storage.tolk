import "role-authority/auth";

struct Storage {
    id: uint32
    counter: uint32
    auth: Cell<Auth> // Add Auth struct to contract's storage
}

fun Storage.load() {
    return Storage.fromCell(contract.getData())
}

fun Storage.save(self) {
    contract.setData(self.toCell())
}

// Add this function to update the auth struct in the storage
fun Storage.updateAuth(mutate self, auth: Auth) {
    self.auth = auth.toCell();
    self.save();
}
