import curve from './curve';
import math from '../../utils/math';
import mimc from './mimc';
import types from '../../utils/types';
import constants from '../../utils/constants';
import Config from 'react-native-config';
import CurveParam from './curveParam';

class sCT {
    /**
     *
     * @param {string}      r       In the symmetric key encryption, used random value | hexadecimal string
     * @param {string}      ct      The ciphertext | hexadecimal string
     */
    constructor(r, ct) {
        this.r = r;
        this.ct = ct;
    }

    toJson() { return JSON.stringify(this); }

    static fromJson(sCTJson) {
        let dataJson = JSON.parse(sCTJson);
        return new sCT(
            dataJson.r,
            dataJson.ct
        );
    }

    empty() {
        return this.ct === '0' && this.r === '0';
    }
}

class symmetricKeyEncryption {
    /**
     *
     * @param {string}      privKey     The user's private key | hexadecimal string
     */
    constructor(privKey) {
        let cvParam = CurveParam(Config.EC_TYPE);
        this.prime = cvParam.prime;
        this.privKey = privKey;
    }

    /**
     *
     * @param msg
     * @return {sCT}
     * @constructor
     */
    Enc(msg) {
        let mimc7 = new mimc.MiMC7();
        let r = math.randomFieldElement(this.prime).toString(16);
        let intMsg = types.hexToInt(msg);
        let intHashed = types.hexToInt(mimc7.hash(this.privKey.toString(16), r));
        let ct = math.mod(intMsg + intHashed, this.prime).toString(16);

        return new sCT(r, ct);
    }

    /**
     *
     * @param sct
     * @return {string}
     * @constructor
     */
    Dec(sct) {
        let mimc7 = new mimc.MiMC7();
        let intCT = types.hexToInt(sct.ct);
        let intHashed = types.hexToInt(mimc7.hash(this.privKey, sct.r));
        return math.mod(intCT - intHashed, this.prime).toString(16);
    }
}


class pCT {
    /**
     *
     * @param {AffinePoint}      c0      The ciphertext G^r
     * @param {AffinePoint}      c1      The ciphertext k*(pk_1)^r
     * @param {AffinePoint}      c2      The ciphertext k*(pk_2)^r
     * @param {string[]}    c3      The ciphertext SE.Enc_k(msg)
     */
    constructor(c0, c1, c2, c3) {
        this.c0 = (c0.toHexArray) ? c0 : new curve.AffinePoint(c0.x, c0.y);
        this.c1 = (c1.toHexArray) ? c1 : new curve.AffinePoint(c1.x, c1.y);
        this.c2 = (c2.toHexArray) ? c2 : new curve.AffinePoint(c2.x, c2.y);
        this.c3 = c3;
    }
    toJson() { return JSON.stringify(this); }

    static fromJson(pCTJson) {
        let dataJson = JSON.parse(pCTJson);

        return new pCT(
            dataJson.c3
        );
    }

    toList() {
        return [...this.c0.toHexArray(), ...this.c1.toHexArray(), ...this.c2.toHexArray(), ...this.c3];
    }
}

class publicKeyEncryption {
    constructor() {
        this.EC_TYPE = Config.EC_TYPE;
        let cvParam = CurveParam(this.EC_TYPE);
        this.prime = cvParam.prime;
    }

    /**
     *
     * @param {string}     apk     Auditor's public key
     * @param {{ena: string, pkOwn: string, pkEnc: string}}      upk     User's public key
     * @param  {...string}          msg     The plaintext | hexadecimal string type
     * @returns
     */
    Enc(apk, upk, ...msg) {
        let Curve = new curve.MontgomeryCurve(new CurveParam(Config.EC_TYPE));
        let r = math.randomFieldElement(this.prime);
        let k = math.randomFieldElement(this.prime);
        let curveK = curve.basePointMul(k);

        let curvePk = Curve.computeScalarMul(upk.pkEnc, r);
        let curveApk = Curve.computeScalarMul(apk, r);

        let c0 = curve.basePointMul(r);
        let c1 = Curve.addAffinePoint(curveK, curvePk);
        let c2 = Curve.addAffinePoint(curveK, curveApk);

        let c3 = (() => {
            let ret = [];
            let mimc7 = new mimc.MiMC7();
            for (const [i, e] of msg.entries()) {
                let hashInput = (curveK.x + BigInt(i.toString(10))).toString(16);
                let hashed = types.hexToInt(mimc7.hash(hashInput));
                ret.push(
                    math.mod(types.hexToInt(e) + hashed, this.prime).toString(16)
                );
            }
            return ret;
        })();
        r = r.toString(16); k = curveK;
        return [new pCT(c0, c1, c2, c3), r, k];
    }


    /**
     *
     * @param {pCT}         pct         The cihpertext of public key encryption
     * @param {string}      privKey     The user's private key or auditor's private key | hexadecimal string
     * @param {boolean}     audit       Whether or not to audit, 'true' is used by the auditor, and 'false' is used by the user.
     * @returns
     */
    Dec(pct, privKey, audit) {
        let Curve = new curve.MontgomeryCurve(new CurveParam(Config.EC_TYPE));
        let mimc7 = new mimc.MiMC7();

        let curveC0 = Curve.computeScalarMul(pct.c0, types.hexToInt(privKey));
        let ciphertext = audit === true ? pct.c2 : pct.c1;
        let curveK = Curve.subAffinePoint(ciphertext, curveC0);

        return (() => {
            let ret = [];
            for (const [i, e] of pct.c3.entries()) {
                let hashInput = (curveK.x + BigInt(i.toString(10))).toString(16);
                let hashed = types.hexToInt((mimc7.hash(hashInput)));
                ret.push(
                    math.mod(types.hexToInt(e) - hashed, this.prime).toString(16)
                );
            }
            return ret;
        })();
    }
}

const Encryption = {
    sCT,
    symmetricKeyEncryption,
    pCT,
    publicKeyEncryption
};

export default Encryption;
