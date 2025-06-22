import Web3Interface from '../web3/web3.interface';
import CompiledErc1155 from './compiled';
import LocalStorage from '../../utils/async.storage';
export default class Contract extends Web3Interface {
    /**
     *
     * @param {string} endPoint
     * @param {string} deployedAddress
     */
    constructor(endPoint, deployedAddress) {
        super(endPoint);
        this.instance = new this.eth.Contract(CompiledErc1155.abi, deployedAddress);
        this.contractMethods = this.instance.methods;
        this.tokenAddress = deployedAddress;
    }

    // TODO ERC 1155 link contract function
    /**
     *
     * @param {string} owner
     * @param {string|number|BigInt} tokenId
     * @returns {Promise<string>}
     */
    async balanceOf(owner, tokenId) {
        const call = this.contractMethods.balanceOf(owner, tokenId);
        return this.localContractCall(call);
    }

    /**
     *
     * @param {string|Array} owner
     * @param {Array}tokenIds
     * @returns {Promise<*>}
     */
    async balanceOfBatch(owner, tokenIds) {

        const owners = (typeof(owner) === 'object')? owner : new Array(tokenIds.length).fill(owner);
        const call = this.contractMethods.balanceOfBatch(owners, tokenIds);
        return this.localContractCall(call);
    }

    /**
     *
     * @return {Promise<[]>}    token Id List
     */
    async totalSupply(tokenIds) {
        return this.contractMethods.totalSupply(tokenIds).call();
    }

    // TODO In NFT115, This function can't use. replace this or remove
    // /**
    //  *
    //  * @param {string} address  owner address
    //  * @return {Promise<[]>}
    //  */
    // async getTokensByOwnerAddress(address) {
    //     const tokens = [];
    //     const totalSupply = await this.contractMethods.totalSupply().call();
    //     for (let i = 0; i < totalSupply; i++) {
    //         const owner = await this.ownerOf(i);
    //         if (owner.toLowerCase() === address.toLowerCase()) {
    //             tokens.push(i);
    //         }
    //     }
    //     return tokens;
    // }

    // TODO using with getTOkenByOwnerAddress
    // /**
    //  *
    //  * @param {number} fromBlock
    //  * @param {string} toBlock
    //  * @returns {Promise<void>}
    //  */
    // async eventListener(fromBlock, toBlock='latest') {
    //
    //     let options = {
    //         // filter: {
    //         //     value: ['1000', '1337']    //Only get events where transfer value was 1000 or 1337
    //         // },
    //         fromBlock: fromBlock,                  //Number || "earliest" || "pending" || "latest"
    //         toBlock: toBlock
    //     };
    //
    //     const result = await this.eth.subscribe('logs', options);
    //     console.debug(result);
    //     return result;
    // }

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
     * @param {number|string} amount,
     * @param {string} privateKey not required in test context
     * @param {number} gas
     * @return {Promise<TransactionReceipt>} A promise combined event emitter. Resolves when the transaction receipt is available.
     */
    async safeTransfer(
        from,
        to,
        tokenId,
        amount,
        privateKey,
        gas,
    ) {
        const tokenIdStringType = (typeof tokenId !== 'string') ? tokenId.toString() : tokenId;
        const call = this.contractMethods.safeTransferFrom(from, to, tokenIdStringType, amount, '0x');
        const isTimeout = await LocalStorage.getData('IS_TIMEOUT');
        if(isTimeout === true || isTimeout === 'true') {
            return;
        }
        return this.sendContractCall(call, from, privateKey, gas);
    }



    /**
     *
     * @param tokenId
     * @return {Promise<*>}
     */
    async getTokenURI(tokenId) {
        const call = this.contractMethods.uri(tokenId);
        const tokenUri = await this.localContractCall(call);
        return tokenUri.replace('{id}',tokenId);
    }

    /**
     * Returns the name of the token.
     * Some ERC-1155 not support name() function.
     * Must check w3.hasMethod(contractAddress, 'name()')
     * @return {Promise<string>}
     */
    async name() {
        return this.localContractCall(
            this.contractMethods.name(),
        );
    }

    /**
     * Returns the symbol of the token, usually a shorter version of the name.
     * Some ERC-1155 not support symbol() function.
     * Must check w3.hasMethod(contractAddress, 'symbol()')
     * @return {Promise<string>}
     */
    async symbol() {
        return this.localContractCall(
            this.contractMethods.symbol(),
        );
    }

    /**
     * @param {string} address      Public address
     * @param {number|string} id    tokenId
     * @param {string} amount       amount of minting NFT
     * @param {string} privateKey   Public address's key
     * @return {Promise<TransactionReceipt>}
     */
    async mint(address, id, amount, privateKey) {
        const call = this.contractMethods.mint(address, id, amount, '0x');
        return this.sendContractCall(call, address, privateKey);
    }

    /**
     * @param {string} address      Public address
     * @param {Array} ids    tokenId
     * @param {Array} amounts       amount of minting NFT
     * @param {string} privateKey   Public address's key
     * @return {Promise<TransactionReceipt>}
     */
    async mintBatch(address, ids, amounts, privateKey) {
        const call = this.contractMethods.mintBatch(address, ids, amounts, '0x');
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
