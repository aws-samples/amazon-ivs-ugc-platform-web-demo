import PropTypes from 'prop-types';

import { clsm, noop } from '../../utils';
import Icon, { ICON_TYPE } from './Icon';
import useThrottledCallback from '../../hooks/useThrottledCallback';

const IconSelect = ({ selected, isLoading, items, onSelect, type }) => {
  const throttledOnSelect = useThrottledCallback(onSelect, 250, [onSelect]);

  return (
    <div
      className={clsm(['flex', 'flex-wrap', 'gap-x-3', 'gap-y-3', 'w-full'])}
    >
      {items.map(([name, value, { CustomMarker } = {}]) => {
        const isSelected = selected === name;
        const isIconLoading = isSelected && isLoading;
        const onClick = () => throttledOnSelect({ newSelection: name });

        return (
          <Icon
            CustomMarker={CustomMarker}
            isLoading={isIconLoading}
            isSelected={isSelected}
            key={name}
            name={name}
            onClick={onClick}
            type={type}
            value={value}
          />
        );
      })}
    </div>
  );
};

IconSelect.propTypes = {
  isLoading: PropTypes.bool,
  items: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  selected: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.values(ICON_TYPE)).isRequired
};

IconSelect.defaultProps = { isLoading: false, onSelect: noop };

export default IconSelect;
