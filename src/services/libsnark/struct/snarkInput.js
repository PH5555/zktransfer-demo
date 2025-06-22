import types from '../../../utils/types';

export default class SnarkInput {
    /**
     *
     * @param {Object}                  keys            The object of keys { auditor.pk, sender.sk, sender.pk, receiver.pk }
     * @param {Object}                  ciphertexts     The object of ciphertext { oldsCT, newsCT, newpCT }
     * @param {Object}                  merkleTreeData  The object of merkleTreeData { root, intermediateHashes, index }. Refer - src/services/client/merkleTreeData
     * @param {Object}                  nullifier       The nullifier, hexadecimal string
     * @param {Object}                  commitments     The object of commitments { oldCm, newCm }
     * @param {Object}                  opens           The object of openings { oldOpen, newOpen }
     * @param {Object}                  balance         The object of some balance type { pocket, oldCmBal }
     * @param {Object}                  aux             The object of auxiliary data related with encryption scheme  {  newR, newK }
     */
    constructor(
        keys,
        ciphertexts,
        merkleTreeData,
        nullifier,
        commitments,
        opens,
        balance,
        aux) {
        this.keys = keys;
        this.ciphertexts = ciphertexts;
        this.merkleTreeData = merkleTreeData;
        this.nullifier = nullifier;
        this.commitments = commitments;
        this.opens = opens;
        this.balance = balance;
        this.aux = aux;
    }

    toJson() {
        return JSON.stringify(this, null, 2);
    }

    toSnarkInputFormat() {
        const input = {
            'CT': {
                '0': this.ciphertexts.newpCT.c3[0],
                '1': this.ciphertexts.newpCT.c3[1],
                '2': this.ciphertexts.newpCT.c3[2],
            },
            'G_r': this.ciphertexts.newpCT.c0.toJson(),
            'K_a': this.ciphertexts.newpCT.c2.toJson(),
            'K_u': this.ciphertexts.newpCT.c1.toJson(),
            'addr': this.keys.sender.pk.ena,
            'addr_r': this.keys.receiver.pk.ena,
            'apk': this.keys.auditor.pk.toJson(),
            'cm': this.commitments.oldCm,
            'cm_': this.commitments.newCm,
            'direction': this.merkleTreeData.direction,
            'du': this.opens.oldOpen,
            'du_': this.opens.newOpen,
            'dv': types.padZeroHexString(this.balance.oldCmBal),
            'dv_': types.padZeroHexString(this.balance.pocket.privBal),
            'intermediateHashes': this.merkleTreeData.toIntermediateHashesJson(),
            'k': this.aux.newK.toJson(16),
            'k_b': this.keys.sender.pk.pkOwn,
            'k_b_': this.keys.receiver.pk.pkOwn,
            'k_u': this.keys.sender.pk.pkEnc.toJson(),
            'k_u_': this.keys.receiver.pk.pkEnc.toJson(),
            'pv': types.padZeroHexString(this.balance.pocket.pubInBal),
            'pv_': types.padZeroHexString(this.balance.pocket.pubOutBal),
            'r': this.aux.newR,
            'rt': this.merkleTreeData.root,
            'sk': this.keys.sender.sk,
            'sn': this.nullifier,
        };

        // If Fungible Token Transfered
        if (this.ciphertexts.oldsCT && this.ciphertexts.newsCT) {
            input['cin'] = {
                '0': this.ciphertexts.oldsCT.r,
                '1': this.ciphertexts.oldsCT.ct,
            };
            input['cout'] = {
                '0': this.ciphertexts.newsCT.r,
                '1': this.ciphertexts.newsCT.ct,
            };
        }

        return JSON.stringify(input);
    }

    static fromJson(libsnarkInputJson) {
        let dataJson = JSON.parse(libsnarkInputJson);
        return new SnarkInput(
            dataJson.keys,
            dataJson.ciphertexts,
            dataJson.merkleTreeData,
            dataJson.nullifier,
            dataJson.commitments,
            dataJson.opens,
            dataJson.balance,
            dataJson.aux,
        );

    }
}

