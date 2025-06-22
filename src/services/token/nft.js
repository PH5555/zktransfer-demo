// TODO nft, nft1155 상위 class 만들기( db구조는 동일하므로 )

import axios from 'axios';
import _, {parseInt} from 'lodash';
import Config from 'react-native-config';
import Web3 from '../../web3';
import types from '../../utils/types';
import { Pocket } from '../client/pocket';
import { generateNftProof, generateNftSnarkInput, generateZkTransferTx } from '../client/tx';
import Azeroth from '../../web3/azeroth';
import noteServices from './notes';
import { NftModelInstance, AddressNftInstance } from '../../db';

const BASE_ENDPOINT = Config.DEFAULT_ENDPOINT;

/**
 * nftData = [{
 *      id: string,
 *      name: string,
 *      imageUri: string,
 *      contractAddress: string,
 *      isPrivate: boolean,
 *  }]
 * @param {object} nftData
 * @param {UserKey} senderKeyPair
 * @param {string} userEoa
 * @param {string} senderEoaPrivateKey
 * @param {string} receiverEoa
 * @param {boolean} isPrivateMode
 * @return {Promise<TransactionReceipt>}
 */
async function privateTransfer(nftData, senderKeyPair, userEoa, senderEoaPrivateKey, receiverEoa, isPrivateMode) {
    const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, _.get(nftData, 'contractAddress'));
    const TRANSFER_MODE = {
        true: 'PRIVATE',
        false: 'PUBLIC',
    };

    console.debug('## CONTRACT_ADDRESS: ',Config.CONTRACT_ADDRESS, nftData.id);

    await web3.approve(Config.CONTRACT_ADDRESS, nftData.id, userEoa, senderEoaPrivateKey);


    // Pokect Type Enum
    //  - NFT_PUBLIC_TO_PRIVATE: send public token to note
    //  - NFT_PRIVATE_TO_PRIVATE: send note to note
    //  - NFT_PRIVATE_TO_PUBLIC: send note to public token
    const pocket = Pocket.genPocketFromType(
        `NFT_${TRANSFER_MODE[nftData.isPrivate.toString()]}_TO_${TRANSFER_MODE[isPrivateMode.toString()]}`,
        web3.utils.toHex(Number(nftData.id)),
    );
    const trnOption = {
        note: nftData.note || null,
        tokenAddress: web3.tokenAddress,
        receiverEoa: receiverEoa,
    };
    const receiverPk = new Azeroth.structure.Key.UserKey(
        await Azeroth.azerothContract.getUserPublicKeys(receiverEoa),
        '',
    );
    const apk = await Azeroth.azerothContract.getAPK();
    const keys = {
        auditor: apk,
        sender: senderKeyPair,
        receiver: receiverPk,
    };
    types.removeHexRepresentation(keys);

    const inputs = await generateNftSnarkInput(
        Azeroth.azerothContract,
        keys,
        pocket,
        trnOption,
    );

    const proof = await generateNftProof(inputs);
    let txParam;

    try{ txParam = generateZkTransferTx(proof, inputs, trnOption);}
    catch (e) { console.error(e);}

    return Azeroth.azerothContract.zkTransferNft(txParam, userEoa, senderEoaPrivateKey);
}

/**
 *
 * @param {string} contractAddress
 * @param {string} userEOA
 * @param {string} privateKey
 * @param {string} receiverEOA
 * @param {string} tokenId
 * @return {Promise<TransactionReceipt>}
 */
async function publicTransfer(contractAddress, userEOA, privateKey, receiverEOA, tokenId) {
    const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    return web3.transfer(
        userEOA,
        receiverEOA,
        tokenId,
        privateKey,
    );
}

/**
 *
 * @return {Promise<[]>}
 */
async function getPublicNFTs() {
    return getAddressNftsFromDB(false);
}

/**
 *  get private nft by ena private key
 * @param enaPrivateKey
 * @return {Promise<[]>}
 */
async function getPrivateNFTs(enaPrivateKey) {
    const notes = [];
    const rawNotes = await noteServices.getNFTUnSpentNotes(enaPrivateKey);

    for (const rawNote of rawNotes) {
        const contractAddress = rawNote.bal.substring(0, 40);
        const tokenId = Number('0x' + rawNote.bal.substring(40));

        notes.push({
            ...(await NFTService.getAddrNftInfo(contractAddress, tokenId)),
            isPrivate: true,
            note: rawNote,
        });
    }
    return notes;
}

async function approveNFT(contractAddress, userEoa, privateKey) {
    const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    return web3.setApproveAll(Config.CONTRACT_ADDRESS, userEoa, privateKey).catch(e => {console.error(e);});
}

/**
 * get nft Data
 * @param {string} nftURI   NFT URI
 * @return {Promise<{imageUri: string, name: string, description: string, attributes: string}>}
 */
