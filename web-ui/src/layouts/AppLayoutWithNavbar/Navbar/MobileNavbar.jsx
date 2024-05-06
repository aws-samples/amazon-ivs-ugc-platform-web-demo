import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { app as $appContent } from '../../../content';
import { clsm } from '../../../utils';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';

const $content = $appContent.navbar;

const MobileNavbar = ({ className = '', motionProps = {} }) => {
  const { isMobileView } = useResponsiveDevice();
  const { isSessionValid } = useUser();

  return (
    !isSessionValid &&
    isMobileView && (
      <motion.nav
        {...motionProps}
        className={clsm([
          'fixed',
          'bottom-5',
          'left-1/2',
          '-translate-x-1/2',
          'rounded-[40px]',
          'w-[calc(100vw_-_32px)]',
          'max-w-[calc(440px_+_32px)]',
          'min-w-[calc(212px_+_32px)]',
          'dark:bg-darkMode-gray-medium',
          'bg-lightMode-gray-extraLight',
          className
        ])}
      >
        <div
          className={clsm([
            'flex',
            'px-4',
            'py-3.5',
            'items-center',
            'justify-between',
            'space-x-4',
            '[&>a]:w-full'
          ])}
        >
          <Button
            type="nav"
            variant="secondary"
            to="/login"
            saveLocationFromState
          >
            {$content.log_in}
          </Button>
          <Button
            type="nav"
            variant="primary"
            to="/register"
            saveLocationFromState
          >
            {$content.sign_up}
          </Button>
        </div>
      </motion.nav>
    )
  );
};

MobileNavbar.propTypes = {
  className: PropTypes.string,
  motionProps: PropTypes.object
};

export default MobileNavbar;
