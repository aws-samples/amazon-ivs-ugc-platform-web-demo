export const createFailureResponse = (statusCode = 500) => ({
  body: JSON.stringify({ message: 'FAILURE' }),
  headers: {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN as string,
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  },
  statusCode
});

export const createSuccessResponse = (statusCode = 200) => ({
  body: JSON.stringify({ message: 'SUCCESS' }),
  headers: {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN as string,
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  },
  statusCode
});