async function getNFTImage(nftURI) {
    // TODO if opensea format
    // TODO if alchemy format
    // TODO if other format
    const nftData = {
        imageUri: '',
        name: '',
        description: '',
        attributes:'',
    };

    await axios.get(nftURI).then((res) => {
        if (res.status === 200) {
            nftData.imageUri = _.get(res, 'data.image') || _.get(res, 'data.image_url');
            nftData.name = _.get(res, 'data.name');
            nftData.description = _.get(res, 'data.description');
            nftData.attributes = _.get(res, 'data.attributes');
        }
    });
    return nftData;
}

/**
 * return type:
 * [{
 *      id: string,
 *      name: string,
 *      imageUri: string,
 *      contractAddress: string,
 *      isPrivate: boolean,
 *  }]
 *
 * @param {string} contractAddress
 * @param {string} address  owner EOA
 * @return {Promise<[]>}
 */
async function getNFTsDataByOwner(contractAddress, address) {
    const nftsData = [];
    const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    const tokenIdList = await web3.getTokensByOwnerAddress(address);

    for (const tokenId of tokenIdList) {
        const uri = await web3.getTokenURI(tokenId);
        const nftImage = await getNFTImage(uri);
        nftsData.push({
            id: tokenId,
            name: nftImage.name,
            imageUri: nftImage.image,
            contractAddress: web3.tokenAddress,
            isPrivate: false,
        });
    }

    return nftsData;
}

/**
 * return type:
 * {
 *      id: string,
 *      name: string,
 *      imageUri: string,
 *      contractAddress: string,
 *      isPrivate: boolean,
 *  }
 * @param {string} contractAddress
 * @param {string} tokenId
 * @return {Promise<{}>}
 */
async function getAddrNftInfo(contractAddress, tokenId) {
    const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    const numCheck = /\d/;
    if(!numCheck.test(tokenId)){
        throw Error('tokenId is not valid number');
    }
    const metaData={
        uri:'',
        imageUri:'',
        description:'',
        name:'',
        attributes:'',
    };
    metaData.uri = await web3.getTokenURI(tokenId);
    const data = await getNFTImage(metaData.uri);
    metaData.name = data.name;
    metaData.imageUri = data.imageUri;
    metaData.description = data.description;
    metaData.attributes = data.attributes;

    return {
        id: tokenId,
        address: contractAddress,
        metadata: metaData,
    };
}

/**
 * TODO remove for devel
 * @param {string} contractAddress
 * @param {string} address
 * @param {string} privateKey
 * @return {Promise<[]>}
 */
async function mintNFT(contractAddress, address, privateKey) {
    const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    await web3.mint(address, privateKey);
    return web3.getTokensByOwnerAddress(address);
}

/**
 * @param {string} contractAddress
 * @return {Promise<boolean>}
 */
async function isValidNftAddress(contractAddress) {
    if( !Web3.Web3Interface.utils.isAddress(contractAddress) ) {
        return false;
    }
    // TODO check Erc721, smartContract
    const contract = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    if ( await contract.hasMethod(contractAddress, 'supportsInterface(bytes4)')) {
        return contract.supportsInterface('0x80ac58cd');
    }
    return true;
}

/**
 *
 * @param {string} contractAddress
 * @param {string} address
 * @param {string | number | BigInt} tokenId
 * @return {Promise<boolean>}
 */
async function isValidOwner(contractAddress, address, tokenId) {
    if (!Web3.Web3Interface.utils.isAddress(contractAddress) || !Web3.Web3Interface.utils.isAddress(address)) {
        return false;
    }
    const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    const ownerAddress = await web3.ownerOf(tokenId);

    return ownerAddress === address;
}
async function syncNft(contractAddress, userEOA){

    const w3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    // const test = AddressNftInstance.selectAddr();
    const test = await getNftsFromDB({address: contractAddress});

    // await NftModelInstance.updateToken({block_number: 0},{address : contractAddress});
    // const blockNumber = (await NftModelInstance.selectToken(['block_number'],{address : contractAddress}))[0].block_number;
    // const latest = await w3.eth.getBlockNumber();
    // let options = {
    //     filter:{
    //         from: '0x0000000000000000000000000000000000000000',
    //     },
    //     fromBlock: blockNumber+1,                  //Number || "earliest" || "pending" || "latest"
    //     toBlock: latest,
    // };
    // const logs = await w3.getEvent('Transfer',options);
    //await NftModelInstance.updateToken({block_number: latest},{address : contractAddress});
}
// async eventListener(fromBlock, toBlock='latest') {
//
//     let options = {
//         // filter: {
//         //     value: ['1000', '1337']    //Only get events where transfer value was 1000 or 1337
//         // },
//         fromBlock: fromBlock,                  //Number || "earliest" || "pending" || "latest"
//         toBlock: toBlock
//     };
//
//     const result = await this.eth.subscribe('logs', options);
//     console.debug(result);
//     return result;
// }
// async function getTokenInfo(contractAddress){
//     console.debug('getTokenInfo');
//     const w3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
//     const info = {
//         metadata: {
//             name:'',
//             symbol:'',
//         },
//         address: '',
//         block_number: 0,
//     };
//     NftModelInstance.selectToken({address : contractAddress});
//
// }
/**
 * @param {string} contractAddress
 * @return {Promise<{name: string, symbol: string}>}
 */
