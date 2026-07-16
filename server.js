const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Realtime client connected:', socket.id);

    // Join a shop queue channel
    socket.on('join-shop', (shopId) => {
      socket.join(`shop:${shopId}`);
      console.log(`Socket ${socket.id} joined shop queue room: ${shopId}`);
    });

    // Join an order tracking channel
    socket.on('join-order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order tracking room: ${orderId}`);
    });

    // Join a student private updates channel
    socket.on('join-student', (studentId) => {
      socket.join(`student:${studentId}`);
      console.log(`Socket ${socket.id} joined student updates room: ${studentId}`);
    });

    // Join admin broadcast room
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log(`Socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      console.log('Realtime client disconnected:', socket.id);
    });
  });

  // Attach io to global so Next.js route handlers can broadcast events
  global.io = io;

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Custom Socket.io Next.js Server ready on http://localhost:${PORT}`);
  });
});
