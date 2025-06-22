import Contract from './contract';
import structure from './struct';
import Config from 'react-native-config';

const azerothContract = new Contract(Config.DEFAULT_ENDPOINT, Config.CONTRACT_ADDRESS);

const Azeroth = {
    azerothContract,
    Contract,
    structure,
};

export default Azeroth;