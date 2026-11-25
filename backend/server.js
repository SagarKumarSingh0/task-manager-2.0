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
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
});

// Make io available to controllers via req.app.get('io')
app.set('io', io);

/* ========== MIDDLEWARE ========== */
app.use(cors());
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
  server.listen(PORT, () => console.log(`🚀 TaskFlow API on http://localhost:${PORT}`));
});