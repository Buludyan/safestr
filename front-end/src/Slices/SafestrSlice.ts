import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {IImageData, InitialState} from '../Interfaces/Interfaces';

const initialState: InitialState = {
  imagesDataList: [],
};

export const safestrSlice = createSlice({
  name: 'safestr',
  initialState,
  reducers: {
    setImageData: (state, action: PayloadAction<IImageData>) => {
      state.imagesDataList.unshift(action.payload);
    },
  },
});

export const safestrActions = safestrSlice.actions;
export const safestrReducer = safestrSlice.reducer;
