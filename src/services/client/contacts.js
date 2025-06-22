import { ContactsModelInstance } from '../../db';
import Constants from '../../utils/constants';
import _ from 'lodash';


// TODO refactor feature<User>

/**
 * A contact object
 * @typedef {Object} Contact
 * @property {string} name
 * @property {string} eoa
 */

/**
 * Returns a first contact which satisfies query condition
 * @param {Object} where Query condition
 * @returns {Promise<Contact | undefined>} A contact object
 */
export async function getUserContact(where) {
    const contact = _.at(await ContactsModelInstance.selectContacts(false, where), 0);

    if (_.isNil(contact)) {
        // TODO: error constant
        return undefined;
    }
    return contact[0];
}

/**
 * Returns a current user's contact
 * @returns {Promise<Contact | undefined>} A contact object
 */
export async function getCurrentUserContact() {
    // current user's contact must be stored in first
    return getUserContact({ id: 1 });
}

/**
 * Returns a user's name which satisfies query condition
 * @param {Object} where Query condition
 * @returns {Promise<string>} User name or default if failed
 */
export async function getUserName(where) {
    const contactName = _.get(await getUserContact(where), 'name');

    if (_.isNil(contactName)) {
        return Constants.CONTACT_DEFAULT_NAME;
    }
    return contactName;
}

/**
 * Returns a current user's name
 * @returns {Promise<string>} Current user name or default if failed
 */
export async function getCurrentUserName() {
    // current user's contact must be stored in first
    return getUserName({ id: 1 });
}

/**
 * Update a user's name which satisfies query condition
 * @param {string} name A user's name
 * @param {Object} where Query condition
 */
export async function updateUserName(name, where) {
    const contact = await getUserContact(where);
    if (contact) {
        const update = { ...contact, name };
        console.log(update, where);
        return ContactsModelInstance.updateContacts(update, where);
    }
}

/**
 * Update current user's name
 * @param {string} name A user's name
 */
export async function updateCurrentUserName(name) {
    // current user's contact must be stored in first
    return updateUserName(name, { id: 1 });
}

/**
 * Returns contacts list in DB excluding current user's contact
 * @returns {Promise<Array.<Contact>>} Contacts list
 */
export async function getContacts() {
    const contacts = await ContactsModelInstance.selectContacts();

    return contacts.slice(1);
}

/**
 * Delete a contact
 * @param {Contact} contact A contact object
 */
export async function deleteContact(contact) {
    const contactId = _.get(contact, 'id');

    if (_.isNil(contactId)) {
        throw new Error('Invalid Contact Object');
    }
    return ContactsModelInstance.deleteContacts({ id: contactId });
}

/**
 * Insert a contact
 * @param {Contact} contact A contact object
 */
export async function insertContact(contact) {
    return ContactsModelInstance.insertContacts(contact);
}

/**
 * Returns validity of a contact.
 * Note that this does not check contact name existance.
 * @param {Contact} contact A contact object
 * @returns {boolean}
 */
export function isValidContact(contact) {
    if (!contact) {
        return false;
    }
    return (
        !!contact
    );
}

const Contacts = {
    getUserContact,
    getUserName,
    updateUserName,
    getCurrentUserContact,
    getCurrentUserName,
    updateCurrentUserName,
    getContacts,
    deleteContact,
    insertContact,
    isValidContact,
};

export default Contacts;