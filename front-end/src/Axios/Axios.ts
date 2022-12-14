import {InterfacesProjectSpecificInterfaces as Interfaces} from 'interfaces';

import axios, {AxiosResponse} from 'axios';

const Axios = axios.create({
  baseURL: `https://genx518xyf.execute-api.eu-central-1.amazonaws.com/safestr`,
});

export const safestrApi = {
  upload(data: Interfaces.IImagePayload): Promise<AxiosResponse> {
    return Axios.post('/process', data);
  },
};
