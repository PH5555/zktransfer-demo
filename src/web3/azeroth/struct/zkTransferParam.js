import types from '../../../utils/types';
import Constants from '../../constants';
import Encryption from '../../../services/cryptos/encryption';
import Web3 from '../../index';

export default class ZkTransferParam {
    constructor(
        proof,
        rt,
        sn,
        senderPK,
        cm,
        newsCT,
        pubBal,
        newpCT,
        receiverEoa,
        tokenAddress,
    ) {
        this.proof = proof;
        this.rt = rt;
        this.sn = sn;
        this.senderPK = (senderPK.keyGen) ? senderPK : new Web3.Azeroth.structure.Key.UserKey(senderPK, null).pk;
        this.cm = cm;
        if ( newsCT ) {
            this.newsCT = (newsCT.toJson) ? newsCT : new Encryption.sCT(newsCT.r, newsCT.ct);
        }
        this.pubBal = pubBal;
        this.newpCT = (newpCT.toList) ? newpCT : new Encryption.pCT(
            newpCT.c_0 || newpCT.c0,
            newpCT.c_1 || newpCT.c1,
            newpCT.c_2 || newpCT.c2,
            newpCT.c_3 || newpCT.c3,
        );
        this.receiverPubAcct = receiverEoa || Constants.ZERO_ADDRESS;
        this.tokenAddress = tokenAddress;
    }

    toContractArgs() {
        const inputs = [
            types.addPrefixAndPadHex(this.rt),
            types.addPrefixAndPadHex(this.sn),
            types.addPrefixAndPadHex(this.senderPK.ena),
            types.addPrefixAndPadHex(this.senderPK.pkOwn),
            ...types.addPrefixAndPadHexFromArray([
                types.addPrefixAndPadHex(this.senderPK.pkEnc.x.toString(16)),
                types.addPrefixAndPadHex(this.senderPK.pkEnc.y.toString(16)),
            ]),
            types.addPrefixAndPadHex(this.cm),
            ...types.addPrefixAndPadHexFromArray(this.pubBal),
            ...types.addPrefixAndPadHexFromArray(this.newpCT.toList()),
        ];

        if (this.newsCT && this.newsCT.r) {
            inputs.splice(7, 0, ...types.addPrefixAndPadHexFromArray(Object.values(this.newsCT)));
        }

        const args = [
            types.addPrefixAndPadHexFromArray(Object.values(this.proof).flat()),
            inputs,
            types.addPrefixHex(this.receiverPubAcct),
        ];

        if (this.newsCT && this.newsCT.r) {
            args.push(this.tokenAddress);
        }

        return args;
    }

    toJson() {
        return JSON.stringify(this, null, 2);
    }

    static fromJson(txParamJson) {
        const dataJson = JSON.parse(txParamJson);
        return new ZkTransferParam(
            dataJson.proof,
            dataJson.rt,
            dataJson.sn,
            dataJson.senderPK,
            dataJson.cm,
            dataJson.newsCT,
            dataJson.pubBal,
            dataJson.newpCT,
            dataJson.receiverPubAcct,
            dataJson.tokenAddress,
        );
    }
}
