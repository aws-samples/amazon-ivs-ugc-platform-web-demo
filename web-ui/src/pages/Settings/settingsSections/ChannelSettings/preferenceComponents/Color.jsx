import { useCallback, useMemo, useState } from 'react';

import { channelAPI } from '../../../../../api';
import { dashboard as $content } from '../../../../../content';
import { PROFILE_COLORS } from '../../../../../constants';
import { useNotif } from '../../../../../contexts/Notification';
import { useUser } from '../../../../../contexts/User';
import IconSelect from '../../../../../components/IconSelect';
import SettingContainer from '../../SettingContainer';

const Color = () => {
  const { notifySuccess, notifyError } = useNotif();
  const {
    userData: { color },
    fetchUserData
  } = useUser();
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);
  const profileColorItems = useMemo(
    () => PROFILE_COLORS.map((color) => [color, `bg-profile-${color}`]),
    []
  );

  const handleChangeColor = useCallback(
    async (newColor) => {
      if (newColor === color) return;

      setSelectedColor(newColor); // eagerly set the selected color
      setIsColorLoading(true);
      const { result, error } = await channelAPI.changeUserPreferences({
        color: newColor
      });
      setIsColorLoading(false);

      if (result) {
        await fetchUserData();
        setSelectedColor(result.color);
        notifySuccess($content.notification.success.color_saved);
      }

      if (error) {
        setSelectedColor(color);
        notifyError($content.notification.error.color_failed_to_save);
      }
    },
    [color, fetchUserData, notifyError, notifySuccess]
  );

  return (
    <SettingContainer label={$content.settings_page.color}>
      <IconSelect
        isLoading={isColorLoading}
        items={profileColorItems}
        onSelect={handleChangeColor}
        selected={selectedColor}
        type="color"
      />
    </SettingContainer>
  );
};

export default Color;
