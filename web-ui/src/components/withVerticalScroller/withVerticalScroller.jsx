import { clsm } from '../../utils';
import { WITH_VERTICAL_SCROLLER_BASE_CLASSES } from './withVerticalScrollerTheme';

const withVerticalScroller =
  (WrappedComponent, { containerClasses = [] } = {}) =>
  (props) =>
    (
      <div
        className={clsm([
          ...WITH_VERTICAL_SCROLLER_BASE_CLASSES,
          ...containerClasses
        ])}
      >
        <WrappedComponent {...props} />
      </div>
    );

export default withVerticalScroller;
