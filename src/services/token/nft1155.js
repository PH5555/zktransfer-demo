// TODO nft, nft1155 상위 class 만들기( db구조는 동일하므로)

import axios from 'axios';
import _ from 'lodash';
import Config from 'react-native-config';
import Web3 from '../../web3';
import types from '../../utils/types';
import { Pocket } from '../client/pocket';
import { generateNftProof, generateNftSnarkInput, generateZkTransferTx } from '../client/tx';
import Azeroth from '../../web3/azeroth';
import noteServices from './notes';
import {AddressNftInstance, NftModelInstance} from '../../db';

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
// TODO TOKENID || AMOUNT
async function privateTransfer(nftData, senderKeyPair, userEoa, senderEoaPrivateKey, receiverEoa, isPrivateMode) {
    const web3 = new Web3.Erc1155.Contract(BASE_ENDPOINT, _.get(nftData, 'contractAddress'));
    const TRANSFER_MODE = {
        true: 'PRIVATE',
        false: 'PUBLIC',
    };

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
    const receiverPk = await Azeroth.azerothContract.getUserPublicKeys(receiverEoa);
    const keys = {
        auditor: {
            pk: types.decStrToHex(await Azeroth.azerothContract.getAPK()),
        },
        sender: senderKeyPair,
        receiver: {
            pk: receiverPk,
        },
    };
    types.removeHexRepresentation(keys);

    const inputs = await generateNftSnarkInput(
        Azeroth.azerothContract,
        keys,
        pocket,
        trnOption,
    );


    const proof = await generateNftProof(inputs);
    const txParam = generateZkTransferTx(proof, inputs, trnOption);

    return Azeroth.azerothContract.zkTransferNft(txParam, userEoa, senderEoaPrivateKey);
}

/**
 *
 * @param {string} contractAddress
 * @param {string} userEOA
 * @param {string} privateKey
 * @param {string} receiverEOA
 * @param {string} tokenId
 * @param {string} amount
 * @return {Promise<TransactionReceipt>}
 */
async function publicTransfer(contractAddress, userEOA, privateKey, receiverEOA, tokenId, amount) {
    const web3 = new Web3.Erc1155.Contract(BASE_ENDPOINT,contractAddress);
    return web3.safeTransfer(
        userEOA,
        receiverEOA,
        tokenId,
        amount,
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
            ...(await getAddrNftInfo(contractAddress, tokenId)),
            isPrivate: true,
            note: rawNote,
        });
    }
    return notes;
}

async function approveNFT(contractAddress, userEoa, privateKey) {
    const web3 = new Web3.Erc1155.Contract(BASE_ENDPOINT,contractAddress);
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
    const web3 = new Web3.Erc1155.Contract(BASE_ENDPOINT, contractAddress);
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
 * @param {string} contractAddress
 * @return {Promise<boolean>}
 */
async function isValidNftAddress(contractAddress) {
    if( !Web3.Web3Interface.utils.isAddress(contractAddress) ) {
        return false;
    }
    // TODO check Erc1155, smartContract
    const contract = new Web3.Erc1155.Contract(BASE_ENDPOINT, contractAddress);
    if ( await contract.hasMethod(contractAddress, 'supportsInterface(bytes4)')) {
        return contract.supportsInterface('0xd9b67a26');
    }
    return true;
}

/**
 * @param {string} contractAddress
 * @param {string} address
 * @param {string | number | BigInt| Array} tokenId
 * @return {Promise<boolean>}
 */
async function isValidOwner(contractAddress, address, tokenId) {
    if (!Web3.Web3Interface.utils.isAddress(contractAddress) || !Web3.Web3Interface.utils.isAddress(address)) {
        return false;
    }
    const web3 = new Web3.Erc1155.Contract(BASE_ENDPOINT,contractAddress);
    let balance = 0;
    if(Array.isArray(tokenId)){
        balance = await web3.balanceOfBatch(address,tokenId);
    }
    else {
        balance = await web3.balanceOf(address,tokenId);
    }
    return balance > 0;
}

/**
 * @param {string} contractAddress
 * @return {Promise<{name: string, symbol: string}>}
 */
async function getNftInfo(contractAddress) {
    const w3 = new Web3.Erc1155.Contract(BASE_ENDPOINT, contractAddress);
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
 * @return {Promise<Erc1155>}
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
 * @param {Erc1155} nftInfo
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
        // address_id: addrNftInfo.address + addrNftInfo.id,
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
    console.debug('ERC1155 topics : ', receipt.logs[0].topics);
    // for(const log of receipt.logs){
    //     if(log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'){
    //         id = log.topics[3];
    //     }
    // }
    // if(id){
    //     id = id.replace('0x','');
    //     return parseInt(id,16);
    // }
    // else{
    //     throw new Error('Transfer event format error!');
    // }
    return receipt;
}


// async function getNFTContract(contractAddress) {
//     const signature = 'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)';
//     const netwb3 = new Web3.Web3Interface(BASE_ENDPOINT);
//     if(netwb3.hasMethod(contractAddress,signature)) {
//         return new Web3.Erc1155.Contract(BASE_ENDPOINT, contractAddress);
//     }
//     else {
//         return new Web3.Erc1155.Contract(BASE_ENDPOINT, contractAddress);
//     }
// }

// TODO for devel
async function forCESTest(senderAddress, senderPrivateKey) {
    try {
        // insert ERC1155Test0 in DB
        const tokenInfo = await getNftInfo(Config.ERC1155_ADDRESS_0);

        await insertNft(tokenInfo);
        // minting new NFT
        // address: Alice address
        const web3 = new Web3.Erc1155.Contract(BASE_ENDPOINT, Config.ERC1155_ADDRESS_0);
        // TODO REMOVE : configuration check
        const minting = await web3.mint(
            senderAddress,
            0,
            100,
            senderPrivateKey);
        // console.debug(JSON.stringify(minting));
        // const mintedTokenID = getTransferEvent(minting);

        // console.debug('NFT721 minted ID: ', mintedTokenID);
        // // public transfer
        const newAddrNft = await NFT1155Service.getAddrNftInfo(Config.ERC1155_ADDRESS_0, 0);
        await insertAddrNft(newAddrNft);
        const selectnft = await getAddressNftsFromDB(false);
        console.debug('NFT LIST : ',selectnft);
    } catch (e) {
        console.error('NFT transfer Error!', e);
        return false;
    }
    return true;
}

const NFT1155Service = {
    privateTransfer,
    publicTransfer,
    getPrivateNFTs,
    getPublicNFTs,
    approveNFT,
    getNFTImage,
    getAddrNftInfo,
    isValidNftAddress,
    isValidOwner,
    insertAddrNft,

    insertNft,
    deleteNft,
    getNftsFromDB,
    getNftInfo,
    forCESTest,
};

export default NFT1155Service;
