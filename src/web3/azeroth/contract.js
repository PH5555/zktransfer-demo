import Web3Interface from '../web3/web3.interface';
import Constants from '../constants';
import CompiledAzeroth from './compiled';
import ZkTransferParam from './struct/zkTransferParam';
import ZkTransferEvent from './struct/zkTransferEvent';
import Encryption from '../../services/cryptos/encryption';
import types from '../../utils/types';
import Note from './struct/note';
import Mimc from '../../services/cryptos/mimc';
import LocalStorage from '../../utils/async.storage';
import Keys from './struct/keys';
import Curve from '../../services/cryptos/curve';

export default class Contract extends Web3Interface {
    constructor(endpoint, deployedAddress) {
        super(endpoint);
        this.instance = new this.eth.Contract(CompiledAzeroth.abi, deployedAddress);
        this.contractMethods = this.instance.methods;
        this.contractAddress = deployedAddress;
    }

    /**
     *
     * @param {string} tokenAddress
     * @param {string} userEthAddress
     * @param {string} userEthPrivateKey
     * @param {number} gas
     * @return {Promise<TransactionReceipt>}
     */
    async registerToken(
        tokenAddress,
        userEthAddress,
        userEthPrivateKey,
        gas = Constants.DEFAULT_REGISTER_GAS,
    ) {
        return this.sendContractCall(
            this.contractMethods.registerToken(tokenAddress),
            userEthAddress,
            userEthPrivateKey,
            gas,
        );
    }

    /**
     *
     * @param {Array | {x: BigInt, y: BigInt}} auditorPublicKey
     * @param {string} userEthAddress
     * @param {string} userEthPrivateKey
     * @param {number} gas
     * @return {Promise<TransactionReceipt>}
     */
    async registerAuditor(
        auditorPublicKey,
        userEthAddress,
        userEthPrivateKey,
        gas = Constants.DEFAULT_REGISTER_GAS,
    ) {
        const apk = Array.isArray(auditorPublicKey) ? auditorPublicKey : [
            auditorPublicKey.x.toString(16),
            auditorPublicKey.y.toString(16),
        ];
        return this.sendContractCall(
            this.contractMethods.registerAuditor(apk),
            userEthAddress,
            userEthPrivateKey,
            gas,
        );
    }

    /**
     *
     * @param {object} userPk
     * @param {string} userPk.ena
     * @param {string} userPk.pkOwn
     * @param {{x:BigInt | string, y: BigInt | string}} userPk.pkEnc
     * @param {string} userEthAddress
     * @param {string} userEthPrivateKey
     * @param {number} gas
     * @return {Promise<TransactionReceipt>}
     */
    async registerUser(
        userPk,
        userEthAddress,
        userEthPrivateKey,
        gas = Constants.DEFAULT_REGISTER_GAS,
    ) {
        return this.sendContractCall(
            this.contractMethods.registerUser(
                types.addPrefixAndPadHex(userPk.ena),
                types.addPrefixAndPadHex(userPk.pkOwn),
                types.addPrefixAndPadHexFromArray([
                    types.addPrefixAndPadHex(userPk.pkEnc.x.toString(16)),
                    types.addPrefixAndPadHex(userPk.pkEnc.y.toString(16)),
                ]),
            ),
            userEthAddress,
            userEthPrivateKey,
            gas,
        );
    }

    /**
     *
     * @param {object | ZkTransferParam} zkTransferParams
     * @param {string} userEthAddress
     * @param {string} txValue
     * @param {string} userEthPrivateKey
     * @param {number} gas
     * @return {Promise<TransactionReceipt>}
     */
    async zkTransfer(
        zkTransferParams,
        userEthAddress,
        txValue = '0',
        userEthPrivateKey,
        gas = Constants.DEFAULT_ZK_TRANSFER_GAS,
    ) {
        const param = (zkTransferParams.toContractArgs)
            ? zkTransferParams.toContractArgs()
            : (new ZkTransferParam(...zkTransferParams)).toContractArgs();

        const isTimeout = await LocalStorage.getData('IS_TIMEOUT');
        if(isTimeout === true || isTimeout === 'true') {
            return ;
        }
        return this.sendContractCall(
            this.contractMethods.zkTransfer(...param),
            userEthAddress,
            userEthPrivateKey,
            gas,
            txValue && this.utils.toWei(txValue, 'wei'),
        );
    }

