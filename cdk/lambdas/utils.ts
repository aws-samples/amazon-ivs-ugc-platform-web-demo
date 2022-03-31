export const createFailureResponse = (statusCode = 500) => ({
  body: JSON.stringify({ message: 'FAILURE' }),
  statusCode
});

export const createSuccessResponse = (statusCode = 200) => ({
  body: JSON.stringify({ message: 'SUCCESS' }),
  statusCode
});
