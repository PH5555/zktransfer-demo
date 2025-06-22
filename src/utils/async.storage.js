import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AsyncStorageError extends Error {
    constructor(errorData, message) {
        super(message);
        this.name = 'AsyncStorageError';
        this.errorData = errorData;
    }

    show() {
        console.log(this.name, this.errorData);
        console.error(this.message);
    }
}

/**
 *
 * @param {string} key
 * @param {string} value
 * @return {Promise<void>}
 */
async function storeData(key, value) {
    try {
        await AsyncStorage.setItem(key, value);
    }
    catch (e) {
        throw new AsyncStorageError(null, e).show();
    }
    console.log(' Set Item Done...');

}

async function getData(key) {
    // get Data from Storage
    try {
        const data = await AsyncStorage.getItem(key);
        if (data !== null) {
            console.log(data);
        }
        return data;
    } catch (error) {
        throw new AsyncStorageError(data, error).show();
    }
}

async function removeData(key) {
    try {
        await AsyncStorage.removeItem(key);
        console.log(' Remove Item Done...');
    }
    catch (e) {
        throw new AsyncStorageError(null, e).show();
    }
}

async function getAllKeys() {
    try {
        const keys = await AsyncStorage.getAllKeys();
        if (keys !== null) {
            console.log(keys);
        }
        return keys;
    }
    catch (e) {
        throw new AsyncStorageError(keys, e).show();
    }
}

async function getMultiData(keys) {
    let values;
    try {
        // keys Array
        values = await AsyncStorage.multiGet(keys);
        return values;
    }
    catch (e) {
        throw new AsyncStorageError(values, e).show();
    }
}

async function clearAll() {
    try {
        // await AsyncStorage.clear();
        const asyncStorageKeys = await AsyncStorage.getAllKeys();
        if (asyncStorageKeys.length > 0) {
            if (Platform.OS === 'android') {
                await AsyncStorage.clear();
            }
            if (Platform.OS === 'ios') {
                await AsyncStorage.multiRemove(asyncStorageKeys);
            }
        }
    } catch (e) {
        throw new AsyncStorageError(null, e).show();
    }
    console.log('Clear Done.');
}

const localStorage = {
    storeData,
    getData,
    removeData,
    getAllKeys,
    getMultiData,
    clearAll
};

export default localStorage;
