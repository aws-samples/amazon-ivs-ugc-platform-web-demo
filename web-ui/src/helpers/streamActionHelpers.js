import { compressToBase64, decompressFromBase64 } from 'lz-string';

/**
 * Compresses a metadata object into a Base64 encoded string.
 *
 * @param {object} metadataObj a metadata object
 * @returns {string} compressedMetadataStr
 */
export const pack = (metadataObj) =>
  compressToBase64(JSON.stringify(metadataObj));

/**
 *
 * Decompresses a Base64 encoded metadata string and returns the parsed object.
 *
 * @param {string} metadataStr a Base64 encoded metadata string
 * @returns {object} decompressedMetadataObj
 */
export const unpack = (metadataStr) =>
  JSON.parse(decompressFromBase64(metadataStr));

export const sanitizeAmazonProductData = ({
  color,
  images,
  price,
  productURL,
  title
}) => ({
  color: color,
  imageUrl: images?.large.url,
  price: price?.displayAmount,
  productUrl: productURL,
  title: title
});
