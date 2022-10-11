import {subtractorActions} from './../Slices/SubtractorSlice';
import {bindActionCreators} from '@reduxjs/toolkit';
import {useDispatch} from 'react-redux';

const actions = {...subtractorActions};

export const useActions = () => {
  const dispatch = useDispatch();

  return bindActionCreators(actions, dispatch);
};
