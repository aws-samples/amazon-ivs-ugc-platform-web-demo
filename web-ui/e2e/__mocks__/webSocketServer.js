const { WebSocketServer } = require('ws');

new WebSocketServer({ port: process.env.WEB_SOCKET_SERVER_PORT || 8081 });
