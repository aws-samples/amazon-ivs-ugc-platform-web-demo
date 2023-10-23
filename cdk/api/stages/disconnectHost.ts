import { FastifyReply, FastifyRequest } from 'fastify';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: call SQS here!
  reply.send(200);
};

export default handler;
