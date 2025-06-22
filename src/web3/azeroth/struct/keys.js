import _ from 'lodash';
import math from '../../../utils/math';
import constants from '../../../utils/constants';
import curve from '../../../services/cryptos/curve';
import mimc from '../../../services/cryptos/mimc';
import types from '../../../utils/types';
import Curve from '../../../services/cryptos/curve';

class AuditKey {
    constructor(pk, sk) {
        this.pk = pk;
        this.sk = sk;
    }

    toJson() {
        return JSON.stringify({
            pk: {
                x: this.pk.x.toString(16),
                y: this.pk.y.toString(16),
            },
            sk: this.sk,
        }, null, 2);
    }

    static fromJson(auditKeyJson) {
        let { pk, sk } = JSON.parse(auditKeyJson);

        return new AuditKey(
            pk,
            sk,
        );
    }

    static keyGen() {
        let sk = math.randomFieldElement(constants.SUBGROUP_ORDER);
        let pk = curve.basePointMul(sk);
        return new AuditKey(pk, sk.toString(16));
    }
}

class upk {
    constructor({ ena, pkOwn, pkEnc }) {
        this.ena = ena;
        this.pkOwn = pkOwn;
        this.pkEnc = new Curve.AffinePoint(pkEnc.x || pkEnc[0], pkEnc.y || pkEnc[1]);
    }

    toJson() {
        return JSON.stringify({
            ena: this.ena.toString(16),
            pkOwn: this.pkOwn.toString(16),
            pkEnc: this.pkEnc.toJson(),
        });
    }

    static fromJson(userKeyJson) {
        const userKey = JSON.parse(userKeyJson);
        return new upk({
            ena: _.get(userKey, 'ena'),
            pkOwn: _.get(userKey, 'pkOwn'),
            pkEnc: _.get(userKey, 'pkEnc'),
        });
    }
}

class UserKey {
    constructor({ ena, pkOwn, pkEnc }, sk) {
        this.pk = new upk({
            ena: ena,
            pkOwn: pkOwn,
            pkEnc: pkEnc,
        });
        this.sk = sk;
    }

    toJson() {
        return JSON.stringify({
            pk: JSON.parse(this.pk.toJson()),
            sk: this.sk,
        });
    }

    static fromJson(userKeyJson) {
        const userKey = JSON.parse(userKeyJson);

        const pk = typeof userKey.pk !== 'object' ? JSON.parse(_.get(userKey, 'pk')) : userKey.pk;
        const sk = _.get(userKey, 'sk');

        return new UserKey({
            ena: _.get(pk, 'ena'),
            pkOwn: _.get(pk, 'pkOwn'),
            pkEnc: _.get(pk, 'pkEnc'),
        }, sk);
    }

    static keyGen() {
        const mimc7 = new mimc.MiMC7();

        const sk = math.randomFieldElement(constants.SUBGROUP_ORDER);
        const userPublicKey = {
            ena: null,
            pkOwn: mimc7.hash(sk.toString(16)),
            pkEnc: curve.basePointMul(sk),
        };
        userPublicKey.ena = mimc7.hash(
            userPublicKey.pkOwn,
            userPublicKey.pkEnc.x.toString(16),
            userPublicKey.pkEnc.y.toString(16)
        );

        return new UserKey(userPublicKey, sk.toString(16));
    }

    /**
     * recover UserKey from sk
     *
     * @param {string} sk hex string
     * @return {upk}
     */
    static recoverFromUserSk(sk) {
        const mimc7 = new mimc.MiMC7();

        const skBigIntType = types.hexToInt(sk);

        const userPublicKey = {
            ena: null,
            pkOwn: mimc7.hash(skBigIntType.toString(16)),
            pkEnc: curve.basePointMul(skBigIntType),
        };
        userPublicKey.ena = mimc7.hash(
            userPublicKey.pkOwn,
            userPublicKey.pkEnc.x.toString(16),
            userPublicKey.pkEnc.y.toString(16)
        );

        return new upk(userPublicKey);
    }
}

export default { AuditKey, UserKey };
