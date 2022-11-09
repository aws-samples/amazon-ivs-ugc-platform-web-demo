import { FastifyPluginAsync } from 'fastify';

import getChannelData from './getChannelData';

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/:channelOwnerUsername', getChannelData);
};

export default router;
