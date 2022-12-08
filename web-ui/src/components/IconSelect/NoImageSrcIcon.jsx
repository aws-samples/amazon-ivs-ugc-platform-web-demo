import { clsm } from '../../utils';

const NoImageSrcIcon = () => (
  <div
    className={clsm([
      'overflow-hidden',
      'before:absolute',
      'before:rounded-full',
      'before:w-full',
      'before:h-full',
      'before:top-1/2',
      'before:left-1/2',
      'before:-translate-x-1/2',
      'before:-translate-y-1/2',
      'before:bg-lightMode-gray-extraLight',
      'dark:before:bg-darkMode-gray'
    ])}
  />
);

export default NoImageSrcIcon;
