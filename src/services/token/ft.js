import Config from 'react-native-config';
import Web3 from '../../web3';
import types from '../../utils/types';
import { generateFtProof, generateFtSnarkInput, generateZkTransferTx } from '../client/tx';
import { Pocket } from '../client/pocket';
import { Erc20ModelInstance } from '../../db';
import axios from 'axios';
import _ from 'lodash';

const BASE_ENDPOINT = Config.DEFAULT_ENDPOINT;


/**
 *
 * @param pocket
 * @param trnOption
 * @param keys
 * @param userEoa
 * @param userEoaPrivateKey
 * @return {Promise<TransactionReceipt>}
 */
async function zkTransfer(pocket, trnOption, keys, userEoa, userEoaPrivateKey) {
    const web3 = Web3.Azeroth.azerothContract;

    const inputs = await generateFtSnarkInput(
        web3,
        keys,
        pocket,
        trnOption,
    );

    const proof = await generateFtProof(inputs);
    const txParam = generateZkTransferTx(proof, inputs, trnOption);

    return web3.zkTransfer(txParam, userEoa, Number(pocket.pubInBal).toString(10), userEoaPrivateKey);
}

async function approve(contractAddress, amount, userEoa, privateKey) {
    const web3 = new Web3.Erc20.Contract(Config.DEFAULT_ENDPOINT, contractAddress);
    return web3.approve(
        Config.CONTRACT_ADDRESS, amount, userEoa, privateKey,
    );
}

/**
 *
 * @param tokenAddress
 * @param type
 * @param amount
 * @param userKeyPair
 * @param userEoa
 * @param userEoaPrivateKey
 * @return {Promise<TransactionReceipt>}
 */
async function exchangeToken(tokenAddress, type, amount, userKeyPair, userEoa, userEoaPrivateKey) {
    const web3 = Web3.Azeroth.azerothContract;

    let pubVal = undefined;
    if ((tokenAddress === '0' || tokenAddress === '0x0000000000000000000000000000000000000000')) {
        pubVal = Number(amount) * (1.00 * web3.utils.unitMap.ether);
    } else {
        await approve(tokenAddress, Number(amount), userEoa, userEoaPrivateKey);
        pubVal = Number(amount);
    }
    const pocket = Pocket.genPocketFromType(
        type,
        web3.utils.toHex(pubVal),
    );

    const trnOption = {
        note: null,
        receiverEoa: userEoa,
        tokenAddress: tokenAddress === '0' ? '0x0000000000000000000000000000000000000000' : tokenAddress,
    };
    const apk = await web3.getAPK();
    const keys = {
        auditor: apk,
        sender: userKeyPair,
        receiver: userKeyPair,
    };

    return zkTransfer(pocket, trnOption, keys, userEoa, userEoaPrivateKey);
}

/**
 *
 * @param tokenAddress
 * @param note
 * @param userKeyPair
 * @param userEoa
 * @param userEoaPrivateKey
 * @return {Promise<TransactionReceipt>}
 */
async function receiveToken(tokenAddress, note, userKeyPair, userEoa, userEoaPrivateKey) {
    const web3 = Web3.Azeroth.azerothContract;

    if (!tokenAddress || tokenAddress === '0' || tokenAddress === '0x0000000000000000000000000000000000000000') {
        note.bal = web3.utils.toHex(
            web3.utils.toWei(note.bal.toString(), 'ether'),
        );
    }
    const pocket = Pocket.genPocketFromType(
        'UPDATE',
        web3.utils.toHex(note.bal),
    );
    const trnOption = {
        note: note,
        receiverEoa: userEoa,
        tokenAddress: tokenAddress === '0' ? '0x0000000000000000000000000000000000000000' : tokenAddress,
    };
    const apk = await web3.getAPK();
    const keys = {
        auditor: apk,
        sender: userKeyPair,
        receiver: userKeyPair,
    };
    types.removeHexRepresentation(keys);

    return zkTransfer(pocket, trnOption, keys, userEoa, userEoaPrivateKey);

}

/**
 *
 * @param tokenAddress
 * @param value
 * @param senderKeyPair
 * @param userEoa
 * @param senderEoaPrivateKey
 * @param receiverEoa
 * @param isPrivateMode
 * @return {Promise<TransactionReceipt>}
 */
