import types from '../../utils/types';
import mimc from '../cryptos/mimc';
import encryption from '../cryptos/encryption';
import math from '../../utils/math';
import Libsnark from '../libsnark';
import web3 from '../../web3';
import Web3 from '../../web3';
import Azeroth from '../../web3/azeroth';
import modules from '../libsnark/bridge/modules';

/**
 *
 * @param {Promise<*>}      proof                       Groth16 proof
 * @param {Object}          inputs                      - 'SnarkInput' class,
 * @param {Object}          inputs.keys                 - The object of keys { auditor.pk, sender, sender.pk, receiver.pk }
 * @param {Object}          inputs.ciphertexts          - The object of ciphertext { oldsCT, newsCT, newpCT }
 * @param {Object}          inputs.merkleTreeData       - The object of web3.azeroth.structure.mtree { root, intermediateHashes, index }. Refer - src/services/client/web3.azeroth.structure.mtree
 * @param {string}          inputs.nullifier            - The nullifier, hexadecimal string
 * @param {Object}          inputs.commitments          - The object of commitments { oldCm, newCm }
 * @param {Object}          inputs.opens                - The object of openings { oldOpen, newOpen }
 * @param {Object}          inputs.balance              - The object of some balance type { pocket, oldCmBal }
 * @param {Object}          inputs.aux                  - The object of auxiliary data related with encryption scheme  {  newR, newK }
 * @param {Object}          trnOption
 * @param {string}          trnOption.receiverEoa
 * @param {string}          trnOption.tokenAddress
 * @returns
 */
export function generateZkTransferTx(
    proof,
    inputs,
    trnOption) {

    const txParams = new Azeroth.structure.ZkTransferParam(
        proof,
        inputs.merkleTreeData.root,
        inputs.nullifier,
        inputs.keys.sender.pk,
        inputs.commitments.newCm,
        inputs.ciphertexts.newsCT,
        inputs.balance.pocket.toPub(),
        inputs.ciphertexts.newpCT,
        trnOption.receiverEoa,
        trnOption.tokenAddress,
    );

    return txParams;
}

/**
 *
 * @param       {Object}          input                   SnarkInput
 * @returns     {Promise<*>}                              Groth16 proof
 *
 * Proof Format. (to be input of contract)
 * [
 '0x076CAA04703CDDE4ED4566FA7D95DF4939B76F13C925DDB9FC132DF1F0D30DF9',           -- A
 '0x2A2B9F435497BF8618BA2662F28E4DE98B48C4181D61BE0C1F9758201233E3E6',           -- A
 [
 '0x2E7C71AD943AD9CFC5E21EE9AB51793FACDDC13B76D98ADBF3355907A88A7BC9',       -- B
 '0x1E913470C850A3FA8B46B6EB72AEE78B013440BFBF07DE1598CCDF7B44062E14',       -- B
 '0x14900549967F50C839AD09637BE4F80DEE1CE84F56454D1E7AE74AE56362F87C',       -- B
 '0x2B2D9D0A11AD23CC6F417F2FB41C13DBABF3B45C6476EFCB119012145FECBAE8',       -- B
 ]
 '0x303CE0136D9893489EC3E359BF8A4F366FAB6554C94D06C7C5585AE2B5F43B89',           -- C
 '0x1914F4DCFBF6EEE20E2A421247D823B04E326A4055E74C7463F443A854EB5B32'            -- C
 ]
 *
 *
 */
export async function generateFtProof(input) {
    let rawProof;
    try {
        const inputString = input.toSnarkInputFormat();
        rawProof = await Libsnark.ft.runProof(inputString);

        const vf = await Libsnark.ft.runVerify(rawProof, inputString);
        if (vf.lastmsg !== 'success'){
            throw Error('verify fail');
        }
    } catch (e) {
        console.error(e);
    }


    return Libsnark.structure.proof.fromLibsnark(rawProof);
}

