import { useRef } from 'react';

import {
  CallToAction,
  Celebration,
  FactCheck,
  ShoppingBag
} from '../../../assets/icons';
import {
  HIDE_WIP_STREAM_ACTIONS,
  STREAM_ACTION_NAME
} from '../../../constants';
import { clsm } from '../../../utils';
import { Quiz, Product, Notice } from './StreamManagerActionForms';
import { streamManager as $streamManagerContent } from '../../../content';
import { useStreamManagerActions } from '../../../contexts/StreamManagerActions';
import StreamManagerActionButton from './StreamManagerActionButton';

const $content = $streamManagerContent.stream_manager_actions;

const StreamManagerActions = () => {
  const { openStreamManagerActionModal, sendStreamAction } =
    useStreamManagerActions();
  const quizStreamManagerActionButtonRef = useRef();
  const productStreamManagerActionButtonRef = useRef();
  const noticeStreamManagerActionButtonRef = useRef();

  const openQuizStreamManagerAction = () =>
    openStreamManagerActionModal(STREAM_ACTION_NAME.QUIZ, {
      content: {
        title: $content.quiz.host_a_quiz,
        confirmText: $content.quiz.start_quiz,
        streamManagerActionContent: <Quiz />
      },
      lastFocusedElement: quizStreamManagerActionButtonRef
    });

  const openProductStreamManagerAction = () =>
    openStreamManagerActionModal(STREAM_ACTION_NAME.PRODUCT, {
      content: {
        title: $content.product.feature_a_product,
        confirmText: $content.product.show_product,
        streamManagerActionContent: <Product />
      },
      lastFocusedElement: productStreamManagerActionButtonRef
    });

  const openNoticeStreamManagerAction = () =>
    openStreamManagerActionModal(STREAM_ACTION_NAME.NOTICE, {
      content: {
        title: $content.notice.show_a_notice,
        confirmText: $content.notice.show_notice,
        streamManagerActionContent: <Notice />
      },
      lastFocusedElement: noticeStreamManagerActionButtonRef
    });

  const triggerCelebrationStreamManagerAction = async () => {
    await sendStreamAction(STREAM_ACTION_NAME.CELEBRATION);
  };

  return (
    <section
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'gap-5',
        'grid-cols-2',
        'grid-rows-[repeat(2,148px)]',
        'grid',
        'lg:grid-cols-4',
        'lg:grid-rows-[repeat(1,148px)]',
        'lg:max-w-full',
        'lg:min-h-[188px]',
        'max-w-[351px]',
        'overflow-auto',
        'p-5',
        'rounded-3xl',
        'sm:grid-rows-1',
        'sm:min-h-0',
        'sm:overflow-hidden',
        'xs:grid-cols-3',
        'supports-overlay:overflow-overlay',
        'w-full',
        !HIDE_WIP_STREAM_ACTIONS && 'xs:grid-rows-2'
      ])}
    >
      <StreamManagerActionButton
        ariaLabel="Open the quiz stream action editor"
        icon={FactCheck}
        label={{
          default: $content.quiz.host_a_quiz,
          active: $content.quiz.hosting_a_quiz
        }}
        name={STREAM_ACTION_NAME.QUIZ}
        onClick={openQuizStreamManagerAction}
        ref={quizStreamManagerActionButtonRef}
      />
      <StreamManagerActionButton
        ariaLabel="Open the product feature stream action editor"
        icon={ShoppingBag}
        label={{
          default: $content.product.feature_a_product,
          active: $content.product.featuring_a_product
        }}
        name={STREAM_ACTION_NAME.PRODUCT}
        onClick={openProductStreamManagerAction}
        ref={productStreamManagerActionButtonRef}
      />
      {!HIDE_WIP_STREAM_ACTIONS && (
        <>
          <StreamManagerActionButton
            ariaLabel="Open the notice stream action editor"
            icon={CallToAction}
            label={{
              default: $content.notice.show_a_notice,
              active: $content.notice.showing_a_notice
            }}
            name={STREAM_ACTION_NAME.NOTICE}
            onClick={openNoticeStreamManagerAction}
            ref={noticeStreamManagerActionButtonRef}
          />
          <StreamManagerActionButton
            ariaLabel="Open the celebration stream action editor"
            icon={Celebration}
            label={{
              default: $content.celebration.trigger_a_celebration,
              active: $content.celebration.triggering_a_celebration
            }}
            name={STREAM_ACTION_NAME.CELEBRATION}
            onClick={triggerCelebrationStreamManagerAction}
          />
        </>
      )}
    </section>
  );
};

export default StreamManagerActions;
