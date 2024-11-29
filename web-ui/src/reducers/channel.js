import { createSlice } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  isPlayerMuted: true
};

export const channelSlice = createSlice({
  name: 'channel',
  initialState: INITIAL_STATE,
  reducers: {
    resetChannelStates: () => {
      return INITIAL_STATE;
    },
    updateIsPlayerMuted: (state, action) => {
      state.isPlayerMuted = action.payload;
    }
  }
});

export const { resetChannelStates, updateIsPlayerMuted } = channelSlice.actions;
export default channelSlice.reducer;
