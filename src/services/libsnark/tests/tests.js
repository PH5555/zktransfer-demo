import Libsnark from '../index';

export async function testZklayService() {
    if (Libsnark.ft.contextId === 0) {
        await Libsnark.ft.init();
    }
    // read/write CRS files
    await Libsnark.ft.readVerifyKeyFromFile('/crs/');
    await Libsnark.ft.readProofKeyFromFile('/crs/');

    // generates proof
    const inputs = {
        'CT': {
            '0': '2a162b0ea40895a5de0974b2f2d3e1cdb4ae0bb36b1f9b29f173553c1a7a2fbc',
            '1': '1dc7e83b684fb16c95daa2de27bd8e2e82b2fd6d7e9e254c930df6e13f366998',
            '2': '142a7075d7b5344ca9c52892194d1e1587d304dd701b1ed99378eed039e6177b'
        },
        'G_r': '38dd6dc6400e6315c37a9b7005113e67ecb1acfa3218515270fbf64ce01aeb7',
        'K_a': '2929f9150c0b707f1f9c1837dc074831d7f0dd6311497c1aedc49417a989cbae',
        'K_u': '1897ae8936dbbbdbd0087bae9e237beb8fe58f02a423535273ecc700f49aec6c',
        'addr': '0a270ea56c89f9c72f0de18f990aab7f5e860c44261f35d909d80e5e4ae010c0',
        'addr_r': '2d814e250c5a16859b29ac6ece416d456f2d7238c9eb02995f8c8a8d272f78e6',
        'apk': '0a9156230469a03de4e40c0f6a5465f4a89a3ce263bc2107099c289d358cde6c',
        'cm': '212bdd196333c892069de8654a83ac511b173b653c7b81661038aec33562e34c',
        'cm_': '092d3398fee214ab000624a8a1cb1f0c8a86c116d47d6d1d717d9aafcb1b285a',
        'direction': '0000000000000000000000000000000000000000000000000000000000000000',
        'du': '2c9babb6284102f595c4733b3502110de2efbfe0ccdb3570c663b4a12d0bfa4a',
        'du_': '080b808460e7ba54330756e45cc5a220f65f9728240aacdd169b00940b5145cb',
        'dv': '0000000000000000000000000000000000000000000000000000000000000001',
        'dv_': '0000000000000000000000000000000000000000000000000000000000000001',
        'intermediateHashes': {
            '0': '0000000000000000000000000000000000000000000000000000000000000000',
            '1': '0f140047dfa92d9b77787cfc243ba6da07d8f8aa9301be9bf49042d7f203264a',
            '10': '077c7e439baf9b532ef317adc8cf3038019e60991d1abf5bd57461199637b5fc',
            '11': '17f6cef430d756ce419204338272ca3ede90a1ac48e5e108afb609eb646a5cd1',
            '12': '2402b171497a731c46b2ae038d14829b5254c1b7bfc3f1cbe13ce580379afc5e',
            '13': '17d3745bc3f612921730e7b4a707ce0c12b79c042af9edaf342a278a82e250ed',
            '14': '1a6475eb32f4d450b77c789b837be1972ab6f25899347de0d7bed43dcc0da1be',
            '15': '07684cf2073e6af343d401ea75afe5c0ea11f30df0c8051c2059a84f1132ea1b',
            '16': '18bd29b44010b0d31c0e037c9c1960dcbaf20bf9105fffd82f5775e3deb55f22',
            '17': '188c70f04f7b9a4551ba1d46fcc858c67ab201a316b41ff2cac792c3a4025a07',
            '18': '2ec65c81126d7d3dd62bef28018b981431db9c4c1b8b11f9db8aafd1a2b2cde9',
            '19': '06671741670ba6e2ebc8b116128b2bd03714dcf427bc1fa6072dc7fa6989a620',
            '2': '14bb7f5be26893cddb59c1e471ac8249a1798f79ab8ddb2a2b3d6146e38c324c',
            '20': '2a47dcb0113bfa95369c7dcc5e00bf9481ae3d2af79f49afd4ad0a9086468764',
            '21': '26b204482c1062e21deab21837cbad324bf3665b7703ee3840fa947ac51917ec',
            '22': '20ff9300f8bdbe90bdf94b77b1e6bc70c04c0fa8c09f62b597a67ad2510fa143',
            '23': '072b099f119adacb72806db1b95ae7d265fbd246a824aad5afac027ba54d8ff8',
            '24': '11c4143891b0519d799571bd6c5a9b05e3cacc4d72ecd42945f185d424b02f75',
            '25': '22851f4e5e5cd08929fa3ed1bb16b71f5e9f34b8109909bfc0835fce02f92bfc',
            '26': '0bfdc79281a2eb4f8827c4a3242769791160df843134193cfb580028a8838254',
            '27': '10e999defa2e2b6ca3b7b4723a06379ec7aa0dccdf19cd3d731488d59244845a',
            '28': '0b2b253c212ebf7261bedb1b30244709bdd94d84d3cb62e41e56e61303d0205a',
            '29': '0c64e4c645a01c91b141ea302285a313166e4ebc6285feb407f7b069c4ee1d51',
            '3': '19abb411fbbe945405da73a3483b98a64a548a49d992e3fa8697b9c1f6625c1a',
            '30': '20a6e8e2135e68b770d8ed3254403ad2e959d1c8db35fd5103216cf80e5f0014',
            '31': '22585cd9d15318bfdd921521d8a7f8b2a19f5032c63804dd706b70b8a4a56b7b',
            '4': '0efcde44816cbde6cd6ddf56fdffff5730e75345216a57a4a15147737dceee76',
            '5': '08dc58dc35b0ea3db1a6250701674bdf26dd96ab051e0ac1046dc91fc6ab14e1',
            '6': '1afe16a96bf8f4321636f8208342a88761d50287694b901e92cc1f895475bbdc',
            '7': '0611e53cf5bba8252bf3865a9f1e60f9c2178a5f3735c84465c0fa80b5ae1fb1',
            '8': '19ee3818f4a5196dd8e33767fbed85d1b89c8059021e2bb92ba45ce1ced601f7',
            '9': '1f37791efe708a0b3cb2cf15fd4015b6b952bc28fc81f94e3af624b692130ab1'
        },
        'k': '24acdb824011f6854596986b82104cfb33f4b7db154699a1200d8b17a5fd7b66',
        'k_b': '14e5df838fee9ae98b86065c00ae9de2312cbfaf4c85674d41a9a506800a8dcd',
        'k_b_': '23b00667b97c826e16479b6e11addb79124d5838265999ebdfc8738f4e4f28ac',
        'k_u': '2d4c0bf6aea68b99d448a9de41863904aaa751379b7c5d9cfee229c6cee66b26',
        'k_u_': '0b6c068271a80bbdb897f742c2b5f7e4fae749b6d63ef233ceadd1a87112ebe5',
        'pv': '0000000000000000000000000000000000000000000000000000000000000001',
        'pv_': '0000000000000000000000000000000000000000000000000000000000000000',
        'r': '09e8f4b283e196e3db5a0ddcd26708619a5e9f7a4d44dfd97e14b4860deea7b0',
        'rt': '2b90356c0b3d44f463fd386d2ff2a49640ab6b8ed71f05e88a87b5f5dd72cb4d',
        'sk': '1ac0a465d62ef187934c17d30fc34c1bd2cca4f6e49de7a98a10090f3358756b',
        'sn': '186b8e0544bc2055383cf6574d5753428d5063f6d20ad39abd6ed2670cc1d49a',
        'cin': {
            '0': '0',
            '1': '0'
        },
        'cout': {
            '0': '23c7061f72e1f97fa97d7db4920718ae9886a3c8cd7fd33bc2103ffb86a72bf2',
            '1': '21c419d310ea279f3b4a1d9efa14bf2625a5d81fcc69b1693ba5938b57052498'
        }
    };

    const proof = await Libsnark.ft.runProof(inputs);
    console.log(proof);

    const vf = await Libsnark.ft.runVerify(proof, inputs);
    console.log('vf:', vf);

    // await Libsnark.ft.haltSnarkProcess();
}