async function privateTransfer(tokenAddress, value, senderKeyPair, userEoa, senderEoaPrivateKey, receiverEoa, isPrivateMode) {
    const web3 = Web3.Azeroth.azerothContract;
    const TRANSFER_MODE = {
        true: 'PRIVATE',
        false: 'PUBLIC',
    };

    // Pokect Type Enum
    //  - FT_PUBLIC_TO_PRIVATE: send public token to note
    //  - FT_PRIVATE_TO_PRIVATE: send note to note
    //  - FT_PRIVATE_TO_PUBLIC: send note to public token
    let balance = undefined;
    if ((tokenAddress === '0' || tokenAddress === '0x0000000000000000000000000000000000000000')) {
        balance = Number(web3.utils.toWei(value, 'ether'));
    } else {
        await approve(tokenAddress, Number(value), userEoa, senderEoaPrivateKey);
        balance = Number(value);
    }
    const pocket = Pocket.genPocketFromType(
        `FT_${TRANSFER_MODE[isPrivateMode.toString()]}_TO_${TRANSFER_MODE[isPrivateMode.toString()]}`,
        web3.utils.toHex(balance),
    );
    const trnOption = {
        note: null,
        tokenAddress: tokenAddress === '0' ? '0x0000000000000000000000000000000000000000' : tokenAddress,
        receiverEoa: receiverEoa,
    };
    const pk = await web3.getUserPublicKeys(receiverEoa);
    const receiverPk = new Web3.Azeroth.structure.Key.UserKey(await web3.getUserPublicKeys(receiverEoa),'');

    const apk = await web3.getAPK();
    const keys = {
        auditor: apk,
        sender: senderKeyPair,
        receiver: receiverPk,
    };
    types.removeHexRepresentation(keys);

    return zkTransfer(pocket, trnOption, keys, userEoa, senderEoaPrivateKey);
}

/**
 *
 * @param tokenAddress
 * @param userEOA
 * @param receiverEOA
 * @param amount
 * @param privateKey
 * @return {Promise<TransactionReceipt|undefined>}
 */
async function publicTransfer(tokenAddress, userEOA, receiverEOA, amount, privateKey) {
    const web3 = (tokenAddress === '0' || tokenAddress === '0x0000000000000000000000000000000000000000') ?
        new Web3.Web3Interface(Config.DEFAULT_ENDPOINT) :
        new Web3.Erc20.Contract(Config.DEFAULT_ENDPOINT, tokenAddress);
    return web3.transfer(
        userEOA,
        receiverEOA,
        amount,
        privateKey,
    );
}

/**
 *
 * @param azerothWeb3
 * @param {object} userKey
 * @param {object} userKey.pk
 * @param {string} userKey.pk.ena
 * @param {string} userKey.pk.pkOwn
 * @param {string} userKey.pk.pkEnc
 * @param {string} userKey.sk
 * @return {Promise<string>}
 */
async function getPrivateNativeTokenBalance(azerothWeb3, userKey) {
    return azerothWeb3.getEnaBalance(null, userKey);
}

async function getPublicNativeTokenBalance(web3, userEOA) {
    const balance = await web3.eth.getBalance(userEOA);
    const etherUnit = BigInt(web3.utils.unitMap.ether);

    return (BigInt(balance) / etherUnit).toString();
}

/**
 *
 * @param azerothWeb3
 * @param {string} contractAddress
 * @param {object} userKey
 * @param {object} userKey.pk
 * @param {string} userKey.pk.ena
 * @param {string} userKey.pk.pkOwn
 * @param {string} userKey.pk.pkEnc
 * @param {string} userKey.sk
 * @return {Promise<string>}
 */
async function getPrivateBalance(azerothWeb3, contractAddress, userKey) {
    return azerothWeb3.getEnaBalance(contractAddress, userKey);
}

/**
 *
 * @param contractAddress
 * @param userEOA
 * @return {Promise<string|*>}
 */
async function getPublicBalnace(contractAddress, userEOA) {
    const web3 = new Web3.Erc20.Contract(BASE_ENDPOINT, contractAddress);
    return web3.balanceOf(userEOA);
}

/**
 * @param {string} contractAddress
 * @return {Promise<boolean>}
 */
