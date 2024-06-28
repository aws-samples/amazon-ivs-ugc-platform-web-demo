import PropTypes from 'prop-types';

import { clsm, noop } from '../../../../../../utils';
import { Filter } from '../../../../../../assets/icons';
import { streamManager as $streamManagerContent } from '../../../../../../content';
import Button from '../../../../../../components/Button';

const $content = $streamManagerContent.stream_manager_actions.amazon_product;

export const SortButton = ({ isDropdownOpen, onClick }) => (
  <Button
    ariaLabel={
      isDropdownOpen ? $content.dropdown.collapse : $content.dropdown.expand
    }
    className={clsm([
      '[&>svg]:fill-black',
      '[&>svg]:h-6',
      '[&>svg]:w-6',
      'bg-lightMode-gray',
      'dark:[&>svg]:fill-white',
      'dark:bg-darkMode-gray',
      'dark:hover:bg-darkMode-gray-hover',
      'focus:outline-none',
      'h-11',
      'hover:bg-lightMode-gray-hover',
      'p-2.5',
      'rounded-full',
      'w-11',
      isDropdownOpen && [
        'dark:[&>svg]:fill-darkMode-blue',
        '[&>svg]:fill-lightMode-blue'
      ]
    ])}
    onClick={() => onClick(!isDropdownOpen)}
    variant="icon"
  >
    <Filter />
  </Button>
);

SortButton.propTypes = {
  isDropdownOpen: PropTypes.bool,
  onClick: PropTypes.func
};

SortButton.defaultProps = {
  isDropdownOpen: false,
  onClick: noop
};

export default SortButton;
