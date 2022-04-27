export const buildChannelArn = (suffix: string) =>
  `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}:channel/${suffix}`;
