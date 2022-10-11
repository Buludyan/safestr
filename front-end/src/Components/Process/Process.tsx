import {InterfacesProjectSpecificInterfaces} from 'interfaces';

import React, {useEffect} from 'react';

import {useActions} from '../../Hooks/Actions';
import {subtractorApi} from '../../Axios/Axios';

import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import './Process';

export const Process = () => {
  const {setProcess, setDone, setFailed} = useActions();

  useEffect(() => {
    const maxRetryCount = 20;
    let currentRetryCount = 0;
    const interval = setInterval(async () => {
      const videoHashNameStr = localStorage.getItem('videoHashName');
      if (!videoHashNameStr) {
        throw new Error(`Unable to get videoHashName from local storage`);
      }
      // TODO: remove `as`
      const videoHashName = JSON.parse(
        videoHashNameStr
      ) as InterfacesProjectSpecificInterfaces.IVideoHashName;
      const downloadReqObj =
        InterfacesProjectSpecificInterfaces.newVideoHashName(
          videoHashName.videoHashName
        );
      console.log('downloadReqObj: ', downloadReqObj);
      const downloadResponse = await subtractorApi.download(downloadReqObj);
      if (downloadResponse.status === 200) {
        setProcess(false);
        setDone(true);
        window.location.href = downloadResponse.data.subtitleSignedUrl;
      } else {
        ++currentRetryCount;
        if (currentRetryCount === maxRetryCount) {
          setProcess(false);
          setDone(true);
          setFailed(true);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [setDone, setProcess, setFailed]);

  return (
    <div className="dowload">
      <div>
        <Box sx={{display: 'flex'}}>
          <CircularProgress />
        </Box>
      </div>
    </div>
  );
};
