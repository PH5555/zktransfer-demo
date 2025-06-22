import types from '../../../utils/types';
import encryption from '../../../services/cryptos/encryption';

export default class ZkTransferEvent {
    constructor(pCT, cm, tokenAddress, index) {
        this.pCT = pCT;
        this.cm = cm;
        this.tokenAddress = tokenAddress;
        this.index = index;
    }

    toJson() { return JSON.stringify(this, null, 2); }

    static fromJson(zkTransferEventJson) {
        let dataJson = JSON.parse(zkTransferEventJson);
        return new ZkTransferEvent(
            dataJson.pCT,
            dataJson.cm,
            dataJson.tokenAddress,
            dataJson.index
        );
    }

    /**
     *
     * @param       {Object}           eventArgs          The decoded event data
     * @param       {string}           eventArgs.com
     * @param       {Array<string>}    eventArgs.ct
     * @param       {string}           eventArgs.index
     * @param       {string}           eventArgs.nullifier
     * @param       {string}           eventArgs.tokenAddress
     * @returns     {Object}                              The new ZkTransferEvent
     */
    static eventArgsToZkTransferEvent(eventArgs) {
        try {
            const rawPct = types.decArrayToHexArray(eventArgs.ct);
            let pCT = new encryption.pCT(
                {x: rawPct[0],y: rawPct[1] },
                { x: rawPct[2], y: rawPct[3] },
                { x: rawPct[4], y: rawPct[5] },
                rawPct.slice(6),
            );

            return new ZkTransferEvent(
                pCT,
                types.decStrToHex(eventArgs.com),
                eventArgs.tokenAddress,
                eventArgs.index,
            );
        }
        catch (error) {
            console.log(' Conversion Error : ', error);
        }
    }
}
