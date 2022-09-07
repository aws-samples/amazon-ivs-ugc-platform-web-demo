import { clsm } from '../../utils';
import { WITH_VERTICAL_SCROLLER_BASE_CLASSES } from './withVerticalScrollerTheme';

const withVerticalScroller = (WrappedComponent) => (props) =>
  (
    <div className={clsm(WITH_VERTICAL_SCROLLER_BASE_CLASSES)}>
      <WrappedComponent {...props} />
    </div>
  );

export default withVerticalScroller;
