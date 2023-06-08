export const shortEventMessages = {
  stream_failure:
    'The stream is not being processed and is not available because processing capacity was exceeded.',
  starvation_start:
    'Your stream is experiencing performance or network issues. Please check your configuration settings and network connection.',
  ingest_bitrate:
    'Your stream session ended because the bitrate setting is too high. Reduce the bitrate in your encoder settings.',
  ingest_resolution:
    'Your stream session ended because the resolution setting is too high. Change your encoder settings to avoid the stream automatically ending.',
  concurrent_broadcasts:
    'A system error has occurred. Please contact your administrator.',
  concurrent_viewers:
    'A system error has occurred. Please contact your administrator.',
  recording_start_failure:
    'Recording failed to start due to errors. This live stream was not recorded.',
  recording_end_failure:
    'Due to errors encountered during the stream, the recording was not completed successfully. Some objects may have been written to the configured storage location.'
};

export const longEventMessages = {
  stream_failure: ``, // No long message
  starvation_start: `
  Your stream is experiencing issues caused by stream instability, which may cause your viewers to experience choppy playback or buffering.  

  #### Common causes of instability:
  - Low internet bandwidth
  - Bitrate that is too high for your internet connection
  - Network or computer hardware problems

  #### Troubleshooting recommendations:
  - Lower your stream bitrate. Your stream bitrate should not exceed 80% of your internet upload speed.
  - If you are streaming from wifi, connect using a hardwired ethernet connection. If you must stream using wifi, ensure that you are using a router that supports 5GHz wifi.
  - Check if other devices are streaming video or downloading content. Note that devices that appear to be powered off may be downloading updates.
  - Verify that the video encoder is not overloading your CPU. If your CPU usage is consistently high, switch to a faster encoding preset.
  `,
  ingest_bitrate: `Your stream session ended because the bitrate setting is too high:  
  <br>  
  {bitrate} Mbps  
  <br>  
  There is a bitrate limit of {BITRATE_LIMIT} Mbps. Change your encoder settings to avoid the stream automatically ending.`,
  // FINAL
  ingest_resolution: `Your stream session ended because the resolution setting is too high.  
  <br>  
  There is a resolution limit of {RESOLUTION_LIMIT}. Change your encoder settings to avoid the stream automatically ending.`,
  concurrent_broadcasts: ``, // No long message
  concurrent_viewers: ``, // No long message
  recording_start_failure: ``, // No long message
  recording_end_failure: `` // No long message
};
