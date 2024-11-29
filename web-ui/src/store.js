import { configureStore } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import sessionStorage from 'redux-persist/lib/storage/session';

import {
  streamManagerReducer,
  sharedReducer,
  channelReducer
} from './reducers';
import persistStore from 'redux-persist/es/persistStore';

const persistConfig = {
  key: 'shared',
  storage: sessionStorage
};

const persistedSharedReducer = persistReducer(persistConfig, sharedReducer);

const store = configureStore({
  reducer: {
    shared: persistedSharedReducer,
    streamManager: streamManagerReducer,
    channel: channelReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER'
        ]
      }
    })
});

export const persistor = persistStore(store);
export default store;
