import { useDispatch } from 'react-redux';

import { channel as $channelContent } from '../../../content';
import { clsm } from '../../../utils';
import { CONTROLLER_BUTTON_THEME } from '../../StreamManager/streamManagerCards/StreamManagerWebBroadcast/BroadcastControl/BroadcastControllerTheme';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { VolumeOff } from '../../../assets/icons';
import Button from '../../../components/Button';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { updateIsPlayerMuted } from '../../../reducers/channel';

const UnmuteButtonOverLay = () => {
  const dispatch = useDispatch();
  const { isTouchscreenDevice } = useResponsiveDevice();
  const { isProfileViewAnimationRunning, isProfileViewExpanded } =
    useProfileViewAnimation();

  const handleOnClick = () => {
    dispatch(updateIsPlayerMuted(false));
  };

  return (
    <div
      className={clsm([
        'absolute',
        isProfileViewExpanded && ['z-10'],
        'h-full',
        'w-full',
        'flex',
        'justify-center',
        'items-center',
        'bg-black-unmuteButtonOverlay',
        'rounded-xl'
      ])}
    >
      <Button
        variant="secondary"
        className={clsm([
          CONTROLLER_BUTTON_THEME,
          'space-x-2',
          'py-[10px]',
          'pl-4',
          'pr-6',
          'dark:[&>svg]:fill-white',
          '[&>svg]:fill-black',
          !isTouchscreenDevice && [
            'hover:bg-lightMode-gray-hover',
            'dark:hover:bg-darkMode-gray-hover'
          ],
          'duration-75',
          'transition-opacity',
          isProfileViewAnimationRunning ? 'opacity-0' : 'opacity-100'
        ])}
        onClick={handleOnClick}
      >
        <VolumeOff className={clsm(['w-6', 'h-6'])} />
        <p>{$channelContent.stage.click_to_unmute}</p>
      </Button>
    </div>
  );
};

export default UnmuteButtonOverLay;
