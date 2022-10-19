import { useRef, useState } from 'react';

import { BREAKPOINTS } from '../../../../constants';
import { Close } from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import Modal from '../../../../components/Modal';
import ResponsivePanel from '../../../../components/ResponsivePanel';
import useResizeObserver from '../../../../hooks/useResizeObserver';
import ProductButtons from './ProductButtons';

const ProductDescriptionModal = () => {
  const { closeModal, content, isModalOpen, type } = useModal();
  const { productDescriptionContent } = content || {};
  const { isLandscape, currentBreakpoint } = useResponsiveDevice();
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const mainContentRef = useRef();
  const isSmallBreakpoint = currentBreakpoint < BREAKPOINTS.sm;

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

  const renderLearnMoreDescription = (children) => (
    <>
      {
        /**
         * We mount/unmount the responsive panel to skip the enter and exit
         * animations when switching between desktop and mobile views
         */
        isSmallBreakpoint && (
          <ResponsivePanel
            isOpen={isModalOpen}
            mobileBreakpoint={isLandscape ? BREAKPOINTS.lg : BREAKPOINTS.md}
            panelId="product-learn-more-panel"
            preserveVisible
          >
            {children}
          </ResponsivePanel>
        )
      }
      <Modal
        isOpen={isModalOpen && !isSmallBreakpoint}
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
    type === MODAL_TYPE.PRODUCT_DESCRIPTION &&
    !!content &&
    renderLearnMoreDescription(
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
            'sm:h-full',
            'sm:max-h-screen',
            'sm:rounded-none'
          ],
          isLandscape && [
            'touch-screen-device:sm:h-full',
            'touch-screen-device:sm:max-h-screen',
            'touch-screen-device:sm:rounded-none',
            'max-h-[calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px)]'
          ]
        )}
      >
        <Button
          ariaLabel={`Close the modal for the product description`}
          className={clsm([
            'absolute',
            'top-4',
            'right-4',
            '[&>svg]:w-6',
            '[&>svg]:h-6',
            '[&>svg]:dark:fill-white',
            '[&>svg]:fill-darkMode-gray-dark',
            'z-10',
            'bg-white',
            'dark:bg-darkMode-gray-medium'
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
              'py-7',
              'px-8',
              'h-auto',
              'sm:px-4',
              'sm:pt-[100px]',
              'overflow-x-hidden',
              'overflow-y-auto',
              'supports-overlay:overflow-y-overlay',
              'scrollbar-mt-4'
            ],
            isLandscape && [
              'touch-screen-device:lg:px-7',
              'touch-screen-device:lg:pt-8'
            ]
          )}
        >
          <div
            className={clsm([
              'flex',
              'flex-col',
              isContentOverflowing && 'pb-12'
            ])}
          >
            {productDescriptionContent}
          </div>
        </div>
        {isSmallBreakpoint && (
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
            <ProductButtons variant="productDescriptionMobile" />
          </footer>
        )}
      </div>
    )
  );
};

export default ProductDescriptionModal;
