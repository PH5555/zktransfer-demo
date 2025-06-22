import localStorage from '../../utils/async.storage';
import Web3 from '../../web3';
import { NotesModelInstance } from '../../db';

async function noteStorageSetup() {
    const syncedFtBlockNum = await localStorage.getData('@SYNCED_FT_BLOCK_NUM');
    const syncedNftBlockNum = await localStorage.getData('@SYNCED_NFT_BLOCK_NUM');
    if ( syncedFtBlockNum !== null){
        return;
    }
    await localStorage.storeData('@SYNCED_FT_BLOCK_NUM', '1');
    await localStorage.storeData('@SYNCED_NFT_BLOCK_NUM', '1');
}


// TODO fet FT/NFT Note function 합치기
/**
 *
 * @param {string} enaPrivateKey
 * @return {Promise<[]>}
 */
async function getFTUnSpentNotes(enaPrivateKey) {
    // await localStorage.storeData('@SYNCED_FT_BLOCK_NUM', '1');
    // await NotesModelInstance.dropNotes();
    // await NotesModelInstance.createNotesTable();

    const notes = [];
    const web3 = Web3.Azeroth.azerothContract;
    const fromBlockNum = await localStorage.getData('@SYNCED_FT_BLOCK_NUM');
    const currentBlockNum = await web3.eth.getBlockNumber();

    const notesFromDb = await NotesModelInstance.selectNotes(false, {isSpent: false, type: 'FT'}, false);
    for (const note of notesFromDb) {
        const isSpent = await web3.isSpentNote(enaPrivateKey, note.cm);
        if ((note.isSpent !== 0) !== isSpent) {
            note.isSpent = isSpent;
            await NotesModelInstance.updateNotes(note, {id: note.id});
        }
        if(!note.isSpent) {
            notes.push(note);
        }
    }
    const rawNotes = await web3.getFtNotesFromBlockNum(enaPrivateKey, fromBlockNum, currentBlockNum);
    for (const rawNote of rawNotes) {
        if ( rawNote.isSpent || !parseInt(rawNote.bal, 16)) {
            continue;
        }
        rawNote.bal = '0x' + rawNote.bal;

        if (!rawNote.tokenAddress || rawNote.tokenAddress === '0' || rawNote.tokenAddress === '0x0000000000000000000000000000000000000000') {
            rawNote.tokenAddress = '0x0000000000000000000000000000000000000000';
            rawNote.bal = web3.utils.fromWei(rawNote.bal);
        }
        await NotesModelInstance.insertNotes(
            Object.assign(rawNote, {type: 'FT'} )
        );
        notes.push(rawNote);
    }
    if (fromBlockNum !== (currentBlockNum + 1).toString()) {
        await localStorage.storeData('@SYNCED_FT_BLOCK_NUM', (currentBlockNum + 1).toString());
    }
    return notes;
}

/**
 *
 * @param {string} enaPrivateKey
 * @return {Promise<[]>}
 */
async function getNFTUnSpentNotes(enaPrivateKey) {
    // await localStorage.storeData('@SYNCED_NFT_BLOCK_NUM', '1');
    // await NotesModelInstance.dropNotes();
    // await NotesModelInstance.createNotesTable();

    const notes = [];
    const web3 = Web3.Azeroth.azerothContract;
    const fromBlockNum = await localStorage.getData('@SYNCED_NFT_BLOCK_NUM');
    const currentBlockNum = await web3.eth.getBlockNumber();

    const notesFromDb = await NotesModelInstance.selectNotes(false, {isSpent: false, type: 'NFT'}, false);
    for (const note of notesFromDb) {
        const isSpent = await web3.isSpentNote(enaPrivateKey, note.cm);
        if ((note.isSpent !== 0) !== isSpent) {
            note.isSpent = isSpent;
            await NotesModelInstance.updateNotes(note, {id: note.id});
        }
        if(!note.isSpent) {
            notes.push(note);
        }
    }

    const rawNotes = await web3.getNftNotesFromBlockNum(enaPrivateKey, fromBlockNum, currentBlockNum);
    for (const rawNote of rawNotes) {
        if ( rawNote.isSpent || !parseInt(rawNote.bal, 16)) {
            continue;
        }
        await NotesModelInstance.insertNotes(
            Object.assign(rawNote, {type: 'NFT'} )
        );
        notes.push(rawNote);
    }
    if (fromBlockNum !== (currentBlockNum+1).toString()) {
        await localStorage.storeData('@SYNCED_NFT_BLOCK_NUM', (currentBlockNum+1).toString());
    }
    return notes;
}

async function setSpentNote(note, isSpent) {
    await NotesModelInstance.updateNotes({
        idx: note.idx,
        open: note.open,
        bal: note.bal,
        addr: note.addr,
        cm: note.cm,
        tokenAddress: note.tokenAddress,
        isSpent: isSpent
    }, {
        open: note.open
    });
}

const noteServices = {
    noteStorageSetup,
    getFTUnSpentNotes,
    getNFTUnSpentNotes,
    setSpentNote,
};

export default noteServices;
