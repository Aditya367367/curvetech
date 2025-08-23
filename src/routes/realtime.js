
const express = require('express');
const auth = require('../middlewares/auth');
const { eventBus } = require('../realtime/eventBus');

const router = express.Router();


router.get('/stream', auth, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  const userId = req.user.id;

 
  const ping = setInterval(() => res.write(`: ping\n\n`), 25000);

  const onHeartbeat = (payload) => {
    if (payload.userId === userId) {
      res.write(`event: device:heartbeat\n`);
      res.write(`data: ${JSON.stringify(payload.data)}\n\n`);
    }
  };

  eventBus.on('device:heartbeat', onHeartbeat);

  req.on('close', () => {
    clearInterval(ping);
    eventBus.off('device:heartbeat', onHeartbeat);
  });

  res.write(`event: ready\ndata: {"message":"connected"}\n\n`);
});

module.exports = router;
