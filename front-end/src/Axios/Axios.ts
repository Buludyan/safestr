import {InterfacesProjectSpecificInterfaces as Interfaces} from 'interfaces';

import axios, {AxiosResponse} from 'axios';

const Axios = axios.create({
  baseURL: `https://n7r5fiqmub.execute-api.eu-central-1.amazonaws.com/safestr`,
});

export const safestrApi = {
  handshake(): Promise<AxiosResponse> {
    return Axios.post('/handshake');
  },
  upload(data: Interfaces.IImagePayload): Promise<AxiosResponse> {
    return Axios.post('/process', data);
  },
};
