import {safestrActions} from '../Slices/SafestrSlice';
import {bindActionCreators} from '@reduxjs/toolkit';
import {useDispatch} from 'react-redux';

const actions = {...safestrActions};

export const useActions = () => {
  const dispatch = useDispatch();

  return bindActionCreators(actions, dispatch);
};
