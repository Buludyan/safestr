import {configureStore} from '@reduxjs/toolkit';
import {subtractorReducer} from '../Slices/SubtractorSlice';

export const store = configureStore({
  reducer: {
    subtractor: subtractorReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
