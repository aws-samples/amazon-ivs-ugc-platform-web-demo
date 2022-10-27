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
  const isSmallBreakpoint = currentBreakpoint <= BREAKPOINTS.sm;
  const customProductImageClasses = [
    'w-[320px]',
    'h-[320px]',
    'md:w-full',
    'md:max-w-none',
    'md:h-[calc(100vw_-_32px)]'
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
        'md:flex-col',
        'w-full',
        'justify-between',
        'md:h-full'
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
          'w-[244px]',
          'md:pl-2',
          'md:pl-0',
          'md:pt-8',
          'md:w-full'
        ])}
      >
        <div
          className={clsm([
            'h-full',
            'flex',
            'flex-col',
            'justify-center',
            'md:pb-8',
            'md:pr-2'
          ])}
        >
          <h2
            className={clsm([
              'break-words',
              'dark:text-white',
              'text-black',
              'mr-6'
            ])}
          >
            {title}
          </h2>
          <p
            ref={productDescriptionRef}
            className={clsm([
              'break-anywhere',
              'pt-2',
              'pb-5',
              'md:pb-0',
              'md:pt-2',
              'md:text-md',
              'text-[#A0A0A0]',
              'text-sm'
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
