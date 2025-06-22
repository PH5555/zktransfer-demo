import Web3 from '../../web3';
import types from '../../utils/types';
import Config from 'react-native-config';
import * as KeyChain from 'react-native-keychain'; // Ref. https://github.com/oblador/react-native-keychain
import mimc from '../cryptos/mimc';
import _ from 'lodash';
import { getToken } from './login';
import AES from '../cryptos/aes';
import Wallet from './wallet';
// TODO: Azeroth Key 기능과 ethers key 기능 분리


/**
 *
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function isValidToken(token) {
    if (!types.isBigIntFormat(token)) {
        return false;
    }
    let userCredential;
    try {
        userCredential = await KeyChain.getGenericPassword();
    } catch (error) {
        console.error('Keychain couldn\'t be accessed!', error);
        throw error;
    }
    const _token = _.get(userCredential, 'username');
    return (_token === token && !_.isNil(_token));
}

/**
 * @param {string}      address     EOA address 20byte
 * @returns {boolean}
 */
export function isValidAddress(address) {
    return Web3.Web3Interface.isValidAddress(address);
}

/**
 * @param {string}     privateKey     The private key of 'address' 32byte
 * @returns {Promise<boolean>}
 */
export async function isValidPrivateKey(privateKey) {
    const web3 = new Web3.Web3Interface(Config.DEFAULT_ENDPOINT);
    return web3.isValidPrivateKey(privateKey);
}

/**
 * @param {string}     address     ENA address 32byte string
 * @param {string}     pkOwn     pk_own 32byte string
 * @param {string}     pkEnc     pk_enc 32byte string
 * @returns {boolean}
 */
export function isValidPubKey(address, pkOwn, pkEnc) {
    if (!types.isBigIntFormat(address) ||
        !types.isBigIntFormat(pkOwn) ||
        !types.isBigIntFormat(pkEnc)) {
        return false;
    }
    address = types.subtractPrefixHex(address);
    pkOwn = types.subtractPrefixHex(pkOwn);
    pkEnc = types.subtractPrefixHex(pkEnc);

    const mimc7 = new mimc.MiMC7();
    const recoveredAddress = mimc7.hash(pkOwn, pkEnc);

    return address === recoveredAddress;
}

/**
 * @param {string} usk           Private key of azeroth, it means 'usk'
 * @returns {boolean}
 */
export function isValidUSK(usk) {
    if (_.isNil(usk) || !types.isBigIntFormat(usk)) {
        return false;
    }
    return types.hexToInt(usk).toString(2).length <= 254;
}

/**
 *
 * @param password
 * @param usedBioSensor
 * @param walletData
 * @param walletData.address
 * @param walletData.privateKey
 * @param walletData.upk
 * @param walletData.usk
 * @param walletData.mnemonic
 * @return {Promise<string|undefined|null>}
 */
export async function setUserCredential(password, usedBioSensor, walletData) {
    const token = getToken(password);

    const aesKey = await AES.generationKey(password, token, 5000, 256);

    await Wallet.walletDataToLocalDb(walletData, aesKey);

    const result = (usedBioSensor) ? await KeyChain.setGenericPassword(token, aesKey, {
        accessControl: 'BiometryAny',
        accessible: 'AccessibleAlways',
        authenticationType: 'AuthenticationWithBiometrics',
    }).catch(e => {
        console.error(e);
    }) : await KeyChain.setGenericPassword(token, aesKey).catch(e => {
        console.error(e);
    });
    if (!result) {
        return null;
    }

    return token;
}

export async function getUserCredential() {
    let userCredential;
    try {
        userCredential = await KeyChain.getGenericPassword();
    } catch (error) {
        console.error('Keychain couldn\'t be accessed!', error);
        throw error;
    }
    const data = userCredential.password;
    return { token: userCredential.username, aesKey: data };
}

/**
 *
 * @param {string}          privateKey
 * @returns {string}    user SK
 */
export function deriveUskFromPrivateKey(privateKey) {
    const mimc7 = new mimc.MiMC7();

    if (!types.isHexStringFormat(privateKey)) {
        return false;
    }

    return mimc7.hash(privateKey);
}

const KeyHelper = {
    isValidAddress,
    isValidPrivateKey,
    isValidPubKey,
    isValidUSK,
    deriveUskFromPrivateKey,
    setUserCredential,
    getUserCredential,
};

export default KeyHelper;