    /**
     *
     * @param {object | ZkTransferParam} zkTransferParams
     * @param {string} userEthAddress
     * @param {string} userEthPrivateKey
     * @param {number} gas
     * @return {Promise<TransactionReceipt>}
     */
    async zkTransferNft(
        zkTransferParams,
        userEthAddress,
        userEthPrivateKey,
        gas = Constants.DEFAULT_ZK_TRANSFER_GAS,
    ) {

        const param = (zkTransferParams.toContractArgs)
            ? zkTransferParams.toContractArgs()
            : (new ZkTransferParam(...zkTransferParams)).toContractArgs();

        const isTimeout = await LocalStorage.getData('IS_TIMEOUT');
        if(isTimeout === true || isTimeout === 'true') {
            return ;
        }
        return this.sendContractCall(
            this.contractMethods.zkTransferNft(...param),
            userEthAddress,
            userEthPrivateKey,
            gas,
        );
    }

    async getRootTop() {
        return this.localContractCall(
            this.contractMethods.getRootTop(),
        );
    }

    async getAPK() {
        const rawApk = await this.localContractCall(
            this.contractMethods.getAPK(),
        );
        return new Keys.AuditKey(
            new Curve.AffinePoint(rawApk[0][0], rawApk[0][1]),
            '',
        );
    }

    /**
     *
     * @param {string}     tokenAddress        The token address
     * @param {string}     ena                 address
     * @returns {Promise<sCT>}                 The user's encrypted account data
     */
    async getCiphertext(tokenAddress, ena) {
        const rawsCT = await this.localContractCall(
            this.contractMethods.getCiphertext(tokenAddress, types.addPrefixAndPadHex(ena)),
        );

        return new Encryption.sCT(
            types.decStrToHex(rawsCT[1]),
            types.decStrToHex(rawsCT[0]),
        );
    }

    async viewValue() {
        return this.localContractCall(
            this.contractMethods.viewValue(),
        );
    }


    /**
     *
     * @param {Object}      filterParams            The filter options as follows: fromBlock, toBlock, address, topics. (https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html)
     * @returns {Promise<Object>}                            The event object, which has the data of 'LogTrans' event. Use (e.g., event.c_0, event.c_1)
     */
    async getZkTransferEvents(filterParams) {
        return this.instance.getPastEvents('LogZkTransfer', filterParams);
    }

    /**
     *
     * @param {Object}      filterParams            The filter options as follows: fromBlock, toBlock, address, topics. (https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html)
     * @returns {Promise<Object>}                            The event object, which has the data of 'LogTrans' event. Use (e.g., event.c_0, event.c_1)
     */
    async getZkTransferNftEvents(filterParams) {
        return this.instance.getPastEvents('LogZkTransferNft', filterParams);
    }


    // TODO getNotesFromBlockNum 함수 합치기
    /**
     * get the list of ft notes that the user has [fromBlockNum] to [currentBlockNum]
     * @param {string} userPrivateKey Key.User.sk
     * @param {string} fromBlockNum String type number (ex: Number(data).toString()) default: '0'
     * @param {string} toBlockNum String type number (ex: Number(data).toString())
     * @param {string} tokenAddress if tokenAddress is empty, return notes for all tokens
     * @return {Promise<[]>}
     */
    async getFtNotesFromBlockNum(userPrivateKey, fromBlockNum = '0', toBlockNum, tokenAddress) {
        const publicKeyEncryption = new Encryption.publicKeyEncryption();
        // get all transfer events
        const events = await this.getZkTransferEvents({
            fromBlock: fromBlockNum,
            toBlock: toBlockNum,
        });

        const notes = [];

        for (const [idx, e] of events.entries()) {
            const zkTransferEvent = ZkTransferEvent.eventArgsToZkTransferEvent(e.returnValues);

            if (tokenAddress) {
                // check token address
                if (zkTransferEvent.tokenAddress !== tokenAddress) {
                    continue;
                }
            }
            // try decryption note
            const decrypedEventMsg = publicKeyEncryption.Dec(zkTransferEvent.pCT, userPrivateKey, false);
            const note = new Note(
                decrypedEventMsg[0],
                decrypedEventMsg[1],
                decrypedEventMsg[2],
                zkTransferEvent.cm,
                (Number(zkTransferEvent.index) - 1).toString(),
                zkTransferEvent.tokenAddress,
            );

            // check is User's note ?
            if (note.isValid()) {
                note.isSpent = await this.isSpentNote(userPrivateKey, note.cm);
                notes.push(note);
            }
        }
        return notes;
    }

