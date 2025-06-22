import KeyHelper from './keyHelper';
import { Notes } from '../notes/notes';
import { Wallet } from '@ethersproject/wallet';
import { createTable } from '../../db';
import _ from 'lodash';
import Web3 from '../../web3';
import LocalStorage from '../../utils/async.storage';
import AES from '../cryptos/aes';

export async function createWallet() {
    let wallet;
    try {
        wallet = Wallet.createRandom();
    } catch (error) {
        console.error('@ethersproject/wallet couldn\'t be created', error);
        throw error;
    }
    wallet.usk = KeyHelper.deriveUskFromPrivateKey(wallet.privateKey);
    wallet.upk = JSON.parse(Web3.Azeroth.structure.Key.UserKey.recoverFromUserSk(wallet.usk).toJson());

    await Notes.init();
    await createTable();

    return wallet;
}

export async function fetchWalletFromMnemonic(mnemonic) {
    let wallet = Wallet.fromMnemonic(mnemonic);
    wallet.usk = KeyHelper.deriveUskFromPrivateKey(wallet.privateKey);
    wallet.upk = JSON.parse(Web3.Azeroth.structure.Key.UserKey.recoverFromUserSk(wallet.usk).toJson());

    await Notes.init();
    await createTable();

    return wallet;
}

export async function fetchWalletFromPrivateKey(privateKey) {
    let wallet = new Wallet(privateKey);
    wallet.usk = KeyHelper.deriveUskFromPrivateKey(wallet.privateKey);
    wallet.upk = JSON.parse(Web3.Azeroth.structure.Key.UserKey.recoverFromUserSk(wallet.usk).toJson());
    console.debug(wallet.upk);

    await Notes.init();
    await createTable();

    return wallet;
}

/**
 *
 * @param {object} walletData
 * @param {string} walletData.address
 * @param {object} walletData.upk
 * @param {string} walletData.privateKey
 * @param {string} walletData.usk
 * @param {string} walletData.mnemonic
 * @param aesKey
 * @return {Promise<void>}
 */
export async function walletDataToLocalDb(walletData, aesKey) {
    // public Data
    const address = _.get(walletData, 'address');
    const upk = _.get(walletData, 'upk');

    // Need encryption
    const privateKey = _.get(walletData, 'privateKey');
    const usk = _.get(walletData, 'usk');
    const mnemonic = _.get(walletData, 'mnemonic');

    const ctPrivateKey = await AES.encryptData(privateKey, aesKey);
    const ctUsk = await AES.encryptData(usk, aesKey);
    const ctMnemonic = await AES.encryptData(mnemonic, aesKey);

    await LocalStorage.storeData('@ADDRESS',address);
    await LocalStorage.storeData('@USER_PUBLIC_KEY',JSON.stringify(upk));

    await LocalStorage.storeData('@PRIVATE_KEY',JSON.stringify(ctPrivateKey));
    await LocalStorage.storeData('@USER_SECRET_KEY',JSON.stringify(ctUsk));
    await LocalStorage.storeData('@MNEMONIC',JSON.stringify(ctMnemonic));
}

/**
 *
 * @param aesKey
 * @return {Promise<{upk: any, privateKey: string, address: string, mnemonic: string, usk: string}>}
 */
export async function walletDataFromLocalDb(aesKey){
    const address = await LocalStorage.getData('@ADDRESS');
    const upk = JSON.parse(await LocalStorage.getData('@USER_PUBLIC_KEY'));

    const ctPrivateKey = JSON.parse(await LocalStorage.getData('@PRIVATE_KEY'));
    const ctUsk = JSON.parse(await LocalStorage.getData('@USER_SECRET_KEY'));
    const ctMnemonic = JSON.parse(await LocalStorage.getData('@MNEMONIC'));

    const privateKey = await AES.decryptData(ctPrivateKey, aesKey);
    const usk = await AES.decryptData(ctUsk, aesKey);
    const mnemonic = await AES.decryptData(ctMnemonic, aesKey);

    return {
        address,
        upk,
        privateKey,
        usk,
        mnemonic,
    };
}

const wallet = {
    createWallet,
    fetchWalletFromMnemonic,
    fetchWalletFromPrivateKey,
    walletDataToLocalDb,
    walletDataFromLocalDb,
};

export default wallet;



