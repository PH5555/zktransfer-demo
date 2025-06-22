import Web3Interface from '../web3/web3.interface';
import CompiledErc20 from './compiled';
import LocalStorage from '../../utils/async.storage';

export default class Contract extends Web3Interface {
    constructor(endpoint, deployedAddress) {
        super(endpoint);
        this.instance = new this.eth.Contract(CompiledErc20.abi, deployedAddress);
        this.contractMethods = this.instance.methods;
    }

    /**
     *
     * @param {string} address
     * @returns {Promise<string>}   address's ERC20 balance
     */
    async balanceOf(address) {
        const call = this.contractMethods.balanceOf(address);
        return this.localContractCall(call);
    }

    /**
     *
     * @param {string} from     sender's address
     * @param {string} to       receiver's address
     * @param {string|number|BigInt} amount
     * @param {string} privateKey not required in test context
     * @param {number} gas
     * @return {Promise<Event>} A promise combined event emitter. Resolves when the transaction receipt is available.
     */
    async transfer(
        from,
        to,
        amount,
        privateKey,
        gas,
    ) {
        const isTimeout = await LocalStorage.getData('IS_TIMEOUT');
        if(isTimeout === true || isTimeout === 'true') {
            return ;
        }
        return this.sendContractCall(
            this.contractMethods.transfer(to, amount),
            from,
            privateKey,
            gas,
        );
    }

    async approve(spender, amount, userEoa, privateKey) {
        return this.sendContractCall(
            this.contractMethods.approve(spender, amount),
            userEoa,
            privateKey,
        );
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
     * Returns the number of decimals used to get its user representation.
     * For example, if decimals equals 2,
     * a balance of 505 tokens should be displayed to a user as 5,05 (505 / 10 ** 2).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between Ether and Wei.
     * @return {Promise<string>}
     */
    async decimals() {
        return this.localContractCall(
            this.contractMethods.decimals(),
        );
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
