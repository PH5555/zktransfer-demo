import MiMC from '../cryptos/mimc';
import types from '../../utils/types';
import errorEnum from '../../utils/error.enum';
import _ from 'lodash';
import AES from '../cryptos/aes';

/**
 *
 * @param {string}          password            User's password
 * @returns {boolean}
 */
export function isValidPassword(password) {
    return !(_.isNil(password));
    // const reg = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*~])(?=.{8,})');
    // return !(_.isNil(password) || !reg.test(password));

}

/**
 *
 * @param {string}          password            User's password
 * @param {string}          chkPassword         User's check password
 * @returns
 */
export function isEqualPassword(password, chkPassword) {
    return password === chkPassword;
}

/**
 *
 * @param {string} password     raw password
 * @returns {string|undefined}  H(password)
 */
export function getToken(password) {
    if (!isValidPassword(password)) {
        return undefined;
    }
    const hash = new MiMC.MiMC7();
    return hash.hash(types.asciiToHex(password));
}

/**
 *
 * @param {string}              password                User's password
 * @returns
 */
export async function login(password) {
    if (!isValidPassword(password)) {
        throw errorEnum.ERR_INVALID_PASSWORD;
    }
    const token = getToken(password);
    console.debug(
        'token:', token,
        'password:', password,
    );

    const aesKey = await AES.generationKey(password, token, 5000, 256);
    return aesKey;
}

const Login = {
    isValidPassword,
    isEqualPassword,
    getToken,
    login,
};

export default Login;
