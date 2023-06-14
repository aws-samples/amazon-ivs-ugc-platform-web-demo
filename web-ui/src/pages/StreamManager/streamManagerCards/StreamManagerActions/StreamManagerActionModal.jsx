import { forwardRef, useRef, useState } from 'react';

import {
  getFormHeaderClasses,
  getModalContainerClasses,
  getModalFormClasses,
  MODAL_CLOSE_BUTTON_CLASSES,
  MODAL_OVERFLOW_DIVIDER_CLASSES
} from '../StreamManagerModalTheme';
import { BREAKPOINTS, STREAM_ACTION_NAME } from '../../../../constants';
import { Close } from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import Button from '../../../../components/Button';
import Modal from '../../../../components/Modal';
import ResponsivePanel from '../../../../components/ResponsivePanel';
import Spinner from '../../../../components/Spinner';
import useMediaQuery from '../../../../hooks/useMediaQuery';
import useResizeObserver from '../../../../hooks/useResizeObserver';
import useScrollListener from '../../../../../src/pages/StreamManager/streamManagerCards/StreamManagerActions/StreamManagerActionForms/AmazonProduct/useScrollListener';

const $content = $streamManagerContent;
const StreamManagerActionModal = forwardRef((_, ref) => {
  const { closeModal, content, handleConfirm, handleSave, isModalOpen, type } =
    useModal();
  const { actionName, title, confirmText, streamManagerActionContent } =
    content || {};
  const {
    getStreamManagerActionData,
    isSendingStreamAction,
    handleResetAmazonProductData
  } = useStreamManagerActions();
  const { isMobileView, isLandscape } = useResponsiveDevice();
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const streamManagerActionData = getStreamManagerActionData();
  const mainContentRef = useRef();

  const prefersDarkColorScheme = useMediaQuery('(prefers-color-scheme: dark)');
  const buttonClasses = clsm(['relative', 'w-auto', 'md:w-full']);
  const isAmazonProductStreamAction =
    actionName === STREAM_ACTION_NAME.AMAZON_PRODUCT;

  // list of stream actions that should only submit when submit button is clicked
  const shouldSubmitOnButtonClick = [
    STREAM_ACTION_NAME.AMAZON_PRODUCT
  ].includes(actionName);

  useScrollListener(actionName, mainContentRef, setIsContentOverflowing);

  useResizeObserver(
    mainContentRef,
    (entry) => {
      if (entry) {
        const { scrollHeight, clientHeight } = entry.target;
        setIsContentOverflowing(scrollHeight > clientHeight);
      }
    },
    isModalOpen
  );

  const save = () => handleSave(streamManagerActionData);
  const send = (e) => {
    e.preventDefault();
    if (!shouldSubmitOnButtonClick) handleConfirm(streamManagerActionData);
  };

  const submitOnButtonClick = () => {
    if (shouldSubmitOnButtonClick) handleConfirm(streamManagerActionData);
  };

  const onClose = () => {
    actionName === STREAM_ACTION_NAME.AMAZON_PRODUCT &&
      handleResetAmazonProductData();
    closeModal();
  };

  const renderStreamManagerAction = (children) => (
    <>
      {
        /**
         * We mount/unmount the responsive panel to skip the enter and exit
         * animations when switching between desktop and mobile views
         */
        isMobileView && (
          <ResponsivePanel
            isOpen={isModalOpen}
            mobileBreakpoint={isLandscape ? BREAKPOINTS.lg : BREAKPOINTS.md}
            panelId="stream-action-panel"
            preserveVisible
          >
            {children}
          </ResponsivePanel>
        )
      }
      <Modal
        isOpen={isModalOpen && !isMobileView}
        className={clsm([
          'relative',
          'p-0',
          'w-full',
          'max-w-[592px]',
          'bg-white',
          'dark:bg-darkMode-gray-medium'
        ])}
      >
        {children}
      </Modal>
    </>
  );

  return (
    type === MODAL_TYPE.STREAM_MANAGER_ACTION &&
    !!content &&
    renderStreamManagerAction(
      <form
        data-testid={`${actionName}-stream-action-form`}
        ref={ref}
        onSubmit={send}
        className={clsm(
          getModalFormClasses(isLandscape),
          isAmazonProductStreamAction && 'h-[85vh]'
        )}
      >
        <div
          ref={mainContentRef}
          className={clsm(
            getModalContainerClasses(isLandscape),
            'h-full',
            'flex',
            'flex-col'
          )}
        >
          <h2 className={getFormHeaderClasses(isAmazonProductStreamAction)}>
            {title}
          </h2>
          <div
            className={clsm([
              'flex-1',
              'flex-col',
              'flex',
              'space-y-8',
              isContentOverflowing && 'pb-12'
            ])}
          >
            {streamManagerActionContent}
          </div>
        </div>
        <Button
          ariaLabel="Close the stream action modal"
          data-testid="stream-action-modal-close-button"
          className={clsm(MODAL_CLOSE_BUTTON_CLASSES)}
          onClick={onClose}
          variant="icon"
        >
          <Close />
        </Button>
        <footer
          className={clsm(
            ['flex', 'items-center', 'justify-between', 'p-12', 'md:p-4'],
            isLandscape && 'touch-screen-device:lg:p-4',
            isContentOverflowing && MODAL_OVERFLOW_DIVIDER_CLASSES
          )}
        >
          <Button
            className={clsm([
              'w-auto',
              'sm:hidden',
              !isLandscape && 'md:hidden'
            ])}
            onClick={onClose}
            variant={prefersDarkColorScheme ? 'secondary' : 'tertiary'}
          >
            {$content.stream_manager_actions.cancel}
          </Button>
          <div
            className={clsm([
              'flex',
              'space-x-3',
              'sm:w-full',
              !isLandscape && 'md:w-full'
            ])}
          >
            {actionName !== STREAM_ACTION_NAME.AMAZON_PRODUCT && (
              <Button
                className={buttonClasses}
                onClick={save}
                variant={prefersDarkColorScheme ? 'secondary' : 'tertiary'}
              >
                {$content.stream_manager_actions.save}
              </Button>
            )}
            <Button
              type={shouldSubmitOnButtonClick ? 'button' : 'submit'}
              className={buttonClasses}
              onClick={submitOnButtonClick}
            >
              {isSendingStreamAction && <Spinner className="absolute" />}
              <p {...(isSendingStreamAction ? { className: 'invisible' } : {})}>
                {confirmText}
              </p>
            </Button>
          </div>
        </footer>
      </form>
    )
  );
});

export default StreamManagerActionModal;
