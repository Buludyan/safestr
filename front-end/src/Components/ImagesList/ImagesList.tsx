import {useAppSelector} from '../../Hooks/Selector';
import './ImagesList.scss';
import MasksIcon from '@mui/icons-material/Masks';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SportsMmaIcon from '@mui/icons-material/SportsMma';

export const ImagesList = () => {
  const {imagesDataList} = useAppSelector(state => state.safestr);
  console.log(imagesDataList);
  return (
    <div className="imagesList">
      <div className="imagesList__inner">
        {imagesDataList.length
          ? imagesDataList.map((imageData, idx) => {
              return (
                <div key={idx} className="imagesList__result">
                  <img
                    src={imageData.imageSrc}
                    alt="pic"
                    className="imagesList__image"
                  />
                  <div className="imagesList__icons">
                    <MasksIcon
                      sx={{
                        fontSize: '80px',
                        backgroundColor: imageData.protectiveEquipmentResult
                          .faceCovered
                          ? 'green'
                          : 'red',
                      }}
                    />
                    <EngineeringIcon
                      sx={{
                        fontSize: '80px',
                        backgroundColor: imageData.protectiveEquipmentResult
                          .headCovered
                          ? 'green'
                          : 'red',
                      }}
                    />
                    <SportsMmaIcon
                      sx={{
                        fontSize: '80px',
                        backgroundColor: imageData.protectiveEquipmentResult
                          .leftHandCovered
                          ? 'green'
                          : 'red',
                      }}
                    />
                    <SportsMmaIcon
                      sx={{
                        fontSize: '80px',
                        transform: 'scale(-1, 1)',
                        backgroundColor: imageData.protectiveEquipmentResult
                          .rightHandCovered
                          ? 'green'
                          : 'red',
                      }}
                    />
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
};
