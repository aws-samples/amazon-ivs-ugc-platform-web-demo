import { Avatar, Banner, Color } from './preferenceComponents';
import { clsm } from '../../../../utils';
import { dashboard as $content } from '../../../../content';
import { SETTINGS_SECTION_CLASSES } from '../../SettingsTheme';

const ChannelSettings = () => (
  <section className={clsm(SETTINGS_SECTION_CLASSES)}>
    <h3>{$content.settings_page.channel_settings}</h3>
    <Color />
    <Avatar />
    <Banner />
  </section>
);

export default ChannelSettings;
