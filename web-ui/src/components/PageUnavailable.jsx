import { app as $content } from '../content';
import { clsm } from '../utils';
import { SmartToy } from '../assets/icons';
import Button from './Button';

const PageUnavailable = () => (
  <div
    className={clsm(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'text-center',
      'h-screen',
      'w-full',
      'bg-lightMode-gray',
      'dark:bg-black'
    )}
  >
    <div className={clsm(['flex', 'flex-col', 'items-center', 'space-y-8'])}>
      <div
        className={clsm([
          'flex',
          'flex-col',
          'items-center',
          'opacity-50',
          'space-y-2'
        ])}
      >
        <SmartToy
          className={clsm(['[&>path]:fill-black', '[&>path]:dark:fill-white'])}
        />
        <h3 className={clsm(['text-black', 'dark:text-white'])}>
          {$content.page_unavailable}
        </h3>
      </div>
      <Button type="nav" variant="secondary" to="/">
        {$content.back_to_directory}
      </Button>
    </div>
  </div>
);

export default PageUnavailable;
