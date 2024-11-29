import {
  getClientOverrideValue,
  setClientOverrideValue,
  unsetClientOverrideValue
} from './ivsClientOverrides';

const DATA_PLANE_ENDPOINT_KEY = 'dataPlaneEndpoint';
const RTX_NODE_ROOT_DOMAIN = 'rtx.live-video.net';
const RTX_NODE_REGEX =
  /^(?:https:\/\/)?([-a-z0-9]+\.[a-z0-9]+)\.rtx\.live-video\.net$/i;

// Force node is only supported for the IVS Real-time beta endpoint
const isForceNodeSupported =
  process.env.IVS_REAL_TIME_SERVICE_NAME === 'ivsrealtime-beta';

function getForceNode() {
  const endpoint = getClientOverrideValue(DATA_PLANE_ENDPOINT_KEY);
  let node = null;

  if (endpoint) {
    const match = RTX_NODE_REGEX.exec(endpoint);
    node = match?.[1] ?? null;
  }

  return node;
}

function setForceNode(node) {
  if (!isForceNodeSupported) {
    return;
  }

  // Data plane endpoint must be the fully qualified public DNS name of the RTX node
  const endpoint = `${node}.${RTX_NODE_ROOT_DOMAIN}`;
  setClientOverrideValue(DATA_PLANE_ENDPOINT_KEY, endpoint);

  return endpoint;
}

function unsetForceNode() {
  unsetClientOverrideValue(DATA_PLANE_ENDPOINT_KEY);
}

export { getForceNode, isForceNodeSupported, setForceNode, unsetForceNode };
