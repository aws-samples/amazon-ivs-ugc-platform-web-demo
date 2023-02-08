import RenditionSettingPopup from './RenditionSettingPopup';
import withPortal from '../../../../../components/withPortal';

const RenditionSettingPopupPortal = withPortal(
  RenditionSettingPopup,
  'rendition-setting-popup',
  {
    baseContainerClasses: [
      'fixed',
      'top-0',
      'left-0',
      'w-full',
      'h-full',
      'z-[1000]'
    ]
  }
);

export default RenditionSettingPopupPortal;
