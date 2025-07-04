import math from '../../utils/math';
import Config from 'react-native-config';
import CurveParam from './curveParam';

BigInt.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};

class AffinePoint {
    constructor(x, y) {
        try {
            this.x = BigInt(x);
            this.y = BigInt(y);
        } catch (e) {
            if( e.name === 'SyntaxError') {
                this.x = BigInt('0x' + x);
                this.y = BigInt('0x' + y);
            } else {
                throw e;
            }
        }
    }

    toJson() {
        let pointJson = {};
        pointJson[0] = this.x.toString(16);
        pointJson[1] = this.y.toString(16);
        return pointJson;
    }

    toHexArray() {
        return [this.x.toString(16), this.y.toString(16)];
    }

    static fromJson(pointJson) {
        let dataJson = JSON.parse(pointJson);

        return new AffinePoint(
            dataJson.x,
            dataJson.y,
        );
    }
}

class MontgomeryCurve {
    constructor(CurveParam) {
        this.prime = CurveParam.prime;
        this.g = CurveParam.g;
        this.coefA = CurveParam.coefA;
        this.coefB = CurveParam.coefB;
    }

    preprocess(p, exp) {
        let preTable = [p];

        for (let i = 0; i < exp.toString(2).length; i += 1) {
            let baseP = preTable[preTable.length - 1];
            preTable.push(this.doubleAffinePoint(baseP));
        }

        return preTable;
    }

    mul(preTable, exp) {
        let expBit = exp.toString(2).split('').reverse().join('');
        let result = preTable[preTable.length - 1];

        for (const [i, value] of preTable.entries()) {
            if (expBit[i] === '1') {
                result = this.addAffinePoint(result, value);
            }
        }
        result = this.subAffinePoint(result, preTable[preTable.length - 1]);

        return result;
    }

    preprocessBasePoint(p) {
        let newX = math.mod(p.x, this.prime);
        let newY = math.mod(p.y, this.prime);

        return new AffinePoint(newX, newY);
    }

    doubleAffinePoint(p) {
        // tmpX = ( 3x^2 + 2Ax + 1 ) mod prime
        let tmpX = math.mod(BigInt('3') * p.x *p.x + BigInt('2')*p.x*this.coefA + BigInt('1') ,this.prime);

        // l = ( tmpX / 2By ) mod prime
        let l1 = this.fieldDivision(tmpX, p.y * BigInt('2') * this.coefB);

        // b = Bl^2 mod prime
        let b_l2 = math.mod(l1 * l1 * this.coefB, this.prime);

        // tmp1 = b - A
        let tmp1 = math.mod(b_l2 - this.coefA, this.prime);

        // 2x
        let tmp2 = math.mod(BigInt('2') * p.x, this.prime);

        // tmp3 = x3 mod prime
        let newX = math.mod(tmp1 - tmp2, this.prime);

        //
        let newY = math.mod(((p.x * BigInt('3') + this.coefA - b_l2) * l1 - p.y),this.prime);

        return new AffinePoint(newX, newY);
    }

    addAffinePoint(p1, p2) {
        let diffY = math.mod((p1.y - p2.y), this.prime);
        let diffX = math.mod((p1.x - p2.x), this.prime);
        let q = this.fieldDivision(diffY, diffX);
        let b_q2 = math.mod(q * q * this.coefB, this.prime);
        let newX = math.mod(b_q2 - this.coefA - p1.x - p2.x, this.prime);
        let newY = math.mod((q * (p1.x - newX) - p1.y), this.prime);

        return new AffinePoint(newX, newY);
    }

    subAffinePoint(p1, p2) {
        let negP2 = new AffinePoint(p2.x, math.mod(-p2.y, this.prime));
        return this.addAffinePoint(p1, negP2);
    }

    fieldDivision(a, b) {
        return math.mod((a * math.modInv(b, this.prime)), this.prime);
    }

    checkScalar(value) {
        return value.toString(2).length <= this.prime.toString(2).length;
    }

    computeYCoord(x) {
        let x2 = math.mod(x * x, this.prime);
        let x3 = math.mod(x2 * x, this.prime);
        let squared = math.mod(x3 + this.coefA * x2 + x, this.prime);
        let ySquared = this.fieldDivision(squared, this.coefB);
        let y = math.modularSqrt(ySquared, this.prime);
        return y;
    }

    checkPointOnCurve(p) {
        let lhs = math.mod((math.modPow(p.y, BigInt('2'), this.prime) * this.coefB), this.prime);
        let rhs = math.mod((math.modPow(p.x, BigInt('3'), this.prime) + this.coefA * math.modPow(p.x, BigInt('2'), this.prime) + p.x), this.prime);
        console.assert(lhs === rhs, p.toJson());
    }

    computeScalarMul(p, exp) {
        let bp = this.preprocessBasePoint(p);
        this.checkPointOnCurve(bp);
        let preTable = this.preprocess(bp, exp);
        let output = this.mul(preTable, exp);
        return output;
    }
}

/**
 *
 * @param {BigInt}      exp         expo value
 * @returns {{x: BigInt, y: BigInt}}                computed point {x, y}
 */
export function basePointMul(exp, curveOption) {
    let cvParam = curveOption !== undefined ? CurveParam(curveOption) : CurveParam(Config.EC_TYPE);
    let curve = new MontgomeryCurve(cvParam);
    let baseY = curve.computeYCoord(curve.g);
    let bp = new AffinePoint(curve.g, baseY);
    curve.checkPointOnCurve(bp);
    let result = curve.computeScalarMul(bp, exp);
    curve.checkPointOnCurve(result);
    return result;
}

const Curve = {
    AffinePoint,
    MontgomeryCurve,
    basePointMul
};

export default Curve;
