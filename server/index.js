const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Ensure database tables are created & seeded
require('./db');

const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// Setup Socket.io for Real-Time Live Order Dashboard updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Attach io instance to express app so routes can broadcast events
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming API calls
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'CampusBite Canteen Pre-order & Queue Management API',
    timestamp: new Date().toISOString()
  });
});

// Serve compiled frontend in production if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Socket.io connection listener
io.on('connection', (socket) => {
  console.log(`⚡ WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Schedule periodic auto-cleanup of orders older than 1 month (30 days)
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(() => {
  const db = require('./db');
  if (typeof db.cleanupOldOrders === 'function') {
    db.cleanupOldOrders(30);
  }
}, TWENTY_FOUR_HOURS);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CampusBite Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for real-time order updates`);
  console.log(`🍔 Database: SQLite (better-sqlite3)`);
  console.log(`🧹 Auto Data Purge: Orders older than 1 month deleted`);
  console.log(`====================================================`);
});
