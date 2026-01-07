import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import tripsRouter from './routes/trips';
import bidsRouter from './routes/bids';
import ridersRouter from './routes/riders';
import driversRouter from './routes/drivers';
import messagesRouter from './routes/messages';
import reportsRouter from './routes/reports';
import pool from './config/database';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Make io instance available to routes
export { io };

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: String(error) });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/bids', bidsRouter);
app.use('/api/riders', ridersRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/reports', reportsRouter);

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.log('❌ WebSocket auth failed: No token provided');
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dryvrhub-dev-secret-change-in-production') as any;
    socket.data.user = decoded;
    console.log(`✓ WebSocket auth success: user ${decoded.id}`);
    next();
  } catch (error) {
    console.log('❌ WebSocket auth failed: Invalid token', error);
    next(new Error('Invalid token'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id} (user: ${socket.data.user.id})`);

  // Join trip room for real-time updates
  socket.on('join-trip', (tripId: string) => {
    socket.join(`trip:${tripId}`);
    console.log(`User ${socket.data.user.id} joined trip room: ${tripId}`);
  });

  // Leave trip room
  socket.on('leave-trip', (tripId: string) => {
    socket.leave(`trip:${tripId}`);
    console.log(`User ${socket.data.user.id} left trip room: ${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log(`✗ Client disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 DryverHub API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready`);
});
