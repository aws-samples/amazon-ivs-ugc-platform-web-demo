import PropTypes from 'prop-types';

import { channel as $channelContent } from '../../../content';
import { clsm } from '../../../utils';
import Button from '../../../components/Button';

const $content = $channelContent.actions.product;

const Product = ({ color, description, imageUrl, price, title }) => {
  const primaryBgColorClass = `bg-profile-${color || 'default'}`;
  const secondaryBgColorClasses = [
    `bg-profile-${color || 'default'}-lightMode`,
    `dark:bg-profile-${color || 'default'}-darkMode`,
    `focus:bg-profile-${color || 'default'}-lightMode`,
    `dark:focus:bg-profile-${color || 'default'}-darkMode`,
    `hover:bg-profile-${color || 'default'}-lightMode-hover`,
    `dark:hover:bg-profile-${color || 'default'}-darkMode-hover`
  ];
  const secondaryTextColorClass = `text-profile-${color || 'default'}`;
  const shouldForceWhiteTextLightMode = ['purple', 'salmon'].includes(color);
  const shouldForceWhiteTextLightDark = color === 'blue';

  return (
    <div
      className={clsm([
        'flex-col',
        'flex',
        'gap-y-4',
        'items-center',
        'p-5',
        'rounded-3xl',
        'w-full'
      ])}
    >
      <div
        className={clsm([
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray',
          'h-[216px]',
          'relative',
          'rounded-3xl',
          'w-full'
        ])}
      >
        <img className={clsm(['rounded-3xl'])} src={imageUrl} alt={title} />
        <span
          className={clsm([
            'absolute',
            'px-2.5',
            'py-0.5',
            'right-3.5',
            'rounded-3xl',
            'top-3.5',
            'text-black',
            shouldForceWhiteTextLightMode && ['text-white', 'dark:text-black'],
            shouldForceWhiteTextLightDark && ['text-white', 'dark:text-white'],
            primaryBgColorClass
          ])}
        >
          {price}
        </span>
      </div>
      <h3
        className={clsm([
          'dark:text-white',
          'font-bold',
          'leading-6',
          'text-black',
          'text-xl'
        ])}
      >
        {title}
      </h3>
      <div className={clsm(['flex', 'flex-col', 'gap-y-2', 'w-full'])}>
        <Button
          className={clsm([
            `hover:${primaryBgColorClass}-hover`,
            `focus:${primaryBgColorClass}`,
            primaryBgColorClass,
            shouldForceWhiteTextLightMode && ['text-white', 'dark:text-black'],
            shouldForceWhiteTextLightDark && ['text-white', 'dark:text-white']
          ])}
        >
          {$content.buy_now}
        </Button>
        <Button
          className={clsm([
            `dark:${secondaryTextColorClass}`,
            secondaryBgColorClasses
          ])}
        >
          {$content.learn_more}
        </Button>
      </div>
    </div>
  );
};

Product.defaultProps = { color: '' };

Product.propTypes = {
  color: PropTypes.string,
  description: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

export default Product;
