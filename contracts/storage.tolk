import "role-authority/auth";

struct Storage {
    id: uint32
    counter: uint32
    auth: Cell<Auth>
}

fun Storage.load() {
    return Storage.fromCell(contract.getData())
}

fun Storage.save(self) {
    contract.setData(self.toCell())
}
