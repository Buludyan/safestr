import {configureStore} from '@reduxjs/toolkit';
import {safestrReducer} from '../Slices/SafestrSlice';

export const store = configureStore({
  reducer: {
    safestr: safestrReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
