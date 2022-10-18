import {FormEvent, useEffect, useRef} from 'react';
import {safestrApi} from '../../Axios/Axios';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {useActions} from '../../Hooks/Actions';
import './VideoRecord.scss';

export const VideoRecord = () => {
  const {setImageData} = useActions();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const streamVideo = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: {width: 500, height: 300},
      })
      .then(stream => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;

          video.play();
        }
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    streamVideo();
  }, [videoRef]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const width = 414;
      const height = width / (16 / 9);

      const video = videoRef.current;
      const photo = photoRef.current;

      if (photo) {
        photo.width = width;
        photo.height = height;

        const ctx = photo.getContext('2d');
        if (ctx && video) {
          ctx.drawImage(video, 0, 0, width, height);
          const image = photo.toDataURL();
          const req = {
            _guard: InterfacesProjectSpecificInterfaces.imagePayloadTypeGuard,
            imageContent: image,
          };

          const response = await safestrApi.upload(req);

          console.log(response);
          if (response.data.persons[0]) {
            setImageData({
              imageSrc: image,
              protectiveEquipmentResult: response.data.persons[0],
            });
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [setImageData]);

  const onImageUpload = (event: FormEvent<HTMLInputElement>) => {
    const result = (event.target as HTMLInputElement).files;
    if (result) {
      const file = result[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const req = {
            _guard: InterfacesProjectSpecificInterfaces.imagePayloadTypeGuard,
            imageContent: reader.result,
          };

          console.log(reader.result);
          const response = await safestrApi.upload(req);

          console.log(response);
          setImageData({
            imageSrc: reader.result,
            protectiveEquipmentResult: response.data.persons[0],
          });
          if (imageInputRef.current) imageInputRef.current.value = '';
          console.log((event.target as HTMLInputElement).files);
        }
      };
      reader.onerror = function (error) {
        console.log('Error: ', error);
      };
    }
  };

  return (
    <div>
      <input type="file" onChange={e => onImageUpload(e)} ref={imageInputRef} />
      <video ref={videoRef} />
      <canvas ref={photoRef} style={{display: 'none'}}></canvas>
    </div>
  );
};
