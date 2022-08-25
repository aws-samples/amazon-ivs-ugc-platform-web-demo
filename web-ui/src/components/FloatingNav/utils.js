import {
  Favorite,
  Feed,
  Home,
  Settings,
  StreamHealth,
  StreamManager
} from '../../assets/icons';
import { app as $appContent } from '../../content';
import { SHOW_WIP_PAGES } from '../../constants';

const $content = $appContent.navbar;

export const navMenuButtonData = [
  {
    label: $content.home,
    icon: <Home />,
    to: '/',
    pageName: 'channel_directory'
  },
  {
    label: $content.feed,
    icon: <Feed />,
    to: '/feed',
    pageName: 'feed'
  },
  ...(SHOW_WIP_PAGES
    ? [
        {
          label: $content.following,
          icon: <Favorite />,
          to: '/following',
          hasDivider: true
        },
        {
          label: $content.stream_manager,
          icon: <StreamManager />,
          to: '/manager'
        }
      ]
    : []),
  {
    label: $content.stream_health,
    icon: <StreamHealth />,
    to: '/health',
    pageName: 'stream_health'
  },
  {
    label: $content.settings,
    icon: <Settings />,
    to: '/settings',
    hasDivider: true,
    pageName: 'settings'
  }
];
