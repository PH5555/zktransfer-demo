import Proof from './struct/proof';
import SnarkInput from './struct/snarkInput';
import VerificationKey from './struct/vk';
import LibsnarkClass from './bridge/libsnark';

const zklay = new LibsnarkClass('ZKlay');
const zklayNft = new LibsnarkClass('ZKlay_nft');

const Libsnark = {
    structure: {
        proof: Proof,
        snarkInput: SnarkInput,
        verificationKey: VerificationKey,
    },
    ft: zklay,
    nft: zklayNft,
};

export default Libsnark;