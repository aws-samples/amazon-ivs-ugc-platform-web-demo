import { useState } from 'react';

import './Settings.css';
import { dashboard as $content } from '../../content';
import { uploadFileToS3 } from '../../api/channel';
import { USE_SETTINGS_IMAGE_UPLOAD_TEST } from '../../constants';
import { useUser } from '../../contexts/User';
import AccountSettings from './AccountSettings';
import StreamSettings from './StreamSettings';
import withVerticalScroller from '../../components/withVerticalScroller';

const Settings = () => {
  const { userData } = useUser();
  const [imageUrl, setImageUrl] = useState('');

  // TEMPORARY
  const handleUpload = async (event) => {
    const file = event.target.files[0];

    const { result } = await uploadFileToS3({
      assetType: 'avatar',
      contentType: file.type,
      fileContents: file
    });

    if (result) setImageUrl(result);
  };

  return (
    userData && (
      <article className="settings-container">
        <h1>{$content.settings_page.title}</h1>

        {/* TEMPORARY */}
        {USE_SETTINGS_IMAGE_UPLOAD_TEST && (
          <>
            <input type="file" onChange={handleUpload} />
            {imageUrl && <img alt="upload" className="w-60" src={imageUrl} />}
          </>
        )}

        <StreamSettings />
        <AccountSettings />
      </article>
    )
  );
};

export default withVerticalScroller(Settings);
