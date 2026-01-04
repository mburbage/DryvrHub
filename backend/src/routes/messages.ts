import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// GET /api/messages - Get messages for a trip
router.get('/', async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.query;
    
    if (!trip_id) {
      return res.status(400).json({ error: 'trip_id is required' });
    }
    
    const result = await pool.query(
      'SELECT * FROM messages WHERE trip_id = $1 ORDER BY created_at ASC',
      [trip_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages - Create new message
router.post('/', async (req: Request, res: Response) => {
  try {
    const { trip_id, sender_type, sender_id, message_text } = req.body;

    const result = await pool.query(
      `INSERT INTO messages (trip_id, sender_type, sender_id, message_text)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trip_id, sender_type, sender_id, message_text]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

export default router;
