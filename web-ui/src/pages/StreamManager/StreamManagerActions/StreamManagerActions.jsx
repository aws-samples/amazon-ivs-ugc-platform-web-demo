import { useRef } from 'react';

import {
  CallToAction,
  Celebration,
  FactCheck,
  ShoppingBag
} from '../../../assets/icons';
import { clsm } from '../../../utils';
import { Notice, Product, Quiz } from './StreamManagerActionForms';
import { STREAM_ACTION_NAME } from '../../../constants';
import { streamManager as $streamManagerContent } from '../../../content';
import { useStreamManagerActions } from '../../../contexts/StreamManagerActions';
import StreamManagerActionButton from './StreamManagerActionButton';

const STREAM_MANAGER_ACTION_ICONS = {
  [STREAM_ACTION_NAME.QUIZ]: ShoppingBag,
  [STREAM_ACTION_NAME.PRODUCT]: FactCheck,
  [STREAM_ACTION_NAME.CELEBRATION]: Celebration,
  [STREAM_ACTION_NAME.NOTICE]: CallToAction
};

const STREAM_MANAGER_ACTION_MODAL_FORMS = {
  [STREAM_ACTION_NAME.QUIZ]: <Quiz />,
  [STREAM_ACTION_NAME.PRODUCT]: <Product />,
  [STREAM_ACTION_NAME.NOTICE]: <Notice />
};

const WIP_STREAM_MANAGER_ACTIONS = [STREAM_ACTION_NAME.NOTICE];

const StreamManagerActions = () => {
  const { openStreamManagerActionModal, sendStreamAction } =
    useStreamManagerActions();
  const streamManagerActionButtonRefsMap = useRef(new Map());
  const lastFocusedStreamManagerActionButtonRef = useRef();

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
        'lg:grid-cols-4',
        'lg:max-w-full',
        'max-w-[351px]',
        'overflow-auto',
        'p-5',
        'rounded-3xl',
        'sm:grid-rows-none',
        'supports-overlay:overflow-overlay',
        'w-full',
        'xs:grid-cols-3'
      ])}
    >
      {Object.values(STREAM_ACTION_NAME).map((actionName) => {
        if (WIP_STREAM_MANAGER_ACTIONS.includes(actionName)) return null;

        const hasModal = actionName in STREAM_MANAGER_ACTION_MODAL_FORMS;
        const $content =
          $streamManagerContent.stream_manager_actions[actionName];
        const ariaLabel = hasModal
          ? `Open the ${actionName} stream action editor`
          : `Trigger a ${actionName} stream action`;
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
                confirmText: $content.confirm_text,
                streamManagerActionContent:
                  STREAM_MANAGER_ACTION_MODAL_FORMS[actionName],
                title: $content.modal_form_title
              },
              lastFocusedElement: lastFocusedStreamManagerActionButtonRef
            });
          } else sendStreamAction(actionName);
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

export default StreamManagerActions;
