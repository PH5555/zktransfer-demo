import mimc from '../../../services/cryptos/mimc';

export class Note {
    constructor(open, bal, addr, cm, idx, tokenAddress) {
        this.open = open;
        this.bal = bal;
        this.addr = addr;
        this.cm = cm;
        this.idx = idx;
        this.tokenAddress = tokenAddress;
        this.isSpent = false;
    }

    toJson() { return JSON.stringify(this, null, 2); }

    static fromJson(noteJson) {
        let dataJson = JSON.parse(noteJson);
        return new Note(
            dataJson.open,
            dataJson.bal,
            dataJson.addr,
            dataJson.cm,
            dataJson.idx,
            dataJson.tokenAddress,
            dataJson.isSpent,
        );
    }
    /**
     * The validation check of the note
     *
     * @param {Object}      hash        The hash object
     * @param {Object}      note        The note to be checked
     * @returns
     */
    static validNote(hash, note) {
        let hashed = hash.hash(note.open, note.bal, note.addr);
        return hashed === note.cm;
    }

    isValid() {
        const hash = new mimc.MiMC7();
        return this.cm === hash.hash(this.open, this.bal, this.addr);
    }
}

export class NoteError extends Error {
    constructor(errorData, message) {
        super(message);
        this.name = 'NoteError';
        this.errorData = errorData;
    }

    show() {
        console.log(this.name, this.errorData);
        console.log(this.message);
    }

}

export default Note;