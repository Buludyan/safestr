import {useAppSelector} from '../../Hooks/Selector';

import {UploadBtn} from '../UploadBtn/UploadBtn';

import './VideoRecord.scss';

export const VideoRecord = () => {
  const {videoUri} = useAppSelector(state => state.subtractor);
  return (
    <div className="videoRecord">
      <UploadBtn />
      {!!videoUri && <video src={videoUri} controls loop />}
    </div>
  );
};
