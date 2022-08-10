import { app as $appContent } from '../../../content';
import {
  Feed,
  Home,
  Favorite,
  StreamHealth,
  StreamManager
} from '../../../assets/icons';

const $content = $appContent.navbar;

export const navPageData = [
  {
    pageName: 'channel_directory',
    displayName: $content.home,
    icon: <Home />,
    route: '/',
    isAuth: false
  },
  {
    pageName: 'feed',
    displayName: $content.feed,
    icon: <Feed />,
    route: '/feed',
    isAuth: false
  },
  {
    pageName: 'following',
    displayName: $content.following,
    icon: <Favorite />,
    route: '/following',
    isAuth: true
  },
  {
    pageName: 'stream_health',
    displayName: $content.stream_health,
    icon: <StreamHealth />,
    route: '/health',
    isAuth: true
  },
  {
    pageName: 'stream_manager',
    displayName: $content.stream_manager,
    icon: <StreamManager />,
    route: '/manager',
    isAuth: true
  }
];
