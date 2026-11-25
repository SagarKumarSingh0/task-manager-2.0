require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const socketHandler = require('./sockets/socketHandler');

/* ========== APP ========== */
const app = express();
const server = http.createServer(app);

// Allowed origins list (Frontend links)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://task-manager-20-frontend.vercel.app' // Tumhara Vercel link
];

const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Make io available to controllers via req.app.get('io')
app.set('io', io);

/* ========== MIDDLEWARE ========== */
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* ========== ROUTES ========== */
app.get('/', (req, res) => res.json({ ok: true, service: 'TaskFlow API', version: '2.0' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/team', require('./routes/team'));

/* ========== 404 + ERROR ========== */
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

/* ========== SOCKETS ========== */
socketHandler(io);

/* ========== BOOT ========== */
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`🚀 TaskFlow API on port ${PORT}`));
});
