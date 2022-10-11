import {RootState} from './../Store/Store';
import {TypedUseSelectorHook, useSelector} from 'react-redux';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
