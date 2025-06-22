import Notes from '../model/Notes';
import Contacts from '../model/Contacts';
import Erc20 from '../model/Erc20';
import Nft from '../model/Nft';
import AddressNft from '../model/AddressNft';
import Transaction from '../model/Transaction';
export const NotesModelInstance = new Notes();
export const ContactsModelInstance = new Contacts();
export const Erc20ModelInstance = new Erc20();
export const NftModelInstance = new Nft();
export const AddressNftInstance = new AddressNft();
export const TransactionInstance = new Transaction();
export const createTable = async () => {
    await Promise.all([
        NotesModelInstance.createNotesTable(),
        ContactsModelInstance.createContactsTable(),
        Erc20ModelInstance.createErc20Table(),
        NftModelInstance.createNftTable(),
        AddressNftInstance.createAddrTable(),
    ]);
};

export const dropTable = async () => {
    await Promise.all([
        NotesModelInstance.dropNotes(),
        ContactsModelInstance.dropContacts(),
        Erc20ModelInstance.dropToken(),
        NftModelInstance.dropNft(),
        AddressNftInstance.dropAddr(),
    ]);
};

const dbModelInstances = {
    NotesModelInstance,
    ContactsModelInstance,
    Erc20ModelInstance,
    NftModelInstance,
};


export default dbModelInstances;