async function isValidFtAddress(contractAddress) {
    // check isEtherFormat
    if (!Web3.Web3Interface.utils.isAddress(contractAddress)) {
        return false;
    }

    // TODO check Erc20, smartContract
    // const contract = new web3.Erc20.Contract(BASE_ENDPOINT, contractAddress);
    // console.log('test?', test);
    // if ( await contract.hasMethod(contractAddress, 'supportsInterface(bytes4)') ) {
    //     return contract.supportsInterface('0x36372b07');
    // }
    return true;
}

/**
 * @param {string} contractAddress
 * @return {Promise<{symbol: string, decimals: string, name: string}>}
 */
async function getTokenInfo(contractAddress) {
    const w3 = new Web3.Erc20.Contract(BASE_ENDPOINT, contractAddress);

    const info = {
        name: '',
        symbol: '',
        decimals: '',
    };

    if (await w3.hasMethod(contractAddress, 'name()')) {
        info.name = await w3.name();
    }
    if (await w3.hasMethod(contractAddress, 'symbol()')) {
        info.symbol = await w3.symbol();
    }
    if (await w3.hasMethod(contractAddress, 'decimals()')) {
        info.decimals = await w3.decimals();
    }

    return info;
}

/**
 * get token logo from 'Coingecko'
 * @param {string} tokenName ex) ethereum, tether ...
 * @return {Promise<string>} logo url
 */
async function getTokenLogoFromCoingecko(tokenName) {
    // const baseUri = `https://api.coingecko.com/api/v3/coins/${tokenName}`;
    const baseUri = 'https://google.co.kr/earopijaeopir';
    let imageUri = '';
    const res = await axios.get(baseUri).catch((error) => {
        return { error };
    });
    if (res.status === 200) {
        imageUri = _.get(res, 'data.image.thumb');
    }
    return imageUri;
}

/**
 * get token logo from 'https://github.com/trustwallet/'
 * @param {string} tokenName ex) ethereum, tether ...
 * @return {Promise<string>} logo url
 */
async function getTokenLogoFromTrustwallet(tokenName) {
    const uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${tokenName}/info/logo.png`;

    const res = await axios.get(uri).catch((error) => {
        return { error };
    });

    return (res.status === 200) ? uri : '';
}

/**
 * get token logo from 'Coingecko'
 * @param {string} tokenName ex) ethereum, tether ...
 * @return {Promise<string>} logo url
 */
async function getTokenLogo(tokenName) {
    let imageUri = await getTokenLogoFromCoingecko(tokenName);
    if (imageUri === '' || !imageUri) {
        imageUri = await getTokenLogoFromTrustwallet(tokenName);
    }
    return imageUri;
}

// DB services
/**
 *
 * @param {Erc20} tokenInfo
 * @return {Promise<Erc20>}
 */
async function insertTokenInfo(tokenInfo) {
    return Erc20ModelInstance.insertTokenIfNotExist(tokenInfo);
}

/**
 *
 * @param {Erc20} tokenInfo
 * @return {Promise<void>}
 */
async function deleteToken(tokenInfo) {
    return Erc20ModelInstance.deleteToken(tokenInfo);
}

/**
 * @return {Promise<[]>}
 */
async function getTokensFromDB() {
    return Erc20ModelInstance.selectToken(false);
}

/**
 *
 * @param {function} transfer
 * @param {Number} ms
 * @return {Promise<*>}
 */
export async function transferWithTimeOut(transfer, ms) {
    let timer;
    const res = await Promise.race([
        transfer,
        new Promise(resolve => {
            timer = setTimeout(() => resolve('timeout'), ms);
        }),
    ]).finally(() => clearTimeout(timer));

    if (res === 'timeout') {
        throw new Error(`${ms}ms timeout`);
    }
    return res;
}


const FtServices = {
    exchangeToken,
    receiveToken,
    privateTransfer,
    publicTransfer,
    approve,
    getPrivateNativeTokenBalance,
    getPublicNativeTokenBalance,
    getPublicBalnace,
    getPrivateBalance,
    isValidFtAddress,
    getTokenInfo,
    getTokenLogo,
    insertTokenInfo,
    deleteToken,
    getTokensFromDB,
    transferWithTimeOut,
};

export default FtServices;
