import { FastifyPluginAsync } from 'fastify';

import getChannelData from './getChannelData';
import getChannels from './getChannels';

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/:channelOwnerUsername', getChannelData);
  resource.get('/', getChannels);
};

export default router;
