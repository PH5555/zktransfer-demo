import encryption from '../cryptos/encryption';
import types from '../../utils/types';

export default class ZkTransferEvent {
    constructor(pCT, cm) {
        this.pCT = pCT;
        this.cm = cm;
    }

    toJson() { return JSON.stringify(this, null, 2); }

    static fromJson(zkTransferEventJson) {
        let dataJson = JSON.parse(zkTransferEventJson);
        return new ZkTransferEvent(
            dataJson.pCT,
            dataJson.cm,
        );
    }

    /**
     * 
     * @param       {Object}           eventArgs          The decoded event data 
     * @returns     {Object}                              The new ZkTransferEvent
     */
    static eventArgsToZkTransferEvent(eventArgs) {
        try {
            const rawPct = types.decArrayToHexArray(eventArgs.ct);
            let pCT = new encryption.pCT(
                rawPct[0],
                rawPct[1],
                rawPct[2],
                rawPct.slice(3),
            );

            return new ZkTransferEvent(
                pCT,
                types.decStrToHex(eventArgs.com),
            );
        }
        catch (error) {
            console.log(' Conversion Error : ', error);
        }
    }
}

