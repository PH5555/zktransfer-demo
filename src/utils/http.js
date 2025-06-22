import axios from 'axios';
import Config from 'react-native-config';

export const httpClient = axios.create({
    baseURL: Config.REACT_APP_API_BASE_URL,
});

export default httpClient;
