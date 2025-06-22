import Web3Interface from '../web3/web3.interface';
import CompiledErc721 from './compiled';
import LocalStorage from '../../utils/async.storage';

export default class Contract extends Web3Interface {
    /**
     *
     * @param {string} endPoint
     * @param {string} deployedAddress
     */
    constructor(endPoint, deployedAddress) {
        super(endPoint);
        this.instance = new this.eth.Contract(CompiledErc721.abi, deployedAddress);
        this.contractMethods = this.instance.methods;
        this.tokenAddress = deployedAddress;
    }

    /**
     *
     * @param {string} owner
     * @returns {Promise<string>}
     */
    async balanceOf(owner) {
        const call = this.contractMethods.balanceOf(owner);
        return this.localContractCall(call);
    }

    /**
     *
     * @param {string} event
     * @param {PastEventOptions} options
     * @returns {Promise<void>}
     */
    async getEvent(event, options){
        return this.instance.getPastEvents(event,options);
    }

    /**
     *
     * @param {string|number|BigInt} tokenId
     * @returns {Promise<string>}
     */
    async ownerOf(tokenId) {
        const call = this.contractMethods.ownerOf(tokenId);
        return this.localContractCall(call);
    }

    /**
     *
     * @return {Promise<[]>}    token Id List
     */
    async totalSupply() {
        return this.contractMethods.totalSupply().call();
    }

    /**
     *
     * @param {string} address  owner address
     * @return {Promise<[]>}
     */
    async getTokensByOwnerAddress(address) {
        const tokens = [];
        const totalSupply = await this.contractMethods.totalSupply().call();
        for (let i = 0; i < totalSupply; i++) {
            const owner = await this.ownerOf(i);
            if (owner.toLowerCase() === address.toLowerCase()) {
                tokens.push(i);
            }
        }
        return tokens;
    }

    // TODO check approve function argument
    async approve(to, tokenId, userEoa, privateKey) {
        const call = await this.contractMethods.setApprovalForAll(to, tokenId);
        return this.sendContractCall(
            call,
            userEoa,
            privateKey,
        );

    }

    async setApproveAll(operator, userEoa, privateKey) {
        const call = await this.contractMethods.setApprovalForAll(operator, true);
        return this.sendContractCall(
            call,
            userEoa,
            privateKey,
        );
    }

    /**
     *
     * @param {string} from     sender's address
     * @param {string} to       receiver's address
     * @param {string|number|BigInt} tokenId
     * @param {string} privateKey not required in test context
     * @param {number} gas
     * @return {Promise<TransactionReceipt>} A promise combined event emitter. Resolves when the transaction receipt is available.
     */
    async transfer(
        from,
        to,
        tokenId,
        privateKey,
        gas,
    ) {
        const tokenIdStringType = (typeof tokenId !== 'string') ? tokenId.toString() : tokenId;
        const call = this.contractMethods.transferFrom(from, to, tokenIdStringType);
        const isTimeout = await LocalStorage.getData('IS_TIMEOUT');
        if(isTimeout === true || isTimeout === 'true') {
            return ;
        }
        return this.sendContractCall(call, from, privateKey, gas);
    }

    /**
     *
     * @param tokenId
     * @return {Promise<*>}
     */
    async getTokenURI(tokenId) {
        const call = this.contractMethods.tokenURI(tokenId);
        return this.localContractCall(call);
    }

    /**
     * Returns the name of the token.
     * @return {Promise<string>}
     */
    async name() {
        return this.localContractCall(
            this.contractMethods.name(),
        );
    }

    /**
     * Returns the symbol of the token, usually a shorter version of the name.
     * @return {Promise<string>}
     */
    async symbol() {
        return this.localContractCall(
            this.contractMethods.symbol(),
        );
    }

    /**
     * @param {string} address      Public address
     * @param {string} privateKey   Public address's key
     * @return {Promise<TransactionReceipt>}
     */
    async mint(address, privateKey) {
        const call = this.contractMethods.mint(address);
        return this.sendContractCall(call, address, privateKey);
    }

    /**
     *
     * @param interfaceId
     * @return {Promise<*>}
     */
    async supportsInterface(interfaceId) {
        const call = this.contractMethods.supportsInterface(interfaceId);
        return this.localContractCall(call);
    }
}
