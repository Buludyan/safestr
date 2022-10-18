export interface InitialState {
  imagesDataList: IImageData[];
}

export interface IImageData {
  imageSrc: string;
  protectiveEquipmentResult: IProtectiveEquipmentResult;
}

export interface IProtectiveEquipmentResult {
  faceCovered: boolean;
  headCovered: boolean;
  leftHandCovered: boolean;
  personDetected: boolean;
  rightHandCovered: boolean;
}
