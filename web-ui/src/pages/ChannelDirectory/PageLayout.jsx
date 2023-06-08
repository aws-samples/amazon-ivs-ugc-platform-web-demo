import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';

const PageLayout = ({ children }) => {
  const { isMobileView } = useResponsiveDevice();
  const { isSessionValid } = useUser();

  return (
    <div
      className={clsm([
        'bg-white',
        'dark:bg-black',
        'flex-col',
        'flex',
        'h-full',
        'items-center',
        'lg:py-12',
        'overflow-x-hidden',
        'pt-24',
        'px-8',
        'sm:px-4',
        'w-full',
        isMobileView && !isSessionValid && 'lg:pb-32',
        isMobileView && 'lg:px-4'
      ])}
    >
      {children}
    </div>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default PageLayout;
