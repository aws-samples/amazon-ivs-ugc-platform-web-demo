import { createContext, useMemo } from 'react';

import {
  AccountSettings,
  ChannelSettings,
  StreamSettings
} from './settingsSections';
import { clsm } from '../../utils';
import { dashboard as $content } from '../../content';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import withVerticalScroller from '../../components/withVerticalScroller';
import useContextHook from '../../contexts/useContextHook';

const Context = createContext(null);
Context.displayName = 'SettingsOrientation';
export const useSettingsOrientation = () => useContextHook(Context);
export const SETTINGS_ORIENTATION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};

const Settings = () => {
  const { userData } = useUser();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const settingsFormOrientation = useMemo(
    () =>
      isDefaultResponsiveView
        ? SETTINGS_ORIENTATION.VERTICAL
        : SETTINGS_ORIENTATION.HORIZONTAL,
    [isDefaultResponsiveView]
  );

  return (
    userData && (
      <article
        className={clsm([
          'flex',
          'flex-col',
          'items-start',
          'justify-center',
          'mx-auto',
          'mt-24',
          'mb-10',
          'max-w-[960px]',
          'space-y-[60px]',
          'px-[30px]',
          'box-content',
          'md:px-4',
          'md:py-0',
          'md:mx-auto',
          'md:mt-8',
          'md:mb-24'
        ])}
      >
        <h1>{$content.settings_page.title}</h1>
        <Context.Provider value={settingsFormOrientation}>
          <ChannelSettings />
          <StreamSettings />
          <AccountSettings />
        </Context.Provider>
      </article>
    )
  );
};

export default withVerticalScroller(Settings);
