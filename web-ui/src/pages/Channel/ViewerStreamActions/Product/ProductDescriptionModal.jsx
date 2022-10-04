import { clsm } from '../../../../utils';
import { useRef } from 'react';

import { Close } from '../../../../assets/icons';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import Modal from '../../../../components/Modal';

const ProductDescriptionModal = () => {
  const { closeModal, content, isModalOpen, type } = useModal();
  const { productDescriptionContent } = content || {};
  const { isLandscape } = useResponsiveDevice();
  const mainContentRef = useRef();

  return (
    type === MODAL_TYPE.PRODUCT_DESCRIPTION &&
    !!content && (
      <Modal
        isOpen={isModalOpen}
        className={clsm([
          'relative',
          'p-0',
          'w-full',
          'max-w-[592px]',
          'bg-white',
          'dark:bg-darkMode-gray-medium'
        ])}
      >
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
              'md:max-h-screen'
            ],
            isLandscape && [
              'touch-screen-device:lg:h-full',
              'touch-screen-device:lg:max-h-screen'
            ]
          )}
        >
          <Button
            ariaLabel={`Close the modal for the product description`}
            className={clsm([
              'absolute',
              'top-2',
              'right-2',
              '[&>svg]:w-6',
              '[&>svg]:h-6',
              '[&>svg]:dark:fill-white',
              '[&>svg]:fill-darkMode-gray-dark',
              'z-10'
            ])}
            onClick={closeModal}
            variant="icon"
          >
            <Close />
          </Button>
          <div
            ref={mainContentRef}
            className={clsm([
              'py-7',
              'px-8',
              'sm:p-8',
              'h-auto',
              'overflow-x-hidden',
              'overflow-y-auto',
              'supports-overlay:overflow-y-overlay'
            ])}
          >
            {productDescriptionContent}
          </div>
        </div>
      </Modal>
    )
  );
};

export default ProductDescriptionModal;
