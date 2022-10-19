import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../../../constants';
import { clsm, isiOS } from '../../../../utils';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import ProductButtons from './ProductButtons';
import ProductCardImage from './ProductCardImage';
import { useEffect, useRef } from 'react';

const ProductDescription = ({ color, title, description, price, imageUrl }) => {
  const { currentBreakpoint, isLandscape } = useResponsiveDevice();
  const productDescriptionRef = useRef();
  const isSmallBreakpoint = currentBreakpoint < BREAKPOINTS.sm;
  const customProductImageClasses = [
    'w-[320px]',
    'h-[320px]',
    'sm:w-full',
    'sm:max-w-none',
    'sm:max-h-fit',
    'sm:h-[calc(100vw_-_32px)]'
  ];

  /*
  We've found that on iOS devices, some of the existing CSS styles weren't applied correctly after an orientation change. 
  Forcing the browser to repaint the element by updating the style attribute seems to solve the issue.
  */

  useEffect(() => {
    if (isiOS()) {
      productDescriptionRef.current.style.overflowWrap = 'anywhere';
    }
  }, [isLandscape]);

  return (
    <div
      className={clsm([
        'flex',
        'sm:flex-col',
        'w-full',
        'justify-between',
        'sm:h-full'
      ])}
    >
      <ProductCardImage
        color={color}
        customClasses={customProductImageClasses}
        imageUrl={imageUrl}
        price={price}
        title={title}
      />
      <div
        className={clsm([
          'flex',
          'flex-col',
          'justify-end',
          'w-[180px]',
          'md:pl-2',
          'sm:pl-0',
          'sm:pt-8',
          'sm:w-full'
        ])}
      >
        <div
          className={clsm([
            'h-full',
            'flex',
            'flex-col',
            'justify-center',
            'sm:pb-8',
            'md:pr-2'
          ])}
        >
          <h2 className={clsm(['text-black', 'dark:text-white'])}>{title}</h2>
          <p
            ref={productDescriptionRef}
            className={clsm([
              'py-2.5',
              'sm:pb-0',
              'sm:pt-2',
              'text-[#A0A0A0]',
              'text-sm',
              'sm:text-md',
              'break-anywhere'
            ])}
          >
            {description}
          </p>
        </div>
        {!isSmallBreakpoint && (
          <ProductButtons variant="productDescriptionDesktop" />
        )}
      </div>
    </div>
  );
};

ProductDescription.defaultProps = {
  color: 'default',
  imageUrl: '',
  price: ''
};

ProductDescription.propTypes = {
  color: PropTypes.string,
  description: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  price: PropTypes.string,
  title: PropTypes.string.isRequired
};

export default ProductDescription;
