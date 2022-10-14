import {InterfacesProjectSpecificInterfaces as Interfaces} from 'interfaces';

import axios, {AxiosResponse} from 'axios';

const Axios = axios.create({
  baseURL: `https://f0wxhv7p3d.execute-api.eu-central-1.amazonaws.com/safestr`,
});

export const safestrApi = {
  upload(data: Interfaces.IImagePayload): Promise<AxiosResponse> {
    return Axios.post('/upload', data);
  },

  handshake(): Promise<AxiosResponse> {
    return Axios.post('/handshake');
  },
};
