import { AnimatePresence, m } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import {
  defaultViewerStreamActionAnimationProps,
  defaultViewerStreamActionVariants
} from '../../pages/Channel/ViewerStreamActions/viewerStreamActionsTheme';
import { STREAM_ACTION_NAME } from '../../constants';
import { useViewerStreamActions } from '../../contexts/ViewerStreamActions';
import ProductViewerStreamAction from '../../pages/Channel/ViewerStreamActions/Product';
import QuizCard from '../../pages/Channel/ViewerStreamActions/QuizCard';

const PlayerViewerStreamActions = ({ isControlsOpen, shouldShowStream }) => {
  const {
    currentViewerStreamActionData,
    currentViewerStreamActionName,
    setCurrentViewerAction,
    shouldRenderActionInTab
  } = useViewerStreamActions();

  return (
    <AnimatePresence>
      {currentViewerStreamActionName === STREAM_ACTION_NAME.QUIZ &&
        !shouldRenderActionInTab && (
          <QuizCard
            {...currentViewerStreamActionData}
            isControlsOpen={isControlsOpen && shouldShowStream}
            setCurrentViewerAction={setCurrentViewerAction}
            shouldRenderActionInTab={shouldRenderActionInTab}
          />
        )}
      {currentViewerStreamActionName === STREAM_ACTION_NAME.PRODUCT &&
        !shouldRenderActionInTab && (
          <m.div
            {...defaultViewerStreamActionAnimationProps}
            variants={defaultViewerStreamActionVariants}
            className={clsm([
              'absolute',
              'bg-white',
              'bottom-4',
              'dark:bg-[#161616F2]',
              'max-w-[256px]',
              'right-4',
              'rounded-3xl',
              'transition-[margin]',
              'w-full',
              'mb-4',
              isControlsOpen && shouldShowStream && 'mb-20'
            ])}
          >
            <ProductViewerStreamAction {...currentViewerStreamActionData} />
          </m.div>
        )}
    </AnimatePresence>
  );
};

PlayerViewerStreamActions.propTypes = {
  isControlsOpen: PropTypes.bool.isRequired,
  shouldShowStream: PropTypes.bool
};

PlayerViewerStreamActions.defaultProps = { shouldShowStream: false };

export default PlayerViewerStreamActions;
