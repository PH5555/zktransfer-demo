import Note from './note';
import encryption from '../cryptos/encryption';
import mimc from '../cryptos/mimc';
import localStorage from '../../utils/async.storage';
import KeyHelper from '../client/keyHelper';
import { NotesModelInstance } from '../../db';
import types from '../../utils/types';
import Web3 from '../../web3';
import CompiledAzeroth from '../../web3/azeroth/compiled';
// TODO remove
export class Notes {
    /**
     * Init a Notes data
     * @SYNCED_BLOCK_NUM is the number of the current synced block
     * @IS_EXIST_NOTES means whether or not you have a 'notes' table
     *
     * @param {string}          token         Owner's private key, hexadecimal string
     * @param {Azeroth.Contract} azerothContract
     */
    constructor(token, azerothContract) {
        this.penc = new encryption.publicKeyEncryption();
        this.hash = new mimc.MiMC7();
        this.token = token;
        this.azerothContract = azerothContract;
    }

    static async init() {
        if ((await localStorage.getData('@IS_EXIST_NOTES')) !== 'true') {
            console.log(' Notes Init Started...');
            await localStorage.storeData('@SYNCED_BLOCK_NUM', '0');
            await localStorage.storeData('@IS_EXIST_NOTES', 'true');
            console.log('Notes Init Done...');
        } else {
            console.log('Already Notes exists...');
        }
    }

    /**
     *
     * @param {Object}       transferEvent      zkTransferEvent class
     * @returns
     */
    async fecthDataFromBlock(transferEvent) {
        const privKey = (await KeyHelper.getUserPrivKey(this.token));
        let decEventMsg = this.penc.Dec(transferEvent.pCT, privKey, false);
        let idx = await this.computeCmIndex(transferEvent.cm);
        return new Note(
            decEventMsg[0],
            decEventMsg[1],
            decEventMsg[2],
            transferEvent.cm,
            idx,
        );
    }

    /**
     * TODO: Block index, cm index 최적화
     * @param {string}          cm              commitment
     * @returns {Promise<number>}
     */
    async computeCmIndex(cm) {
        const curBlockNum = await this.azerothContract.eth.getBlockNumber();
        let filterParams = {
            'fromBlock': '0',
            'toBlock': curBlockNum,
        };
        const events = await this.getZkTransferEvents(filterParams);
        for (const [idx, value] of events.entries()) {

            let candidateEvent = Web3.Azeroth.structure.ZkTransferEvent.eventArgsToZkTransferEvent(value.returnValues);
            if (cm === candidateEvent.cm) {
                return idx;
            }
        }
        return 0;
    }

    /**
     *
     * @returns     {Promise<string>}         The current synced block number
     */
    async getNextBlockNum() {
        const syncedBlockNum = await localStorage.getData('@SYNCED_BLOCK_NUM');
        return (Number(syncedBlockNum) + 1).toString();
    }

    /**
     *
     * @param {string}          txHash          zkTransfer tx hash, hexadecimal string
     * @param {string}          eventName       The event name to be fetched, the default name is 'LogTrans'
     * @returns {Promise<Object>}                        ZkTransferEvent class
     */
    async getZkTransferEventFromTxHash(txHash, eventName = 'LogTrans') {
        let txEvent;
        let zkTransferEventAbi, zkTransferEvenTopics;
        let receipt = await this.azerothContract.eth.getTransactionReceipt(txHash);

        CompiledAzeroth.abi.forEach(e => {
            if (e.type === 'event' && e.name === eventName) {
                zkTransferEventAbi = e;
                zkTransferEvenTopics = e.signature;
                for (const log of receipt.logs) {
                    if (log.topics[0] === zkTransferEvenTopics) {
                        txEvent = this.azerothContract.eth.abi.decodeLog(zkTransferEventAbi.inputs, receipt.logs[0].data);
                        break;
                    }
                }
            }
        });
        return Web3.Azeroth.structure.ZkTransferEvent.eventArgsToZkTransferEvent(txEvent);
    }

    /**
     *
     * @param {Object}      filterParams            The filter options as follows: fromBlock, toBlock, address, topics. (https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html)
     * @returns {Promise<Object>}                            The event object, which has the data of 'LogTrans' event. Use (e.g., event.c_0, event.c_1)
     */
    async getZkTransferEvents(filterParams) {
        return this.azerothContract.instance.getPastEvents('LogTrans', filterParams);
    }


    /**
     *
     * @param {Object}          fetchOption                 The fecthed option
     * @param {Object}          fetchOption.txHash          - The Array of transaction hashes to be fetched
     * @param {Object}          fetchOption.curBlockNum     - The current block number of the blockchain
     * @returns {Promise<[]>}
     */
    async fetchNotes(fetchOption) {
        let notes = [];
        if (fetchOption.txHash !== null && fetchOption.txHash.length !== undefined) {
            for (let i = 0; i < fetchOption.txHash.length; i++) {
                let zkTransferEvent = await this.getZkTransferEventFromTxHash(fetchOption.txHash[i]);
                notes.push(await this.fetchNote(zkTransferEvent));
            }
        } else {
            let nextBlockNum = await this.getNextBlockNum();
            let filterParams = {
                'fromBlock': nextBlockNum,
                'toBlock': fetchOption.curBlockNum,
            };
            const events = await this.getZkTransferEvents(filterParams);
            const promises = events.map(async (element) => {
                let zkTransferEvent = Web3.Azeroth.structure.ZkTransferEvent.eventArgsToZkTransferEvent(element.returnValues);
                notes.push(await this.fetchNote(zkTransferEvent));
            });
            await Promise.all(promises);
        }
        return notes;
    }

    /**
     *
     * @param {Object}          zkTransferEvent             Event data
     * @returns { Promise<Note | undefined> }
     */
    async fetchNote(zkTransferEvent) {
        let revNote = await this.fecthDataFromBlock(zkTransferEvent);
        if (Note.validNote(this.hash, revNote)) {
            return revNote;
        }
    }

    /**
     *
     * @param {Array}      txHash          Optional, the Array of transaction hashes to be fetched
     * @returns {Promise<boolean>}
     */
    async sync(txHash = null) {
        let curBlockNum = await this.azerothContract.eth.getBlockNumber();
        let fetchOption = {
            'txHash': txHash,
            'curBlockNum': curBlockNum,
        };

        const notes = await this.fetchNotes(fetchOption);
        const promise = notes.map(async (element) => {
            if (element !== undefined && element.bal !== '0') {
                await NotesModelInstance.insertNotes(element.idx, element.open, types.addPrefixHex(element.bal), element.addr, element.cm, 'unspent');
            }
        });
        await Promise.all(promise);

        if (txHash === null || txHash.length === null) {
            await localStorage.storeData('@SYNCED_BLOCK_NUM', curBlockNum.toString());
        }

        return true;
    }

    /**
     *
     * @returns {Promise<Array | undefined>} Unspent note list
     */
    async getUnspentNotes() {
        return NotesModelInstance.selectNotes(
            false,
            {
                type: 'unspent',
            },
            false,
        );
    }

    /**
     *
     * @param {Promise<Note>}    note        A
     */
    async useNote(note) {
        await NotesModelInstance.updateNotes(
            note.idx,
            note.open,
            note.bal,
            note.addr,
            note.cm,
            'spent',
            {
                open: note.open,
            },
        );
    }
}

const notes = (token, azerothContract) => {
    return new Notes(token, azerothContract);
};

export default notes;