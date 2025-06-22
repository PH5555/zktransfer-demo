import Libsnark from './libsnark';
import FtServices from './token/ft';

// TODO: 앱 시작시 load가 필요한 services

export async function zklayServiceInit() {
    await Libsnark.ft.init();

    await Libsnark.ft.readProofKeyFromFile('/crs/');
    await Libsnark.ft.readVerifyKeyFromFile('/crs/');
}

export async function zklayNftServiceInit() {
    await Libsnark.nft.init();

    await Libsnark.nft.readProofKeyFromFile('/crs/');
    await Libsnark.nft.readVerifyKeyFromFile('/crs/');
}

export async function tokenDBInit() {
    // const nativeToken = {
    //     name: 'Ethereum',
    //     symbol: 'ETH',
    //     address: '0x0000000000000000000000000000000000000000',
    //     imageUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    //     decimal: '0'
    // };
    const nativeToken = {
        name: 'Klaytn',
        symbol: 'KLAY',
        address: '0x0000000000000000000000000000000000000000',
        imageUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/klaytn/info/logo.png',
        decimal: '0'
    };
    await FtServices.insertTokenInfo(nativeToken);
}

const initServices = {
    zklayServiceInit,
    zklayNftServiceInit,
    tokenDBInit,
};

export default initServices;
