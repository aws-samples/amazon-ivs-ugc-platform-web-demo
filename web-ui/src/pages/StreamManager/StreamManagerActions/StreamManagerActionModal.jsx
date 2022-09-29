import { useRef, useState, useEffect } from 'react';

import { BREAKPOINTS } from '../../../constants';
import { Close } from '../../../assets/icons';
import { clsm } from '../../../utils';
import { MODAL_TYPE, useModal } from '../../../contexts/Modal';
import { streamManager as $streamManagerContent } from '../../../content';
import { useNotif } from '../../../contexts/Notification';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useStreamManagerActions } from '../../../contexts/StreamManagerActions';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import ResponsivePanel from '../../../components/ResponsivePanel';
import Spinner from '../../../components/Spinner';
import useMediaQuery from '../../../hooks/useMediaQuery';
import useResizeObserver from '../../../hooks/useResizeObserver';

const $content = $streamManagerContent.stream_manager_actions;

const StreamManagerActionModal = () => {
  const { closeModal, content, handleConfirm, handleSave, isModalOpen, type } =
    useModal();
  const { title, confirmText, streamManagerActionContent } = content || {};
  const { getStreamManagerActionData, isSendingStreamAction } =
    useStreamManagerActions();
  const { isMobileView, isLandscape } = useResponsiveDevice();
  const { dismissNotif } = useNotif();
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const streamManagerActionData = getStreamManagerActionData();
  const mainContentRef = useRef();
  const prefersDarkColorScheme = useMediaQuery('(prefers-color-scheme: dark)');
  const buttonClasses = clsm(['relative', 'w-auto', 'md:w-full']);
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
  const send = () => handleConfirm(streamManagerActionData);

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

  useEffect(() => {
    if (!isModalOpen) dismissNotif();
  }, [dismissNotif, isModalOpen]);

  return (
    type === MODAL_TYPE.STREAM_MANAGER_ACTION &&
    !!content &&
    renderStreamManagerAction(
      <div
        className={clsm(
          [
            'flex',
            'flex-col',
            'justify-between',
            'rounded-3xl',
            'max-h-[calc(100vh_-_2*24px)]',
            'bg-white',
            'dark:bg-darkMode-gray-medium',
            'md:h-full',
            'md:max-h-screen',
            'md:rounded-none'
          ],
          isLandscape && [
            'touch-screen-device:lg:h-full',
            'touch-screen-device:lg:max-h-screen',
            'touch-screen-device:lg:rounded-none'
          ]
        )}
      >
        <Button
          ariaLabel={`Close the modal for the stream action named ${title}`}
          className={clsm([
            'absolute',
            'top-4',
            'right-4',
            '[&>svg]:w-6',
            '[&>svg]:h-6',
            '[&>svg]:dark:fill-white',
            '[&>svg]:fill-darkMode-gray-dark',
            'z-10'
          ])}
          onClick={() => closeModal()}
          variant="icon"
        >
          <Close />
        </Button>
        <div
          ref={mainContentRef}
          className={clsm(
            [
              'px-12',
              'pt-12',
              'h-auto',
              'md:px-4',
              'md:pt-6',
              'overflow-x-hidden',
              'overflow-y-auto',
              'supports-overlay:overflow-y-overlay',
              'scrollbar-mt-4'
            ],
            isLandscape && [
              'touch-screen-device:lg:px-4',
              'touch-screen-device:lg:pt-6'
            ]
          )}
        >
          <h2 className={clsm(['text-center', 'pb-12'])}>{title}</h2>
          <div className={clsm(isContentOverflowing && 'pb-12')}>
            {streamManagerActionContent}
          </div>
        </div>
        <footer
          className={clsm(
            ['flex', 'items-center', 'justify-between', 'p-12', 'md:p-4'],
            isLandscape && 'touch-screen-device:lg:p-4',
            isContentOverflowing && [
              'border-t-[1px]',
              'border-lightMode-gray',
              'dark:border-black'
            ]
          )}
        >
          <Button
            className={clsm([
              'w-auto',
              'sm:hidden',
              !isLandscape && 'md:hidden'
            ])}
            onClick={() => closeModal()}
            variant={prefersDarkColorScheme ? 'secondary' : 'tertiary'}
          >
            {$content.cancel}
          </Button>
          <div
            className={clsm([
              'flex',
              'gap-x-3',
              'sm:w-full',
              !isLandscape && 'md:w-full'
            ])}
          >
            <Button
              className={buttonClasses}
              onClick={save}
              variant={prefersDarkColorScheme ? 'secondary' : 'tertiary'}
            >
              {$content.save}
            </Button>
            <Button className={buttonClasses} onClick={send}>
              {isSendingStreamAction && <Spinner className="absolute" />}
              <p {...(isSendingStreamAction ? { className: 'invisible' } : {})}>
                {confirmText}
              </p>
            </Button>
          </div>
        </footer>
      </div>
    )
  );
};

export default StreamManagerActionModal;
