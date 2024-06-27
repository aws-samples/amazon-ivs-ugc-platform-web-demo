import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm, noop } from '../../../../../../utils';
import { createAnimationProps } from '../../../../../../helpers/animationPropsHelper';
import { streamManager as $streamManagerContent } from '../../../../../../content';
import Label from '../../../../../../components/Input/InputLabel';

const $content =
  $streamManagerContent.stream_manager_actions.amazon_product.dropdown
    .search_parameters;

const SortDropdown = ({
  isDropdownOpen = false,
  onClick = noop,
  selectedSortCategory,
  sortCategories
}) => {
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(e);
    }
  };

  const lastCategoryValue = sortCategories.at(-1).label;

  return (
    <AnimatePresence>
      {isDropdownOpen && (
        <motion.div
          {...createAnimationProps({
            animations: ['fadeIn-half'],
            customVariants: {
              hidden: {
                height: 0,
                marginTop: '0px',
                transitionEnd: { display: 'none' }
              },
              visible: {
                height: 'auto',
                marginTop: '12px'
              }
            },
            options: {
              isVisible: isDropdownOpen
            },
            transition: 'bounce'
          })}
          className={clsm([
            'bg-lightMode-gray-light',
            'dark:bg-darkMode-gray',
            'h-auto',
            'rounded-3xl',
            'w-full'
          ])}
        >
          <div
            className={clsm([
              '[&>label]:font-bold',
              '[&>label]:text-lg',
              'bg-transparent',
              'dark:text-white',
              'flex-col',
              'flex',
              'h-auto',
              'md:h-full',
              'overflow-x-hidden',
              'overflow-y-auto',
              'p-6',
              'scrollbar-mb-4',
              'scrollbar-mt-4',
              'sm:px-4',
              'space-y-[28px]',
              'supports-overlay:overflow-y-overlay',
              'text-black',
              '[&>label]:mb-0'
            ])}
          >
            <Label label={`${$content.sort_by}:`} />
            <div className="space-y-8">
              <div
                className={clsm([
                  'flex',
                  'grid',
                  'grid-cols-2',
                  'sm:grid-cols-1'
                ])}
              >
                {sortCategories.map(({ label, category }, index) => (
                  <div className="relative" key={`sort-category-${index}`}>
                    <motion.input
                      aria-label={label}
                      {...createAnimationProps({
                        animations: ['scale'],
                        options: {
                          isVisible: selectedSortCategory === category
                        },
                        customVariants: {
                          visible: {
                            scale: 1
                          },
                          hidden: {
                            scale: 0.84
                          }
                        }
                      })}
                      checked={selectedSortCategory === category}
                      className={clsm([
                        'radio',
                        'absolute',
                        '!top-[11px]',
                        'withGrayBg'
                      ])}
                      onKeyDown={onKeyDown}
                      onChange={onClick}
                      type="radio"
                      value={index}
                      name={label}
                      id={`sort-category-${index}`}
                    />
                    <div
                      className={clsm([
                        'pl-10',
                        'pb-8',
                        'font-medium',
                        label === lastCategoryValue && 'pb-3'
                      ])}
                    >
                      <Label label={label} htmlFor={`sort-category-${index}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

SortDropdown.propTypes = {
  isDropdownOpen: PropTypes.bool,
  onClick: PropTypes.func,
  selectedSortCategory: PropTypes.string.isRequired,
  sortCategories: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      category: PropTypes.string
    })
  ).isRequired
};

export default SortDropdown;
