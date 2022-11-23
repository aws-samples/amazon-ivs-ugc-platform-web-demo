const { WebSocketServer, WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');

const webSocketTokens = require('./webSocketTokens');

const wss = new WebSocketServer({
  port: process.env.WEB_SOCKET_SERVER_PORT || 8081
});

const protocolSplitChar = '|';

wss.on('connection', (ws) => {
  const [roomName, username] = ws.protocol.split(protocolSplitChar);
  const userData = webSocketTokens[username];

  // Upon receiving a message, send the corresponding action to all connected clients
  ws.on('message', (data) => {
    const { Action, Content, Id, RequestId } = JSON.parse(data);
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
            Reason: 'Deleted by moderator'
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
            Reason: 'Kicked by moderator',
            UserId: Content
          },
          SendTime
        }),
        JSON.stringify({
          Type: 'EVENT',
          Id: uuidv4(),
          RequestId,
          EventName: 'app:DELETE_USER_MESSAGES',
          Attributes: {
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
