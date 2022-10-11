import {
  InterfacesProjectSpecificConstants,
  InterfacesProjectSpecificInterfaces,
} from 'interfaces';

import AWS from 'aws-sdk';
import {saveAs} from 'file-saver';

import {useActions} from '../../Hooks/Actions';
import {useAppSelector} from '../../Hooks/Selector';
import {subtractorApi} from '../../Axios/Axios';

import FileUploadIcon from '@mui/icons-material/FileUpload';
import {IconButton} from '@mui/material';

if (
  !process.env.REACT_APP_AWS_ACCESS_KEY ||
  !process.env.REACT_APP_AWS_SECRET_KEY
) {
  throw new Error('specify amazon access keys before start');
}

const myBucket = new AWS.S3({
  params: {Bucket: InterfacesProjectSpecificConstants.videoStoreName},
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY,
  },
});

export type TypeGuardOf<T> =
  T extends InterfacesProjectSpecificInterfaces.IGuard<
    infer TypeGuard extends string
  >
    ? TypeGuard
    : never;
export function makeSureThatXIs<T>(
  x: unknown,
  typeGuard: TypeGuardOf<T>
): asserts x is T {
  if (
    (x as InterfacesProjectSpecificInterfaces.IGuard<TypeGuardOf<T>>)._guard !==
    typeGuard
  ) {
    const errorMessage = 'TypeGuard check failed';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export const UploadBtn = () => {
  const {setVideoUrlBlob, setProcess, setUploading} = useActions();
  const {videoBlob, videoFile, videoName} = useAppSelector(
    state => state.subtractor
  );

  const getCorrectVideoFile = (): File => {
    if (videoFile) {
      return videoFile;
    }
    if (videoBlob) {
      const mp4File = new File([videoBlob], videoName, {type: 'video/mp4'});
      saveAs(mp4File, `Video-${Date.now()}.mp4`);
      return mp4File;
    } else {
      throw new Error(`Cannot reach here`);
    }
  };
  const uploadVideo = async () => {
    if (!videoBlob && !videoFile) {
      return;
    }

    setUploading(true);
    const mp4File = getCorrectVideoFile();

    try {
      const prepareReqObj =
        InterfacesProjectSpecificInterfaces.newVideoOriginalName(videoName);
      const prepResponse = await subtractorApi.prepare(prepareReqObj);
      console.log('prepare:', prepResponse);
      const videoHashName = prepResponse.data;
      makeSureThatXIs<InterfacesProjectSpecificInterfaces.IVideoHashName>(
        videoHashName,
        InterfacesProjectSpecificInterfaces.videoHashNameTypeGuard
      );

      localStorage.setItem(
        'videoHashName',
        JSON.stringify({
          videoHashName: videoHashName.videoHashName,
        })
      );

      const putObjectParams = {
        ACL: 'public-read',
        Body: mp4File,
        Bucket: InterfacesProjectSpecificConstants.videoStoreName,
        Key: videoHashName.videoHashName,
      };
      await myBucket.putObject(putObjectParams).promise();
      console.log('Video successfully sent');

      const procResponse = await subtractorApi.process(videoHashName);
      console.log('process:', procResponse);
      setUploading(false);
      setProcess(true);
    } catch (exception) {
      console.log(exception);
      throw exception;
    }
    setVideoUrlBlob(null);
  };

  return (
    <div>
      <IconButton onClick={uploadVideo}>
        <FileUploadIcon fontSize="large" />
      </IconButton>
    </div>
  );
};
