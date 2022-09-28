const STREAM_ACTION_METADATA_KEYS = [
  'answers',
  'correctAnswerIndex',
  'data',
  'description',
  'duration',
  'imageUrl',
  'isActive',
  'message',
  'name',
  'price',
  'question',
  'startTime',
  'title',
  'value' // Temporary - for demonstration purposes only
];

const lookupMap = new Map();
const reverseLookupMap = new Map();
for (let i = 0; i < STREAM_ACTION_METADATA_KEYS.length; i++) {
  const key = STREAM_ACTION_METADATA_KEYS[i];
  lookupMap.set(key, i);
  reverseLookupMap.set(i, key);
}

const lookupByKey = (key) => lookupMap.get(key);
const lookupByIndex = (index) => reverseLookupMap.get(index);

const isObject = (o) =>
  typeof o === 'object' && !Array.isArray(o) && o !== null;

/**
 * Maps the stream action keys of an unpacked metadata object to an integer given
 * by the index position of each key in the STREAM_ACTION_METADATA_KEYS array.
 *
 * The lookup map is used to map each stream action key to an index position key.
 *
 * Returns the stringified form of the packed metadata object.
 *
 * @param {object} metadataObj an unpacked metadata object
 * @returns {string} packedMetadataStr
 */
export const pack = (metadataObj) => {
  const packed = (function _pack(obj) {
    if (!isObject(obj)) return obj;

    return Object.entries(obj).reduce((pkdMetadata, [key, value]) => {
      const pkdKey = lookupByKey(key) || key;
      pkdMetadata[pkdKey] = _pack(value);

      return pkdMetadata;
    }, {});
  })(metadataObj);

  return JSON.stringify(packed);
};

/**
 * Parses a packed metadata string and maps the index keys of the packed metadata
 * object to the stream action keys in the STREAM_ACTION_METADATA_KEYS array.
 *
 * The reverse lookup map is used to map each index key to a stream action key.
 *
 * Returns the parsed form of the packed metadata string.
 *
 * @param {string} metadataStr a packed metadata string
 * @returns {object} unpackedMetadataObj
 */
export const unpack = (metadataStr) => {
  const unpacked = (function _unpack(obj) {
    if (!isObject(obj)) return obj;

    return Object.entries(obj).reduce((unpkdMetadata, [key, value]) => {
      const unpkdKey = lookupByIndex(parseInt(key, 10)) || key;
      unpkdMetadata[unpkdKey] = _unpack(value);

      return unpkdMetadata;
    }, {});
  })(JSON.parse(metadataStr));

  return unpacked;
};
