import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBioMetrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

/**
 * Is biometrics sensor available?
 * @return {Promise<{result: boolean, type: string}|{result: boolean, type: null}>}
 */
export async function biometricsCheck() {
    const { available, biometryType } = await rnBioMetrics.isSensorAvailable();

    if (available) {
        switch (biometryType) {
        case BiometryTypes.TouchID:
        case BiometryTypes.Biometrics:
        case BiometryTypes.FaceID:
            return { result: true, type: biometryType };
        default:
        }
    }
    return { result: false, type: null };
}


/**
 * for create Key
 * @return {Promise<{result: boolean, key: null}|{result: boolean, key: string}>}
 */
export async function createKey() {
    try {
        const { publicKey } = await rnBioMetrics.createKeys();
        return { result: true, key: publicKey };
    } catch (e) {
        return { result: false, key: null };
    }
}

/**
 * @return {Promise<boolean>}
 */
export async function isExistKey() {
    const { keysExist } = await rnBioMetrics.biometricKeysExist();
    return keysExist;
}

/**
 * @return {Promise<boolean>}
 */
export async function deleteKey() {
    const { keysDeleted } = await rnBioMetrics.deleteKeys();
    return keysDeleted;
}

/**
 *
 * @param {string} userId
 * @param {string} msg
 * @return {Promise<{result: boolean, msg: string, key: string}|{result: boolean, msg, key: null}>}
 */
export async function biometricsLogin(userId = '', msg = 'Login') {
    try {
        const { success, signature, error } = await rnBioMetrics.createSignature({
            promptMessage: msg,
            payload: userId,
        });
        return { result: success, key: signature, msg: error };
    } catch (e) {
        return { result: false, key: null, msg: error };
    }
}

export default {
    biometricsCheck,
    createKey,
    isExistKey,
    deleteKey,
    biometricsLogin,
};