/**
 * The test input format
 */
// const testInput = {
//     'CT': {
//         '0': '2f02c2aad141828fda4c7cb2b070f314b3f71324cd839675e05c5957eb07570b',
//         '1': '1853b11fe4b8462f401c1be783b1d6a13db557def6c51abbb0842ddeb332dae8',
//         '2': '2d0531ac7ddce7e9a163fb8a2275b3428614c9b4ae277162d7201ce4610b809d'
//     },
//     'G_r': '1d059a305fd08c6b1e0c7136a987f49b5e13aa7bd8f0912265ca978c87204b9c',
//     'K_a': '0962a59cc0e6e6a1584ecaec73fa463dd0a4a168d118deb6e52e5a62cbcc34c4',
//     'K_u': '0bbadda74613ffa013c8d7b4439d917306af9eb07ba3f52e035fa1134ad1de29',
//     'addr': '23d9e1800f5651ec2f4e70b988323ed73a910cb8bc27692b7670c4ed3189b12a',
//     'addr_r': '23a01df02eeb612e09de71e96a755ac84a7ddf8ba8879c9bdba26132c78be7b7',
//     'apk': '2ed6d29f04e2ada808ab83d82f0d408f029d342bc6f2264a1773a473bc345f1d',
//     'cin': {
//         '0': '0',
//         '1': '0'
//     },
//     'cm': '25b602c3277b75bff7814b3f355fb55055fdea92bb2e42bd9af060316680b97d',
//     'cm_': '29c2ef3fe24a8bf88e78e66730ef44e0c89964888ac44c468394758d8581adb4',
//     'cout': {
//         '0': '1d85f2f7cc39177370daa1990b4a9ccf49f74810bb6899612d4ee149acf2ded',
//         '1': '358169ae2c28020303c12948d0184ea6b187cc3970bd30e87f5794f608487ff'
//     },
//     'direction': '0000000000000000000000000000000000000000000000000000000000000000',
//     'du': '1dc0e70bd3635fa69856a004f66b2a48dad03ff7ef01ee0eaa0555e683de8228',
//     'du_': '0fe44fad7225d5ce1b607efd097c2daccfbaa13cc7ba8f45f6c418b761658a3a',
//     'dv': '0000000000000000000000000000000000000000000000000000000000000000',
//     'dv_': '0000000000000000000000000000000000000000000000000000000000000000',
//     'intermediateHashes': {
//         '0': '0000000000000000000000000000000000000000000000000000000000000000',
//         '1': '0f140047dfa92d9b77787cfc243ba6da07d8f8aa9301be9bf49042d7f203264a',
//         '10': '077c7e439baf9b532ef317adc8cf3038019e60991d1abf5bd57461199637b5fc',
//         '11': '17f6cef430d756ce419204338272ca3ede90a1ac48e5e108afb609eb646a5cd1',
//         '12': '2402b171497a731c46b2ae038d14829b5254c1b7bfc3f1cbe13ce580379afc5e',
//         '13': '17d3745bc3f612921730e7b4a707ce0c12b79c042af9edaf342a278a82e250ed',
//         '14': '1a6475eb32f4d450b77c789b837be1972ab6f25899347de0d7bed43dcc0da1be',
//         '15': '07684cf2073e6af343d401ea75afe5c0ea11f30df0c8051c2059a84f1132ea1b',
//         '16': '18bd29b44010b0d31c0e037c9c1960dcbaf20bf9105fffd82f5775e3deb55f22',
//         '17': '188c70f04f7b9a4551ba1d46fcc858c67ab201a316b41ff2cac792c3a4025a07',
//         '18': '2ec65c81126d7d3dd62bef28018b981431db9c4c1b8b11f9db8aafd1a2b2cde9',
//         '19': '06671741670ba6e2ebc8b116128b2bd03714dcf427bc1fa6072dc7fa6989a620',
//         '2': '14bb7f5be26893cddb59c1e471ac8249a1798f79ab8ddb2a2b3d6146e38c324c',
//         '20': '2a47dcb0113bfa95369c7dcc5e00bf9481ae3d2af79f49afd4ad0a9086468764',
//         '21': '26b204482c1062e21deab21837cbad324bf3665b7703ee3840fa947ac51917ec',
//         '22': '20ff9300f8bdbe90bdf94b77b1e6bc70c04c0fa8c09f62b597a67ad2510fa143',
//         '23': '072b099f119adacb72806db1b95ae7d265fbd246a824aad5afac027ba54d8ff8',
//         '24': '11c4143891b0519d799571bd6c5a9b05e3cacc4d72ecd42945f185d424b02f75',
//         '25': '22851f4e5e5cd08929fa3ed1bb16b71f5e9f34b8109909bfc0835fce02f92bfc',
//         '26': '0bfdc79281a2eb4f8827c4a3242769791160df843134193cfb580028a8838254',
//         '27': '10e999defa2e2b6ca3b7b4723a06379ec7aa0dccdf19cd3d731488d59244845a',
//         '28': '0b2b253c212ebf7261bedb1b30244709bdd94d84d3cb62e41e56e61303d0205a',
//         '29': '0c64e4c645a01c91b141ea302285a313166e4ebc6285feb407f7b069c4ee1d51',
//         '3': '19abb411fbbe945405da73a3483b98a64a548a49d992e3fa8697b9c1f6625c1a',
//         '30': '20a6e8e2135e68b770d8ed3254403ad2e959d1c8db35fd5103216cf80e5f0014',
//         '31': '22585cd9d15318bfdd921521d8a7f8b2a19f5032c63804dd706b70b8a4a56b7b',
//         '4': '0efcde44816cbde6cd6ddf56fdffff5730e75345216a57a4a15147737dceee76',
//         '5': '08dc58dc35b0ea3db1a6250701674bdf26dd96ab051e0ac1046dc91fc6ab14e1',
//         '6': '1afe16a96bf8f4321636f8208342a88761d50287694b901e92cc1f895475bbdc',
//         '7': '0611e53cf5bba8252bf3865a9f1e60f9c2178a5f3735c84465c0fa80b5ae1fb1',
//         '8': '19ee3818f4a5196dd8e33767fbed85d1b89c8059021e2bb92ba45ce1ced601f7',
//         '9': '1f37791efe708a0b3cb2cf15fd4015b6b952bc28fc81f94e3af624b692130ab1'
//     },
//     'k': '1bdbeb5b536f68013d4d286dd339d9b9470d36539ce1542c44d482dd80f91658',
//     'k_b': '1a89f02a6f2b6b3b3b3eb76f7fd26a7f023b0c3a893d8515e82b6af1b02830b3',
//     'k_b_': '1b73f8b6ab15288325822f51e236a58764777d8d7008e826341a80b688b6f611',
//     'k_u': '24571f2bb1ff9f5dee4fa107a5abb9079742953ec7edb8ba4af5cab463e3c18c',
//     'k_u_': '218d13dff254809e08330f44185dfdfaecb873048c7b32e8bab430c8e59da73a',
//     'pv': '0000000000000000000000000000000000000000000000000000000000000001',
//     'pv_': '0000000000000000000000000000000000000000000000000000000000000000',
//     'r': '0057ff910c16dd02232a2f360c7d194101bdf55fac388921a5ed8de28c242bf4',
//     'rt': '226ba971fb3415203e784960b0ebb1a7094c2d0e10eacdcf073583c5b5fad5ba',
//     'sk': '05eca5bc1a76c0faf2367db56ee47e0f280eee0bf33e299b92d054f276b45d54',
//     'sn': '0adbd531f62d533bf59d0405e4970e369b26fb1902c04bf46d946d69cd8161fb'
// };

