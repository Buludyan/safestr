import {useState, useEffect} from 'react';
import './App.scss';
import {safestrApi} from './Axios/Axios';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';

function App() {
  const onImageUpload = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const req = {
          _guard: InterfacesProjectSpecificInterfaces.imagePayloadTypeGuard,
          imageContent: reader.result,
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
