import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  defaultSlideUpVariant,
  defaultViewerStreamActionTransition
} from '../ViewerStreamActions/viewerStreamActionsTheme';
import { commonProductContainerClasses } from '../ViewerStreamActions/Product/ProductTheme';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { sanitizeAmazonProductData } from '../../../helpers/streamActionHelpers';
import { STREAM_ACTION_NAME } from '../../../constants';
import { usePlayerContext } from '../contexts/Player';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useViewerStreamActions } from '../../../contexts/ViewerStreamActions';
import NoticeViewerStreamAction from '../ViewerStreamActions/Notice';
import ProductViewerStreamAction from '../ViewerStreamActions/Product/components/Product';
import QuizViewerStreamAction from '../ViewerStreamActions/QuizCard';

const PlayerViewerStreamActions = ({
  isPollActive,
  isPopupOpen,
  onClickPlayerHandler,
  shouldShowStream
}) => {
  const {
    currentViewerStreamActionData,
    currentViewerStreamActionName,
    setCurrentViewerAction,
    shouldRenderActionInTab
  } = useViewerStreamActions();
  const { chatAnimationControls, getProfileViewAnimationProps } =
    useProfileViewAnimation();
  const { isOverlayVisible } = usePlayerContext();

  return (
    <motion.div
      {...getProfileViewAnimationProps(chatAnimationControls, {
        expanded: { opacity: 0 },
        collapsed: { opacity: 1 }
      })}
      className={isPopupOpen ? '-z-10' : ''}
    >
      <AnimatePresence>
        {!isPollActive && currentViewerStreamActionName === STREAM_ACTION_NAME.QUIZ &&
          !shouldRenderActionInTab && (
            <QuizViewerStreamAction
              {...currentViewerStreamActionData}
              shouldShowStream={shouldShowStream}
              setCurrentViewerAction={setCurrentViewerAction}
              shouldRenderActionInTab={shouldRenderActionInTab}
            />
          )}
        {!isPollActive && [
          STREAM_ACTION_NAME.PRODUCT,
          STREAM_ACTION_NAME.AMAZON_PRODUCT
        ].includes(currentViewerStreamActionName) &&
          !shouldRenderActionInTab && (
            <motion.div
              {...createAnimationProps({
                animations: ['fadeIn-full'],
                customVariants: defaultSlideUpVariant,
                transition: defaultViewerStreamActionTransition
              })}
              className={commonProductContainerClasses(
                isOverlayVisible,
                shouldShowStream
              )}
            >
              <ProductViewerStreamAction
                {...(currentViewerStreamActionName ===
                STREAM_ACTION_NAME.AMAZON_PRODUCT
                  ? sanitizeAmazonProductData(currentViewerStreamActionData)
                  : currentViewerStreamActionData)}
              />
            </motion.div>
          )}
        {!isPollActive && currentViewerStreamActionName === STREAM_ACTION_NAME.NOTICE && (
          <NoticeViewerStreamAction
            {...currentViewerStreamActionData}
            onClickPlayerHandler={onClickPlayerHandler}
            shouldShowStream={shouldShowStream}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

PlayerViewerStreamActions.propTypes = {
  isPollActive: PropTypes.bool,
  isPopupOpen: PropTypes.bool.isRequired,
  onClickPlayerHandler: PropTypes.func.isRequired,
  shouldShowStream: PropTypes.bool,
};

PlayerViewerStreamActions.defaultProps = { 
  isPollActive: false,
  shouldShowStream: false
 };

export default PlayerViewerStreamActions;
