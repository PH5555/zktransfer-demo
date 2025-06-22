import types from '../../utils/types';

export class Pocket {
    constructor(
        privBal,
        pubInBal,
        pubOutBal,
    ) {
        this.privBal = privBal;
        this.pubInBal = pubInBal;
        this.pubOutBal = pubOutBal;
    }

    toJson() {
        return JSON.stringify(this, null, 2);
    }

    toPub() {
        return [this.pubInBal, this.pubOutBal];
    }

    static fromJson(pocketJson) {
        let dataJson = JSON.parse(pocketJson);
        return new Pocket(
            dataJson.privBal,
            dataJson.pubInBal,
            dataJson.pubOutBal,
        );
    }

    static genPocketFromType(type, value) {
        switch (type) {
        case 'TRANSFER':
            return pocket(value, '0x0', '0x0');
        case 'CHARGE':
            return pocket('0x0', value, '0x0');
        case 'WITHDRAW':
            return pocket('0x0', '0x0', value);
        case 'UPDATE':
            return pocket('0x0', '0x0', '0x0');

        case 'FT_PUBLIC_TO_PRIVATE':
            return pocket(value, value, '0x0');
        case 'FT_PRIVATE_TO_PRIVATE':
            return pocket(value, '0x0', '0x0');
        case 'FT_PRIVATE_TO_PUBLIC':
            return pocket('0x0', '0x0', value);

        case 'NFT_PUBLIC_TO_PRIVATE':
            return pocket(value, value, '-1');
        case 'NFT_PRIVATE_TO_PRIVATE':
            return pocket(value, '-1', '-1');
        case 'NFT_PRIVATE_TO_PUBLIC':
            return pocket('-1', '-1', value);
        default:
            throw 'Invalid Pocket Type';
        }
    }

    serialize(tokenAddress) {
        if (this.privBal >= 0) {
            this.privBal = tokenAddress +
                types.subtractPrefixHex(
                    types.addPrefixAndPadHex(this.privBal, 22),
                );
        } else {
            this.privBal = '0x0';
        }
        if (this.pubInBal >= 0) {
            this.pubInBal = tokenAddress +
                types.subtractPrefixHex(
                    types.addPrefixAndPadHex(this.pubInBal, 22),
                );
        } else {
            this.pubInBal = '0x0';
        }
        if (this.pubOutBal >= 0) {
            this.pubOutBal = tokenAddress +
                types.subtractPrefixHex(
                    types.addPrefixAndPadHex(this.pubOutBal, 22),
                );
        } else {
            this.pubOutBal = '0x0';
        }
    }
}

const pocket = (privBal, pubInBal, pubOutBal) => {
    return new Pocket(privBal, pubInBal, pubOutBal);
};

export default pocket;
