import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tripsRouter from './routes/trips';
import bidsRouter from './routes/bids';
import ridersRouter from './routes/riders';
import driversRouter from './routes/drivers';
import messagesRouter from './routes/messages';
import reportsRouter from './routes/reports';
import pool from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DryverHub API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
