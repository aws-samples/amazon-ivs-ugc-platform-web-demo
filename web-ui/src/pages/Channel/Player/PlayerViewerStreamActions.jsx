import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  defaultSlideUpVariant,
  defaultViewerStreamActionTransition
} from '../ViewerStreamActions/viewerStreamActionsTheme';
import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { STREAM_ACTION_NAME } from '../../../constants';
import { usePlayerContext } from '../contexts/Player';
import { useViewerStreamActions } from '../../../contexts/ViewerStreamActions';
import NoticeViewerStreamAction from '../ViewerStreamActions/Notice';
import ProductViewerStreamAction from '../ViewerStreamActions/Product';
import QuizViewerStreamAction from '../ViewerStreamActions/QuizCard';

const PlayerViewerStreamActions = ({
  onClickPlayerHandler,
  shouldShowStream
}) => {
  const {
    currentViewerStreamActionData,
    currentViewerStreamActionName,
    setCurrentViewerAction,
    shouldRenderActionInTab
  } = useViewerStreamActions();
  const { isOverlayVisible } = usePlayerContext();

  return (
    <AnimatePresence>
      {currentViewerStreamActionName === STREAM_ACTION_NAME.QUIZ &&
        !shouldRenderActionInTab && (
          <QuizViewerStreamAction
            {...currentViewerStreamActionData}
            shouldShowStream={shouldShowStream}
            setCurrentViewerAction={setCurrentViewerAction}
            shouldRenderActionInTab={shouldRenderActionInTab}
          />
        )}
      {currentViewerStreamActionName === STREAM_ACTION_NAME.PRODUCT &&
        !shouldRenderActionInTab && (
          <motion.div
            {...createAnimationProps({
              animations: ['fadeIn-full'],
              customVariants: defaultSlideUpVariant,
              transition: defaultViewerStreamActionTransition
            })}
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
              isOverlayVisible && shouldShowStream && 'mb-20'
            ])}
          >
            <ProductViewerStreamAction {...currentViewerStreamActionData} />
          </motion.div>
        )}
      {currentViewerStreamActionName === STREAM_ACTION_NAME.NOTICE && (
        <NoticeViewerStreamAction
          {...currentViewerStreamActionData}
          onClickPlayerHandler={onClickPlayerHandler}
          shouldShowStream={shouldShowStream}
        />
      )}
    </AnimatePresence>
  );
};

PlayerViewerStreamActions.propTypes = {
  onClickPlayerHandler: PropTypes.func.isRequired,
  shouldShowStream: PropTypes.bool
};

PlayerViewerStreamActions.defaultProps = { shouldShowStream: false };

export default PlayerViewerStreamActions;
