export interface InitialState {
  isRecording: boolean;
  isRecordExist: boolean;
  isWebcamOn: boolean;
  videoBlob: Blob | null;
  videoFile: File | null;
  videoName: string;
  videoUri: string | null;
  isUploading: boolean;
  isInProcess: boolean;
  isDone: boolean;
  isFailed: boolean;
}
