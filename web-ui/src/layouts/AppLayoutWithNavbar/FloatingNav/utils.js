import { app as $appContent } from '../../../content';
import {
  Favorite,
  Feed,
  Home,
  Settings,
  StreamHealth,
  StreamManager
} from '../../../assets/icons';

const $content = $appContent.navbar;

export const navMenuButtonData = [
  {
    label: $content.home,
    icon: <Home />,
    to: '/'
  },
  {
    label: $content.feed,
    icon: <Feed />,
    to: '/feed'
  },
  {
    label: $content.following,
    icon: <Favorite />,
    to: '/following',
    hasDivider: true
  },
  {
    label: $content.stream_health,
    icon: <StreamHealth />,
    to: '/health'
  },
  {
    label: $content.stream_manager,
    icon: <StreamManager />,
    to: '/manager'
  },
  {
    label: $content.settings,
    icon: <Settings />,
    to: '/settings',
    hasDivider: true
  }
];
