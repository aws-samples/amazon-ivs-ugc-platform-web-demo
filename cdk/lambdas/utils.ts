export const createFailureResponse = ({
  message = 'FAILURE',
  statusCode = 500
} = {}) => ({
  body: JSON.stringify({ message }),
  headers: {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN as string,
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  },
  statusCode
});

export const createSuccessResponse = ({
  message = 'SUCCESS',
  statusCode = 200
} = {}) => ({
  body: JSON.stringify({ message }),
  headers: {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN as string,
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  },
  statusCode
});