/**
 *
 * @param       {Object}          input                   SnarkInput
 * @returns     {Promise<*>}                              Groth16 proof
 *
 * Proof Format. (to be input of contract)
 * [
 '0x076CAA04703CDDE4ED4566FA7D95DF4939B76F13C925DDB9FC132DF1F0D30DF9',           -- A
 '0x2A2B9F435497BF8618BA2662F28E4DE98B48C4181D61BE0C1F9758201233E3E6',           -- A
 [
 '0x2E7C71AD943AD9CFC5E21EE9AB51793FACDDC13B76D98ADBF3355907A88A7BC9',       -- B
 '0x1E913470C850A3FA8B46B6EB72AEE78B013440BFBF07DE1598CCDF7B44062E14',       -- B
 '0x14900549967F50C839AD09637BE4F80DEE1CE84F56454D1E7AE74AE56362F87C',       -- B
 '0x2B2D9D0A11AD23CC6F417F2FB41C13DBABF3B45C6476EFCB119012145FECBAE8',       -- B
 ]
 '0x303CE0136D9893489EC3E359BF8A4F366FAB6554C94D06C7C5585AE2B5F43B89',           -- C
 '0x1914F4DCFBF6EEE20E2A421247D823B04E326A4055E74C7463F443A854EB5B32'            -- C
 ]
 *
 *
 */
export async function generateNftProof(input) {
    let rawProof;
    try {
        const inputString = input.toSnarkInputFormat();
        rawProof = await Libsnark.nft.runProof(inputString);
    } catch (e) {
        console.error(e);
    }
    return Libsnark.structure.proof.fromLibsnark(rawProof);
}

/**
 *
 * @param {string}    senderAddr   The sender's address
 * @param {Object}    note      -  The user's note
 * @param {string}    note.open -  The opening of the commitment
 * @param {string}    note.bal  -  The balance of the commitment
 * @param {string}    note.cm   -  The commitment of the received note
 * @param {string}    note.idx  -  The index of the 'note.cm'
 * @param {Object}    hash      -  The hash class
 * @param {function}  hash.hash -  Hash function
 * @returns {Array}
 *  [0] @type {string} - old opening of the old commitment
 *  [1] @type {string} - the old commitment
 *  [2] @type {string} - the old commitment's balance
 *  [3] @type {Number}- index of the old commitment
 */
function getOldNoteInfo(senderAddr, note, hash) {
    let oldOpen, oldCm, oldCmBal, idx;
    if (note === null) {
        oldOpen = math.randomFieldElement().toString(16);
        oldCmBal = BigInt('0').toString(16);
        oldCm = hash.hash(oldOpen, oldCmBal, senderAddr);
        idx = 0;
    } else {
        oldOpen = note.open;
        oldCm = note.cm;
        oldCmBal = types.hexToInt(note.bal).toString(16);
        idx = parseInt(note.idx, 10);
    }
    return [oldOpen, oldCm, oldCmBal, idx];
}

/**
 *
 * @param {Azeroth.Contract} azerothContract
 * @param {Object}      keys                            Required key to generate 'zkTransfer' transaction.
 * @param {AuditKey}    keys.auditor
 * @param {string}      keys.auditor.pk                 Auditor's public key. Use 'spread operator'
 * @param {UserKey}     keys.sender
 * @param {Object}      keys.sender.pk                  Sender's privete key. Use 'spread operator'
 * @param {string}      keys.sender.sk                  Sender's public key. Use 'spread operator'
 * @param {UserKey}     keys.receiver
 * @param {Object}      keys.receiver.pk                Receiver's public key. Use 'spread operator'
 * @param {Pocket}      pocket
 * @param {Object}      trnOption                       Options that users can specify when executing 'zkTrnasfer'.
 * @param {Object}      trnOption.note                  The value of the commitment of the note that the value to be used by the user.
 * @param {Object}      trnOption.tokenAddress          The address of the token to be traded
 */