async function getNftInfo(contractAddress) {
    const w3 = new Web3.Erc721.Contract(BASE_ENDPOINT, contractAddress);
    const nftInfo = {
        metadata:'',
        address:contractAddress,
    };
    const metadata = {
        name: '',
        symbol: '',
    };
    if (await w3.hasMethod(contractAddress, 'name()')) {
        metadata.name = await w3.name();
    }
    if (await w3.hasMethod(contractAddress, 'symbol()')) {
        metadata.symbol = await w3.symbol();
    }

    nftInfo.metadata = metadata;

    // // TODO ..
    // if (await w3.hasMethod(contractAddress, 'uri(uint256)') && tokenId) {
    //     // ERC 1155 function
    //     info.imageUri = await w3.getTokenURI(tokenId);
    // }
    // if (await w3.hasMethod(contractAddress, 'tokenURI(uint256)') && tokenId) {
    //     // ERC 721 function
    //     info.imageUri = await w3.getTokenURI(tokenId);
    // }
    // if (!(await w3.hasMethod(contractAddress, 'ownerOf(uint256)'))) {
    //     return false;
    // }
    return nftInfo;
}


// DB services
/**
 *
 * @param {object} nftInfo
 * @param {pbject} nftInfo.metadata
 * @param {string} nftInfo.address
 * @return {Promise<Erc721>}
 */
async function insertNft(nftInfo) {
    const columns = {
        metadata: JSON.stringify(nftInfo.metadata),
        address: nftInfo.address,
    };
    return NftModelInstance.insertNftIfNotExist(columns);
}

/**
 *
 * @param {Erc721} nftInfo
 * @return {Promise<void>}
 */
async function deleteNft(address) {
    return NftModelInstance.deleteNft(address);
}

async function insertAddrNft(addrNftInfo){
    const columns = {
        metadata: JSON.stringify(addrNftInfo.metadata),
        address: addrNftInfo.address,
        id: addrNftInfo.id,
        is_private: addrNftInfo.is_private,
    };
    return AddressNftInstance.insertAddr(columns);
}

/**
 * @param {String|Array} where
 * @return {Promise<[]>}
 */
async function getNftsFromDB(where=false) {
    // TODO addresses가 Array일 때 where절 완성

    return NftModelInstance.selectNft(false,where);
}

/**
 *
 * @param {any} where
 * @returns {Promise<Array>}
 */
async function getAddressNftsFromDB(where){

    const dataList = await AddressNftInstance.selectAddr(false,where);
    for(let i=0; i<dataList.length; i++) {
        dataList[i].metadata = JSON.parse(dataList[i].metadata);
    }
    return dataList;
}

/**
 *
 * @param {any}receipt
 * @returns {number}
 */
function getTransferEvent(receipt) {
    let id = 0;
    for(const log of receipt.logs){
        if(log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'){
            id = log.topics[3];
        }
    }
    if(id){
        id = id.replace('0x','');
        return parseInt(id,16);
    }
    else{
        throw new Error('Transfer event format error!');
    }
}

// TODO for devel
async function forCESTest(senderAddress, senderPrivateKey) {
    try {
        // insert ERC721Test0 in DB
        const tokenInfo = await getNftInfo(Config.ERC721_ADDRESS_0);

        await insertNft(tokenInfo);
        // minting new NFT
        // address: Alice address
        const web3 = new Web3.Erc721.Contract(BASE_ENDPOINT, Config.ERC721_ADDRESS_0);
        // TODO REMOVE : configuration check
        const minting = await web3.mint(
            senderAddress,
            senderPrivateKey);

        const mintedTokenID = getTransferEvent(minting);
        console.debug('NFT721 minted ID: ', mintedTokenID);
        // public transfer
        const newAddrNft = await NFTService.getAddrNftInfo(Config.ERC721_ADDRESS_0, mintedTokenID);
        await insertAddrNft(Object.assign({is_private: 0},newAddrNft));
    } catch (e) {
        console.error('NFT transfer Error!', e);
        return false;
    }
    return true;
}

const NFTService = {
    privateTransfer,
    publicTransfer,
    getPrivateNFTs,
    getPublicNFTs,
    approveNFT,
    syncNft,
    getTransferEvent,
    getNFTImage,
    getNFTsDataByOwner,
    mintNFT,
    getAddressNftsFromDB,
    insertAddrNft,
    getAddrNftInfo,
    getNftInfo,
    isValidNftAddress,
    isValidOwner,
    insertNft,
    deleteNft,
    getNftsFromDB,
    forCESTest,
};

export default NFTService;
