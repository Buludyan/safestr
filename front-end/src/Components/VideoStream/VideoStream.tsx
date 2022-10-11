import {useEffect, useRef} from 'react';

import {useAppSelector} from '../../Hooks/Selector';

import {ControlBtns} from '../ControlBtns/ControlBtns';

import './VideoStream.scss';

export const VideoStream = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {isRecording, videoUri} = useAppSelector(state => state.subtractor);

  const streamVideo = () => {
    navigator.mediaDevices
      .getUserMedia({
        video:
          window.screen.width <= 700
            ? {width: 400, height: 250}
            : {width: 692, height: 400},
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

  return (
    <div className="stream" style={{display: videoUri ? 'none' : 'inline'}}>
      <div className="stream__inner">
        <video
          ref={videoRef}
          className={isRecording ? 'stream__rec' : 'stream__pause'}
        />
        <ControlBtns />
      </div>
    </div>
  );
};
