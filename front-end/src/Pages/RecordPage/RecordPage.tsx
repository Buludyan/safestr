import React, {ChangeEvent} from 'react';

import {useActions} from '../../Hooks/Actions';
import {useAppSelector} from '../../Hooks/Selector';

import {Button} from '@mui/material';

import {VideoRecord} from '../../Components/VideoRecord/VideoRecord';
import {VideoStream} from '../../Components/VideoStream/VideoStream';
import {Process} from '../../Components/Process/Process';

import './RecordPage.scss';

export const RecordPage = () => {
  const {
    setWebcamOn,
    setVideoFile,
    setVideoUri,
    setRecordExist,
    setVideoUrlBlob,
  } = useActions();
  const {isWebcamOn, videoUri, isInProcess, isDone, isUploading, isFailed} =
    useAppSelector(state => state.subtractor);

  const webcamHandler = () => {
    setWebcamOn(true);
    setRecordExist(false);
    setVideoUrlBlob(null);
    setVideoUri(null);
  };

  const fileToDataUri = (file: File) =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target !== null) {
          resolve(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    });

  const selectVideoHandler = (evt: ChangeEvent<HTMLInputElement>) => {
    if (evt.target.files !== null) {
      const file: File = evt.target.files[0];
      setVideoFile(file);
      fileToDataUri(file).then(videoUri => {
        setVideoUri(videoUri as string);
      });
    }
  };

  return (
    <div className="recordPage">
      <div className="recordPage__inner">
        <p className="recordPage__title">Subtractor</p>
        <div className="recordPage__description">
          {isFailed ? (
            <p>Error. File not found.</p>
          ) : isUploading ? (
            <p>Uploading video.</p>
          ) : isDone ? (
            <p>Subtitles are ready!</p>
          ) : videoUri && !isInProcess ? (
            <p>Now upload this video to Subtractor service.</p>
          ) : isInProcess && !isDone ? (
            <p>Video in process</p>
          ) : (
            <div>
              <p>Create subtitles for your video just in few clicks!</p>
              <p>
                You can record video with webcam or upload it from computer.
              </p>
            </div>
          )}
        </div>
        {isWebcamOn || !!videoUri ? (
          <div />
        ) : (
          <div className="btns">
            <div className="btns__inner">
              <Button onClick={webcamHandler} variant="contained">
                Webcam
              </Button>
              <div className="btns__divider" />
              <Button variant="contained" component="label">
                Upload File
                <input
                  type={'file'}
                  onChange={evt => selectVideoHandler(evt)}
                  hidden
                />
              </Button>
            </div>
          </div>
        )}
        {isInProcess && !isDone && <Process />}
        {isWebcamOn && !isInProcess && !isDone && <VideoStream />}
        {!!videoUri && !isInProcess && !isDone && <VideoRecord />}
      </div>
    </div>
  );
};
