import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm, noop } from '../../../../../../../utils';

const commonProductImgClasses = [
  'h-[100px]',
  'min-w-[100px]',
  'rounded-xl',
  'w-[100px]',
  'xs:h-[100px]',
  'xs:w-[192px]'
];

const StreamManagerActionProductResultsRow = ({
  imgSrc,
  index,
  merchantInfo,
  onClick,
  price,
  selectedProductIndex,
  title,
  ariaLabel
}) => {
  const [hasImgError, setHasImgError] = useState(false);

  const onError = useCallback(() => {
    setHasImgError(true);
  }, []);

  const shouldShowImg = !!(!hasImgError && imgSrc);

  return (
    <div className={clsm(['relative', 'flex', 'space-x-6'])}>
      <div className="pr-6">
        <input
          aria-label={ariaLabel}
          checked={selectedProductIndex === index}
          className={clsm(['radio', 'absolute', '!top-[48px]'])}
          name={title}
          onChange={onClick}
          type="radio"
          value={index}
        />
      </div>
      <div
        className={clsm([
          'flex-row',
          'flex',
          'space-x-6',
          'xs:flex-col',
          'xs:space-x-0'
        ])}
      >
        {shouldShowImg ? (
          <img
            className={clsm(commonProductImgClasses)}
            alt=""
            src={imgSrc}
            onError={onError}
          />
        ) : (
          <div
            className={clsm([
              'bg-lightMode-gray-light',
              'dark:bg-darkMode-gray-dark',
              commonProductImgClasses
            ])}
          />
        )}
        <div
          className={clsm([
            'flex-col',
            'flex',
            'justify-center',
            'xs:justify-start'
          ])}
        >
          <p
            style={{ overflowWrap: 'anywhere' }}
            className={clsm([
              'break-words',
              'font-bold',
              'line-clamp-2',
              'md:max-w-[420px]',
              'sm:font-medium',
              'sm:leading-[18px]',
              'sm:text-[15px]',
              'text-lg',
              'xs:max-w-[178px]',
              'xs:pt-4',
              'leading-[22px]'
            ])}
          >
            {title}
          </p>
          <p
            style={{ overflowWrap: 'anywhere' }}
            className={clsm([
              'dark:text-darkMode-gray-light',
              'pt-1',
              'text-lightMode-gray-medium',
              'text-sm',
              'line-clamp-1',
              'break-words'
            ])}
          >
            {merchantInfo}
          </p>
          <p
            style={{ overflowWrap: 'anywhere' }}
            className={clsm([
              'break-words',
              'line-clamp-2',
              'pt-3',
              'text-[#FF9900]',
              'text-p1'
            ])}
          >
            {price}
          </p>
        </div>
      </div>
    </div>
  );
};

StreamManagerActionProductResultsRow.defaultProps = {
  ariaLabel: null,
  imgSrc: '',
  merchantInfo: '',
  onClick: noop,
  price: '',
  title: ''
};

StreamManagerActionProductResultsRow.propTypes = {
  ariaLabel: PropTypes.string,
  imgSrc: PropTypes.string,
  index: PropTypes.number.isRequired,
  merchantInfo: PropTypes.string,
  onClick: PropTypes.func,
  price: PropTypes.string,
  selectedProductIndex: PropTypes.number.isRequired,
  title: PropTypes.string
};

export default StreamManagerActionProductResultsRow;
