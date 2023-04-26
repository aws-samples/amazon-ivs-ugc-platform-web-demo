import { unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import { createSearchProductsRequest, searchProducts } from './helpers';
import { getSecrets } from '../shared/helpers';
import { getProductsSummary } from './mappers';
import { getUser } from '../channel/helpers';
import { FETCH_AMAZON_PRODUCTS_ORIGINS, SECRET_IDS } from '../shared/constants';
import {
  SORT_PRODUCTS_EXCEPTION,
  TOO_MANY_REQUESTS_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../shared/constants';
import { UserContext } from '../channel/authorizer';

interface GetProductsQuerystring {
  sort?: string;
  page?: number;
  language?: string;
  origin?: string;
}

interface GetProductsParams {
  keywords: string;
}

const handler = async (
  request: FastifyRequest<{
    Params: GetProductsParams;
    Querystring: GetProductsQuerystring;
  }>,
  reply: FastifyReply
) => {
  try {
    const secretName = process.env.PRODUCT_API_SECRET_NAME as string;
    const secrets = await getSecrets(secretName);
    const keyword = request.params.keywords;
    const searchProductsRequest = createSearchProductsRequest(
      keyword,
      request.query,
      secrets
    );
    const searchResults = await searchProducts(searchProductsRequest);

    const { sub } = request.requestContext.get('user') as UserContext;
    const { Item: UserItem = {} } = await getUser(sub);
    const { trackingId = '' } = unmarshall(UserItem);

    const productsSummary = getProductsSummary(searchResults, trackingId);

    return reply.send({ ...productsSummary, keyword });
  } catch (error) {
    const { origin } = request.query;
    console.error(error);
    reply.statusCode = 500;

    if (origin === FETCH_AMAZON_PRODUCTS_ORIGINS.SORT) {
      return reply.send({ __type: SORT_PRODUCTS_EXCEPTION });
    }

    if ((error as { status?: number })?.status === 429) {
      reply.statusCode = 429;
      return reply.send({ __type: TOO_MANY_REQUESTS_EXCEPTION });
    }

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
