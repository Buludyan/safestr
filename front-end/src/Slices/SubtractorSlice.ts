import {InterfacesProjectSpecificConstants} from 'interfaces';

import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {InitialState} from '../Interfaces/Interfaces';

const initialState: InitialState = {
  isRecording: false,
  isRecordExist: false,
  isWebcamOn: false,
  videoBlob: null,
  videoFile: null,
  videoName: InterfacesProjectSpecificConstants.webcamVideoName,
  videoUri: null,
  isUploading: false,
  isInProcess: false,
  isDone: false,
  isFailed: false,
};

export const subtractorSlice = createSlice({
  name: 'subtractor',
  initialState,
  reducers: {
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    setRecordExist: (state, action: PayloadAction<boolean>) => {
      state.isRecordExist = action.payload;
    },
    setWebcamOn: (state, action: PayloadAction<boolean>) => {
      state.isWebcamOn = action.payload;
    },
    setVideoUrlBlob: (state, action: PayloadAction<Blob | null>) => {
      state.videoBlob = action.payload;
    },
    setVideoFile: (state, action: PayloadAction<File>) => {
      state.videoFile = action.payload;
      state.videoName = action.payload.name;
    },
    setVideoUri: (state, action: PayloadAction<string | null>) => {
      state.videoUri = action.payload;
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
    },
    setProcess: (state, action: PayloadAction<boolean>) => {
      state.isInProcess = action.payload;
    },
    setDone: (state, action: PayloadAction<boolean>) => {
      state.isDone = action.payload;
    },
    setFailed: (state, action: PayloadAction<boolean>) => {
      state.isFailed = action.payload;
    },
  },
});

export const subtractorActions = subtractorSlice.actions;
export const subtractorReducer = subtractorSlice.reducer;
