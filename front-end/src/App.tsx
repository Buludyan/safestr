import {useState, useEffect} from 'react';
import './App.scss';
import {safestrApi} from './Axios/Axios';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';

function App() {
  const [token, setToken] =
    useState<InterfacesProjectSpecificInterfaces.IToken | null>(null);

  useEffect(() => {
    const handshake = async () => {
      const response = await safestrApi.handshake();
      setToken(response.data);
      console.log(response.data);
    };

    handshake();
  }, []);

  const onImageUpload = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      if (typeof reader.result === 'string' && token) {
        const req = {
          _guard: InterfacesProjectSpecificInterfaces.imagePayloadTypeGuard,
          imageContent: reader.result,
          token,
        };

        console.log(req);
        const response = await safestrApi.upload(req);

        console.log(response);
      }

      console.log(reader.result);
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
  };

  return (
    <div className="app">
      <input type="file" onChange={e => onImageUpload(e)} />
    </div>
  );
}

export default App;
