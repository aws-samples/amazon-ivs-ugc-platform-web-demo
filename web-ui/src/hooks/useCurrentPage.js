import { matchRoutes, useLocation } from 'react-router-dom';

const ROUTES = [
  { path: '/', name: 'channel_directory' },
  {
    path: ':username',
    name: 'channel',
    children: [{ index: true }, { path: 'profile' }]
  },
  { path: 'following', name: 'following' },
  { path: 'settings', name: 'settings' },
  {
    path: 'manager',
    name: 'stream_manager',
    children: [{ index: true }, { path: 'collab' }]
  },
  {
    path: '/health',
    name: 'stream_health',
    children: [{ index: true }, { path: ':streamId' }]
  },
  { path: 'login', name: 'login' },
  { path: 'register', name: 'register' },
  { path: 'reset', name: 'reset' }
];

const useCurrentPage = () => {
  const location = useLocation();
  const [match] = matchRoutes(ROUTES, location) || [];

  return match?.route?.name;
};

export default useCurrentPage;
