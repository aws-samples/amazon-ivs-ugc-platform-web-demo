import { clsm } from '../../utils';
import InlineNotification from './InlineNotification';
import withPortal from '../withPortal';

const PortalNotification = withPortal(InlineNotification, 'notification', {
  isAnimated: true,
  baseContainerClasses: clsm([
    'absolute',
    'left-0',
    'right-0',
    'top-0',
    'z-[800]'
  ])
});

export default PortalNotification;
