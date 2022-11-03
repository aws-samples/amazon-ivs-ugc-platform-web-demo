import { clsm } from '../../utils';

import LiveStreamsSection from './LiveStreamsSection';
import withVerticalScroller from '../../components/withVerticalScroller';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';

const ChannelDirectory = () => {
  const { isMobileView } = useResponsiveDevice();
  const { isSessionValid } = useUser();

  return (
    <div
      className={clsm(
        'bg-white',
        'dark:bg-black',
        'flex-col',
        'flex',
        'items-center',
        'lg:py-12',
        'overflow-x-hidden',
        'px-8',
        'py-24',
        'sm:px-4',
        'w-full',
        isMobileView && !isSessionValid && 'lg:pb-32',
        isMobileView && 'lg:px-4'
      )}
    >
      <LiveStreamsSection />
    </div>
  );
};

export default withVerticalScroller(ChannelDirectory);