    /**
     * get the list of nft notes that the user has [fromBlockNum] to [currentBlockNum]
     * @param {string} userPrivateKey Key.User.sk
     * @param {string} fromBlockNum String type number (ex: Number(data).toString()) default: '0'
     * @param {string} toBlockNum String type number (ex: Number(data).toString())
     * @return {Promise<[]>}
     */
    async getNftNotesFromBlockNum(userPrivateKey, fromBlockNum = '0', toBlockNum) {
        const publicKeyEncryption = new Encryption.publicKeyEncryption();
        const currentBlockNum = toBlockNum;

        // get all transfer events
        const events = await this.getZkTransferNftEvents({
            fromBlock: fromBlockNum,
            toBlock: currentBlockNum,
        });

        const notes = [];

        for (const [idx, e] of events.entries()) {
            const zkTransferEvent = ZkTransferEvent.eventArgsToZkTransferEvent(e.returnValues);
            // try decryption note
            const decrypedEventMsg = publicKeyEncryption.Dec(zkTransferEvent.pCT, userPrivateKey, false);
            const note = new Note(
                decrypedEventMsg[0],
                decrypedEventMsg[1],
                decrypedEventMsg[2],
                zkTransferEvent.cm,
                (Number(zkTransferEvent.index) - 1).toString(),
                zkTransferEvent.tokenAddress,
            );

            // check is User's note ?
            if (note.isValid()) {
                note.isSpent = await this.isSpentNote(userPrivateKey, note.cm);
                notes.push(note);
            }
        }
        return notes;
    }

    /**
     *
     * @param {string} tokenAddress
     * @param {UserKey} userKey
     * @return {Promise<string>}
     */
    async getEnaBalance(tokenAddress, userKey) {
        const _tokenAddress = tokenAddress || Constants.ZERO_ADDRESS;
        const symmetricKeyEnc = new Encryption.symmetricKeyEncryption(userKey.sk);
        const sCT = await this.getCiphertext(_tokenAddress, types.addPrefixAndPadHex(userKey.pk.ena));
        const balance = sCT.empty() ? '0' : symmetricKeyEnc.Dec(sCT);
        return types.hexStrToDec(balance);
    }

    async getMerklePath(index) {
        const intermediateHashes = [];
        await this.localContractCall(
            this.contractMethods.getMerklePath(index),
        ).then(e => {
            e.forEach(e => {
                intermediateHashes.push(types.decStrToHex(e));
            });
        });
        return intermediateHashes;
    }

    /**
     * get User PubKey {ena, pkOwn, pkEnc}
     *
     * @param {string} eoa Public Address
     * @return {Promise<Object>}
     */
    async getUserPublicKeys(eoa) {
        const rawData = await this.localContractCall(
            this.contractMethods.getUserPublicKeys(
                eoa,
            ),
        ).catch(e => {
            return ['0x0', '0x0', {x: '0x0', y: '0x0'}];
        });

        return {
            ena: this.utils.toHex(rawData[0]),
            pkOwn: this.utils.toHex(rawData[1]),
            pkEnc: {x: this.utils.toHex(rawData[2][0]), y: this.utils.toHex(rawData[2][1])}
        };
    }

    /**
     *
     * @param {string} enaSecretKey
     * @param {string} cm
     * @return {Promise<boolean>}
     */
    async isSpentNote(enaSecretKey, cm) {
        const mimc7 = new Mimc.MiMC7();
        const nf = mimc7.hash(cm, enaSecretKey);
        return this.localContractCall(
            this.contractMethods.isNullified(
                types.addPrefixAndPadHex(nf),
            ),
        );
    }

    /**
     * Returns true if ENA exists, false otherwise.
     * @param {string} eoa Public Address
     * @return {Promise<boolean>}
     */
    async isExistEnaAccount(eoa) {
        const userPublicKeyFromContract = await this.getUserPublicKeys(eoa);
        return userPublicKeyFromContract.ena !== '0x0';
    }
}
