export interface ResponseBody {
  [key: string]: string | undefined;
}

export const createResponse = (
  statusCode: number,
  body: ResponseBody = {}
) => ({
  body: JSON.stringify(body),
  headers: {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN as string,
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, DELETE'
  },
  statusCode
});
