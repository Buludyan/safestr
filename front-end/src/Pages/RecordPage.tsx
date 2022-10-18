import {ImagesList} from '../Components/ImagesList/ImagesList';
import {VideoRecord} from '../Components/VideoRecord/VideoRecord';
import './RecordPage.scss';

export const RecordPage = () => {
  return (
    <div>
      <VideoRecord />
      <ImagesList />
    </div>
  );
};
