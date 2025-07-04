import Config from 'react-native-config';

/* For test purposes */
export const ZERO_ADDRESS = Config.ZERO_ADDRESS || '0x0000000000000000000000000000000000000000';

/* Gas loaded on each tx */
export const DEFAULT_REGISTER_GAS = Number(Config.DEFAULT_REGISTER_GAS) || 200000;
export const DEFAULT_ZK_TRANSFER_GAS = Number(Config.DEFAULT_ZK_TRANSFER_GAS) || 4000000;
export const DEFAULT_LEGACY_TRANSFER_GAS = Number(Config.DEFAULT_LEGACY_TRANSFER_GAS) || 40000;
export const DEFAULT_DEPLOY_GAS = Number(Config.DEFAULT_DEPLOY_GAS) || 10000000;
export const DEFAULT_GAS_VALUE = Number(Config.DEFAULT_GAS_VALUE) || 3000000;

/* Expected gas cost on tx */
export const EXPECTED_ZK_TRANSFER_GAS = Number(Config.EXPECTED_ZK_TRANSFER_GAS) || 1500000;

const Constants = {
    ZERO_ADDRESS,
    DEFAULT_REGISTER_GAS,
    DEFAULT_ZK_TRANSFER_GAS,
    DEFAULT_LEGACY_TRANSFER_GAS,
    DEFAULT_DEPLOY_GAS,
    DEFAULT_GAS_VALUE,
    EXPECTED_ZK_TRANSFER_GAS,
};

export default Constants;
