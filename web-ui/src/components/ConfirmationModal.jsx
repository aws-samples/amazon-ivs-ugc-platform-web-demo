import { app as $appContent } from '../content';
import { clsm } from '../utils';
import { useModal, MODAL_TYPE } from '../contexts/Modal';
import Button from './Button';
import Modal from './Modal';

const $content = $appContent.modal;
const buttonClasses = clsm(['w-auto', 'sm:w-full']);

const ConfirmationModal = () => {
  const { content, type, handleConfirm, closeModal, isModalOpen } = useModal();
  const { confirmText, isInformational, isDestructive, message, subMessage } =
    content || {};

  return (
    type === MODAL_TYPE.CONFIRMATION &&
    !!content && (
      <Modal isOpen={isModalOpen}>
        <h3>{message}</h3>
        {subMessage && (
          <p
            className={clsm([
              'p1',
              'mt-4',
              'text-black',
              'dark:text-darkMode-gray-extraLight'
            ])}
          >
            {subMessage}
          </p>
        )}
        <div
          className={clsm([
            'flex',
            'items-center',
            'justify-end',
            'mt-8',
            'space-x-2.5',
            'sm:flex-col-reverse',
            'sm:[&>button+button]:mb-5'
          ])}
        >
          {!isInformational && (
            <Button
              className={buttonClasses}
              onClick={() => closeModal()}
              variant="secondaryText"
            >
              {$content.cancel}
            </Button>
          )}
          <Button
            className={buttonClasses}
            onClick={handleConfirm}
            variant={isDestructive ? 'destructive' : 'primary'}
          >
            {confirmText}
          </Button>
        </div>
      </Modal>
    )
  );
};

export default ConfirmationModal;
