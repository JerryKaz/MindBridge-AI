import { useSyncExternalStore } from 'react';
import { getUser, onUserChange } from './api';

export const useAdminUser = () => useSyncExternalStore(onUserChange, getUser);
