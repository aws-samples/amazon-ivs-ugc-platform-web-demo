import { useState } from 'react';

import './Settings.css';
import { channelAPI } from '../../api';
import { clsm } from '../../utils';
import { dashboard as $content } from '../../content';
import { uploadFileToS3 } from '../../api/channel';
import { USE_SETTINGS_IMAGE_UPLOAD_TEST } from '../../constants';
import { useUser } from '../../contexts/User';
import AccountSettings from './AccountSettings';
import Button from '../../components/Button';
import StreamSettings from './StreamSettings';
import withVerticalScroller from '../../components/withVerticalScroller';

const Settings = () => {
  const { userData } = useUser();
  const [imageUrl, setImageUrl] = useState('');

  // TEMPORARY
  const handleUpload = async (assetType, event) => {
    const file = event.target.files[0];

    const { result } = await uploadFileToS3({
      assetType,
      contentType: file.type,
      fileContents: file
    });

    if (result) setImageUrl(result);
  };
  const handleDeleteChannelAsset = async (assetType) => {
    await channelAPI.deleteChannelAsset(assetType);
  };

  return (
    userData && (
      <article className="settings-container">
        <h1>{$content.settings_page.title}</h1>

        {/* TEMPORARY */}
        {USE_SETTINGS_IMAGE_UPLOAD_TEST && (
          <>
            <div className={clsm(['flex', 'flex-col'])}>
              <label htmlFor="avatar-upload">Upload Avatar</label>
              <input
                id="avatar-upload"
                type="file"
                onChange={(e) => handleUpload('avatar', e)}
              />
            </div>
            <div className={clsm(['flex', 'flex-col'])}>
              <label htmlFor="banner-upload">Upload Banner</label>
              <input
                id="banner-upload"
                type="file"
                onChange={(e) => handleUpload('banner', e)}
              />
            </div>
            {imageUrl && <img alt="upload" className="w-60" src={imageUrl} />}
            <div className={clsm(['flex', 'gap-x-4'])}>
              <Button onClick={() => handleDeleteChannelAsset('avatar')}>
                Delete Avatar
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDeleteChannelAsset('banner')}
              >
                Delete Banner
              </Button>
            </div>
          </>
        )}

        <StreamSettings />
        <AccountSettings />
      </article>
    )
  );
};

export default withVerticalScroller(Settings);
