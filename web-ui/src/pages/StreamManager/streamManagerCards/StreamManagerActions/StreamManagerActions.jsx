import { useRef } from 'react';
import PropTypes from 'prop-types';

import {
  AmazonA,
  CallToAction,
  Celebration,
  FactCheck,
  Poll,
  ShoppingBag
} from '../../../../assets/icons';
import {
  AmazonProduct,
  Product,
  Notice,
  QuizOrPollQuestionsComponent
} from './StreamManagerActionForms';
import { clsm } from '../../../../utils';
import { STREAM_ACTION_NAME } from '../../../../constants';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import StreamManagerActionButton from './StreamManagerActionButton';

const STREAM_MANAGER_ACTION_ICONS = {
  [STREAM_ACTION_NAME.AMAZON_PRODUCT]: AmazonA,
  [STREAM_ACTION_NAME.CELEBRATION]: Celebration,
  [STREAM_ACTION_NAME.NOTICE]: CallToAction,
  [STREAM_ACTION_NAME.PRODUCT]: ShoppingBag,
  [STREAM_ACTION_NAME.QUIZ]: FactCheck,
  [STREAM_ACTION_NAME.POLL]: Poll
};

export const STREAM_MANAGER_ACTION_MODAL_FORMS = {
  [STREAM_ACTION_NAME.AMAZON_PRODUCT]: <AmazonProduct />,
  [STREAM_ACTION_NAME.QUIZ]: (
    <QuizOrPollQuestionsComponent formType={STREAM_ACTION_NAME.QUIZ} />
  ),
  [STREAM_ACTION_NAME.PRODUCT]: <Product />,
  [STREAM_ACTION_NAME.NOTICE]: <Notice />,
  [STREAM_ACTION_NAME.POLL]: (
    <QuizOrPollQuestionsComponent formType={STREAM_ACTION_NAME.POLL} />
  )
};

const StreamManagerActions = ({ className }) => {
  const { openStreamManagerActionModal, sendStreamAction } =
    useStreamManagerActions();
  const streamManagerActionButtonRefsMap = useRef(new Map());
  const lastFocusedStreamManagerActionButtonRef = useRef();

  const getAvailableStreamActions = (streamActionNames) => {
    const enableAmazonProductStreamAction =
      process.env.REACT_APP_ENABLE_AMAZON_PRODUCT_STREAM_ACTION === 'true';

    return Object.values(streamActionNames).reduce((acc, streamActionName) => {
      if (streamActionName === STREAM_ACTION_NAME.AMAZON_PRODUCT) {
        if (enableAmazonProductStreamAction) acc.push(streamActionName);
      } else {
        acc.push(streamActionName);
      }

      return acc;
    }, []);
  };

  const streamActions = getAvailableStreamActions(STREAM_ACTION_NAME);

  return (
    <section
      className={clsm([
        'auto-grid-row',
        'auto-rows-max',
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'gap-5',
        'grid-cols-2',
        'grid',
        'h-full',
        'lg:grid-cols-4',
        'lg:max-w-full',
        'max-w-[351px]',
        'overflow-auto',
        'p-5',
        'rounded-3xl',
        'scrollbar-mb-4',
        'scrollbar-mt-4',
        'sm:grid-rows-none',
        'supports-overlay:overflow-overlay',
        'w-full',
        'xs:grid-cols-3',
        className
      ])}
    >
      {streamActions.map((actionName) => {
        const hasModal = actionName in STREAM_MANAGER_ACTION_MODAL_FORMS;
        const $content =
          $streamManagerContent.stream_manager_actions[actionName];
        const defaultLabel = actionName.replace(/_/g, ' ');
        const ariaLabel = hasModal
          ? `Open the ${defaultLabel} stream action editor`
          : `Trigger a ${defaultLabel} stream action`;
        const label = {
          default: $content.default_label,
          active: $content.active_label
        };

        const onClick = () => {
          if (hasModal) {
            lastFocusedStreamManagerActionButtonRef.current =
              streamManagerActionButtonRefsMap.current.get(actionName);

            openStreamManagerActionModal(actionName, {
              content: {
                actionName,
                confirmText: $content.confirm_text,
                streamManagerActionContent:
                  STREAM_MANAGER_ACTION_MODAL_FORMS[actionName],
                title: $content.modal_form_title
              },
              lastFocusedElement: lastFocusedStreamManagerActionButtonRef
            });
          } else sendStreamAction(actionName, undefined, false);
        };

        return (
          <StreamManagerActionButton
            ariaLabel={ariaLabel}
            icon={STREAM_MANAGER_ACTION_ICONS[actionName]}
            key={actionName}
            label={label}
            name={actionName}
            onClick={onClick}
            ref={(el) =>
              streamManagerActionButtonRefsMap.current.set(actionName, el)
            }
          />
        );
      })}
    </section>
  );
};

StreamManagerActions.defaultProps = {
  className: ''
};

StreamManagerActions.propTypes = {
  className: PropTypes.string
};

export default StreamManagerActions;
