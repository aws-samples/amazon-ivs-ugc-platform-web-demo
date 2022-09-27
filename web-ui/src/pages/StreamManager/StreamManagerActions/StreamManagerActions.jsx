import { useCallback, useRef } from 'react';

import { clsm } from '../../../utils';
import { streamManager as $streamManagerContent } from '../../../content';

import { Quiz, Product, Notice } from './StreamManagerActionForms';
import { STREAM_ACTION_NAME } from '../../../constants';
import { useStreamManagerActions } from '../../../contexts/StreamManagerActions';
import StreamManagerActionButton from './StreamManagerActionButton';

const $content = $streamManagerContent.stream_manager_actions_modal;

const StreamManagerActions = () => {
  const { openStreamManagerActionModal } = useStreamManagerActions();
  const quizStreamManagerActionButtonRef = useRef();
  const productStreamManagerActionButtonRef = useRef();
  const noticeStreamManagerActionButtonRef = useRef();

  const openQuizStreamManagerAction = useCallback(() => {
    openStreamManagerActionModal(STREAM_ACTION_NAME.QUIZ, {
      content: {
        title: $content.quiz.host_a_quiz,
        confirmText: $content.quiz.start_quiz,
        streamManagerActionContent: <Quiz />
      },
      lastFocusedElement: quizStreamManagerActionButtonRef
    });
  }, [openStreamManagerActionModal]);

  const openProductStreamManagerAction = useCallback(() => {
    openStreamManagerActionModal(STREAM_ACTION_NAME.PRODUCT, {
      content: {
        title: $content.product.feature_a_product,
        confirmText: $content.product.show_product,
        streamManagerActionContent: <Product />
      },
      lastFocusedElement: productStreamManagerActionButtonRef
    });
  }, [openStreamManagerActionModal]);

  const openNoticeStreamManagerAction = useCallback(() => {
    openStreamManagerActionModal(STREAM_ACTION_NAME.NOTICE, {
      content: {
        title: $content.notice.show_a_notice,
        confirmText: $content.notice.show_notice,
        streamManagerActionContent: <Notice />
      },
      lastFocusedElement: noticeStreamManagerActionButtonRef
    });
  }, [openStreamManagerActionModal]);

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
        'sm:min-h-[105px]',
        'sm:overflow-hidden',
        'supports-overlay:overflow-overlay',
        'w-full'
      ])}
    >
      <StreamManagerActionButton
        name={$content.quiz.host_a_quiz}
        onClick={openQuizStreamManagerAction}
        ref={quizStreamManagerActionButtonRef}
      />
      <StreamManagerActionButton
        name={$content.product.feature_a_product}
        onClick={openProductStreamManagerAction}
        ref={productStreamManagerActionButtonRef}
      />
      <StreamManagerActionButton
        name={$content.notice.show_a_notice}
        onClick={openNoticeStreamManagerAction}
        ref={noticeStreamManagerActionButtonRef}
      />
      <StreamManagerActionButton
        name={$content.celebration.trigger_a_celebration}
        onClick={() => console.info('🎵 Ce-le-brate good times, come on! 🎵')}
      />
    </section>
  );
};

export default StreamManagerActions;