export async function testZklayNftService() {
    if (Libsnark.nft.contextId === 0) {
        await Libsnark.nft.init();
    }
    // read/write CRS files
    await Libsnark.nft.readVerifyKeyFromFile('/crs/');
    await Libsnark.nft.readProofKeyFromFile('/crs/');

    // generates proof
    const inputs = {
        'CT': {
            '0': '1cfefcb0fc841b5ce2c11778b89734f004106e58822d4cc751da13bf3c85ace7',
            '1': '09bd931f36edf3abdc744bf1f97bde4074e1730ef34f449adc75752dc41ed586',
            '2': '201a402aa5d62f383ab9be21bf10ea7787b6271a4a0fb2aad23f30fdf0973b4d',
        },
        'G_r': '070a71c603eaf443224f0521980dbde845f2e5478d70e4f647fb3cff106ae25d',
        'K_a': '1b93142b62e832d5b6eb8cedaed7905b155cdc461e17835b6816693c25e4d679',
        'K_u': '2d67b8422b8fe96ef783906e2b7714a7ad035a4ff77a9cc09aae879b14da8117',
        'addr': '302599859bafc7b58ce56de112b45f6ce3c2e36b4d364fb9065506a5bde7b763',
        'addr_r': '0311ebe822714e38aa0fa7b164f5fc867c755bfc6cfe5009ac5384a248f6c3ae',
        'apk': '00b7406b092aa11824ac7545af19cad90edcd20bc43250d3538b406ac5b26994',
        'cm': '1bba1f497540c13b86a61ea4e852029d94fcb5f872226a41a08da9220f4fcab1',
        'cm_': '1902a5edbe7ff7638266b93f5774b8e1d1f6198b6b880fd4fccdb820fe978ab4',
        'direction': '0000000000000000000000000000000000000000000000000000000000000000',
        'du': '027cb1f1d779de9c67caf736318afefb52fd4d0aaa9678fb6b7cb17bc5142254',
        'du_': '191e983fc9bdaf13ac3ca507fc37442c7b6b5d7ec240163820886374d50d8cfc',
        'dv': '0000000000000000000000000000000000000000000000000000000000000000',
        'dv_': '001d1177c5fdc36e35341b3cf98ec7a2e8e5e1914c0000000000000000000000',
        'intermediateHashes': {
            '0': '0000000000000000000000000000000000000000000000000000000000000000',
            '1': '0f140047dfa92d9b77787cfc243ba6da07d8f8aa9301be9bf49042d7f203264a',
            '10': '077c7e439baf9b532ef317adc8cf3038019e60991d1abf5bd57461199637b5fc',
            '11': '17f6cef430d756ce419204338272ca3ede90a1ac48e5e108afb609eb646a5cd1',
            '12': '2402b171497a731c46b2ae038d14829b5254c1b7bfc3f1cbe13ce580379afc5e',
            '13': '17d3745bc3f612921730e7b4a707ce0c12b79c042af9edaf342a278a82e250ed',
            '14': '1a6475eb32f4d450b77c789b837be1972ab6f25899347de0d7bed43dcc0da1be',
            '15': '07684cf2073e6af343d401ea75afe5c0ea11f30df0c8051c2059a84f1132ea1b',
            '16': '18bd29b44010b0d31c0e037c9c1960dcbaf20bf9105fffd82f5775e3deb55f22',
            '17': '188c70f04f7b9a4551ba1d46fcc858c67ab201a316b41ff2cac792c3a4025a07',
            '18': '2ec65c81126d7d3dd62bef28018b981431db9c4c1b8b11f9db8aafd1a2b2cde9',
            '19': '06671741670ba6e2ebc8b116128b2bd03714dcf427bc1fa6072dc7fa6989a620',
            '2': '14bb7f5be26893cddb59c1e471ac8249a1798f79ab8ddb2a2b3d6146e38c324c',
            '20': '2a47dcb0113bfa95369c7dcc5e00bf9481ae3d2af79f49afd4ad0a9086468764',
            '21': '26b204482c1062e21deab21837cbad324bf3665b7703ee3840fa947ac51917ec',
            '22': '20ff9300f8bdbe90bdf94b77b1e6bc70c04c0fa8c09f62b597a67ad2510fa143',
            '23': '072b099f119adacb72806db1b95ae7d265fbd246a824aad5afac027ba54d8ff8',
            '24': '11c4143891b0519d799571bd6c5a9b05e3cacc4d72ecd42945f185d424b02f75',
            '25': '22851f4e5e5cd08929fa3ed1bb16b71f5e9f34b8109909bfc0835fce02f92bfc',
            '26': '0bfdc79281a2eb4f8827c4a3242769791160df843134193cfb580028a8838254',
            '27': '10e999defa2e2b6ca3b7b4723a06379ec7aa0dccdf19cd3d731488d59244845a',
            '28': '0b2b253c212ebf7261bedb1b30244709bdd94d84d3cb62e41e56e61303d0205a',
            '29': '0c64e4c645a01c91b141ea302285a313166e4ebc6285feb407f7b069c4ee1d51',
            '3': '19abb411fbbe945405da73a3483b98a64a548a49d992e3fa8697b9c1f6625c1a',
            '30': '20a6e8e2135e68b770d8ed3254403ad2e959d1c8db35fd5103216cf80e5f0014',
            '31': '22585cd9d15318bfdd921521d8a7f8b2a19f5032c63804dd706b70b8a4a56b7b',
            '4': '0efcde44816cbde6cd6ddf56fdffff5730e75345216a57a4a15147737dceee76',
            '5': '08dc58dc35b0ea3db1a6250701674bdf26dd96ab051e0ac1046dc91fc6ab14e1',
            '6': '1afe16a96bf8f4321636f8208342a88761d50287694b901e92cc1f895475bbdc',
            '7': '0611e53cf5bba8252bf3865a9f1e60f9c2178a5f3735c84465c0fa80b5ae1fb1',
            '8': '19ee3818f4a5196dd8e33767fbed85d1b89c8059021e2bb92ba45ce1ced601f7',
            '9': '1f37791efe708a0b3cb2cf15fd4015b6b952bc28fc81f94e3af624b692130ab1',
        },
        'k': '1b45a1742ed35405f5fd28b330366f016cc431c2391755fefb9fc3a2d596cc25',
        'k_b': '2a514047db132af9fe9966290ceab1c33e9f23922cebcd194ab1c839c3dcd975',
        'k_b_': '213544c3159c7d36ec3dfc51917c693ecdc56838238948b26736f4facfe432b0',
        'k_u': '2ed7044018f8880808267f6220c43c24ccaf510e2d5351b5362313eb3bfe35a0',
        'k_u_': '08669d270f3d60f10c557a5ce5a8f9d7c7730840aea8ee14e5481666a05a21f8',
        'pv': '001d1177c5fdc36e35341b3cf98ec7a2e8e5e1914c0000000000000000000000',
        'pv_': '0000000000000000000000000000000000000000000000000000000000000000',
        'r': '013144b36934890e1b76746bb80ffe8ed3f60ff810c0aa6c98c634f60d98dc73',
        'rt': '226ba971fb3415203e784960b0ebb1a7094c2d0e10eacdcf073583c5b5fad5ba',
        'sk': '0311c023b83da4cfaa95ae56db7be34b063ff68f41c46d01f1b9ad3059ddf507',
        'sn': '0c000aa176e3b4ebef5fd6a6ae77b457b74b5a0c1f58ef636a9238bfd4a08053',
    };

    const proof = await Libsnark.nft.runProof(inputs);
    console.log(proof);

    const vf = await Libsnark.nft.runVerify(proof, inputs);
    console.log('vf:', vf);

    // await zklayService.haltSnarkProcess();
}

export default {
    testZklayService,
    testZklayNftService,
};