export async function generateFtSnarkInput(
    azerothContract,
    keys,
    pocket,
    trnOption,
) {
    const mimc7 = new mimc.MiMC7();

    const senc = new encryption.symmetricKeyEncryption(keys.sender.sk);
    const penc = new encryption.publicKeyEncryption();

    const senderAddr = keys.sender.pk.ena;
    const receiverAddr = keys.receiver.pk.ena;
    const senderSk = keys.sender.sk;


    const [oldOpen, oldCm, oldCmBal, idx] = getOldNoteInfo(senderAddr, trnOption.note, mimc7);

    const sn = mimc7.hash(oldCm, senderSk);

    const oldsCT = await azerothContract.getCiphertext(trnOption.tokenAddress, senderAddr);
    const oldEnaBal = oldsCT.empty() ? '0' : senc.Dec(oldsCT);
    const oldRt = types.decStrToHex(await azerothContract.getRootTop());
    const newOpen = math.randomFieldElement().toString(16);

    const [newpCT, newR, newK] = penc.Enc(
        keys.auditor.pk,
        keys.receiver.pk,
        ...[newOpen, pocket.privBal, receiverAddr],
    );

    const newEnaBal = (
        types.hexToInt(oldEnaBal) + types.hexToInt(oldCmBal) + types.hexToInt(pocket.pubInBal)
        - types.hexToInt(pocket.privBal) - types.hexToInt(pocket.pubOutBal)
    );
    if (newEnaBal < 0) {
        console.error(oldEnaBal, '+', oldCmBal, '+', pocket.pubInBal, '-', pocket.privBal, '-', pocket.pubOutBal, '=', newEnaBal);
        throw 'The new Ena balance must be more than 0';
    }
    const newsCT = senc.Enc(newEnaBal.toString(16));
    const newCm = mimc7.hash(newOpen, pocket.privBal, receiverAddr);

    const intermediateHashes = await azerothContract.getMerklePath(idx);
    const mtData = web3.Azeroth.structure.mtree(oldRt, intermediateHashes, idx);

    const ciphertexts = {
        oldsCT: oldsCT,
        newsCT: newsCT,
        newpCT: newpCT,
    };

    const commitments = {
        oldCm: oldCm,
        newCm: newCm,
    };

    const opens = {
        oldOpen: oldOpen,
        newOpen: newOpen,
    };

    const balance = {
        pocket: pocket,
        oldCmBal: oldCmBal,
    };

    const aux = {
        newR: newR,
        newK: newK,
    };

    return new Libsnark.structure.snarkInput(
        keys,
        ciphertexts,
        mtData,
        sn,
        commitments,
        opens,
        balance,
        aux,
    );
}

/**
 *
 * @param azerothContract
 * @param {Object}      keys                            Required key to generate 'zkTransfer' transaction.
 * @param {AuditKey}    keys.auditor
 * @param {string}      keys.auditor.pk                 Auditor's public key. Use 'spread operator'
 * @param {UserKey}     keys.sender
 * @param {Object}      keys.sender.pk                  Sender's privete key. Use 'spread operator'
 * @param {string}      keys.sender.sk                  Sender's public key. Use 'spread operator'
 * @param {UserKey}     keys.receiver
 * @param {Object}      keys.receiver.pk                Receiver's public key. Use 'spread operator'
 * @param {Pocket}      pocket
 * @param {Object}      trnOption                       Options that users can specify when executing 'zkTrnasfer'.
 * @param {string}      trnOption.tokenAddress
 * @param {Object}      trnOption.note                  The value of the commitment of the note that the value to be used by the user.
 * @param {string}      trnOption.receiverEoa           receiver Public Address
 */
export async function generateNftSnarkInput(
    azerothContract,
    keys,
    pocket,
    trnOption,
) {
    const mimc7 = new mimc.MiMC7();
    const penc = new encryption.publicKeyEncryption();

    const senderAddr = keys.sender.pk.ena;
    const receiverAddr = keys.receiver.pk.ena;
    const senderSk = keys.sender.sk;

    const [oldOpen, oldCm, oldCmBal, idx] = getOldNoteInfo(senderAddr, trnOption.note, mimc7);

    const oldRt = types.decStrToHex(await azerothContract.getRootTop());
    const newOpen = math.randomFieldElement().toString(16);
    pocket.serialize(trnOption.tokenAddress);
    const [newpCT, newR, newK] = penc.Enc(
        keys.auditor.pk,
        keys.receiver.pk,
        ...[newOpen, pocket.privBal, receiverAddr],
    );

    const sn = mimc7.hash(oldCm, senderSk);
    const newCm = mimc7.hash(newOpen, pocket.privBal, receiverAddr);
    const intermediateHashes = await azerothContract.getMerklePath(idx);
    const mtData = web3.Azeroth.structure.mtree(oldRt, intermediateHashes, idx);

    const ciphertexts = {
        newpCT: newpCT,
    };

    const commitments = {
        oldCm: oldCm,
        newCm: newCm,
    };

    const opens = {
        oldOpen: oldOpen,
        newOpen: newOpen,
    };

    const balance = {
        pocket: pocket,
        oldCmBal: oldCmBal,
    };

    const aux = {
        newR: newR,
        newK: newK,
    };

    return new Libsnark.structure.snarkInput(
        keys,
        ciphertexts,
        mtData,
        sn,
        commitments,
        opens,
        balance,
        aux);
}
