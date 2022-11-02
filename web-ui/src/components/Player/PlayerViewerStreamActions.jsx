import { AnimatePresence, m } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  defaultViewerStreamActionAnimationProps,
  defaultViewerStreamActionVariants
} from '../../pages/Channel/ViewerStreamActions/viewerStreamActionsTheme';
import { clsm } from '../../utils';
import { STREAM_ACTION_NAME } from '../../constants';
import { useViewerStreamActions } from '../../contexts/ViewerStreamActions';
import NoticeViewerStreamAction from '../../pages/Channel/ViewerStreamActions/Notice';
import ProductViewerStreamAction from '../../pages/Channel/ViewerStreamActions/Product';
import QuizViewerStreamAction from '../../pages/Channel/ViewerStreamActions/QuizCard';

const PlayerViewerStreamActions = ({
  isControlsOpen,
  onClickPlayerHandler,
  shouldShowStream
}) => {
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
          <QuizViewerStreamAction
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
      {currentViewerStreamActionName === STREAM_ACTION_NAME.NOTICE && (
        <NoticeViewerStreamAction
          {...currentViewerStreamActionData}
          isControlsOpen={isControlsOpen && shouldShowStream}
          onClickPlayerHandler={onClickPlayerHandler}
        />
      )}
    </AnimatePresence>
  );
};

PlayerViewerStreamActions.propTypes = {
  isControlsOpen: PropTypes.bool.isRequired,
  onClickPlayerHandler: PropTypes.func.isRequired,
  shouldShowStream: PropTypes.bool
};

PlayerViewerStreamActions.defaultProps = { shouldShowStream: false };

export default PlayerViewerStreamActions;
