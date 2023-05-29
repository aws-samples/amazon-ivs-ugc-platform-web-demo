const { WebSocketServer, WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');

const webSocketTokens = require('./webSocketTokens');

const wss = new WebSocketServer({
  port: process.env.WEB_SOCKET_SERVER_PORT || 8081
});

const protocolSplitChar = '|';

wss.on('connection', (ws) => {
  const [roomName, username] = ws.protocol.split(protocolSplitChar);
  let userData = webSocketTokens[username];

  // Fallback userData
  if (!userData)
    userData = {
      UserId: username,
      Attributes: {
        avatar: 'ibex',
        channelAssetUrls: '{}',
        color: 'yellow',
        displayName: username,
        channelArn: 'channelArn'
      }
    };

  // Upon receiving a message, send the corresponding action to all connected clients
  ws.on('message', (data) => {
    const { Action, Content, Id, Reason, RequestId } = JSON.parse(data);
    const messagesToBroadcast = [];
    const SendTime = new Date().toISOString();

    if (Action === 'SEND_MESSAGE') {
      messagesToBroadcast.push(
        JSON.stringify({
          Type: 'MESSAGE',
          Id: uuidv4(),
          RequestId,
          Attributes: null,
          Content,
          SendTime,
          Sender: userData
        })
      );
    } else if (Action === 'DELETE_MESSAGE') {
      messagesToBroadcast.push(
        JSON.stringify({
          Type: 'EVENT',
          Id: uuidv4(),
          RequestId,
          EventName: 'aws:DELETE_MESSAGE',
          Attributes: {
            MessageID: Id,
            Reason
          },
          SendTime
        })
      );
    } else if (Action === 'BAN_USER') {
      messagesToBroadcast.push(
        JSON.stringify({
          Type: 'EVENT',
          Id: uuidv4(),
          RequestId,
          EventName: 'aws:DISCONNECT_USER',
          Attributes: {
            Reason,
            UserId: Content
          },
          SendTime
        })
      );
    }

    wss.clients.forEach((client) => {
      const [clientRoomName] = client.protocol.split(protocolSplitChar);

      if (client.readyState !== WebSocket.OPEN || roomName !== clientRoomName)
        return;

      messagesToBroadcast.forEach((messageToBroadcast) =>
        client.send(messageToBroadcast)
      );
    });
  });
});
