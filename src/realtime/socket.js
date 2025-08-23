
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function initSocket(server, jwtSecret) {
  const io = new Server(server, {
    cors: { origin: '*', credentials: true }, 
  });

  io.use((socket, next) => {
    try {
      const header = socket.handshake.headers['authorization'] || socket.handshake.auth?.token || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : header;
      const payload = jwt.verify(token, jwtSecret);
      socket.data.user = { id: payload.sub, role: payload.role };
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    socket.join(`user:${userId}`);
    socket.emit('ready', { message: 'connected' });

    socket.on('disconnect', () => {
      console.log(`[WS] User ${userId} disconnected`);
    });
  });

  return io;
}

module.exports = { initSocket };
