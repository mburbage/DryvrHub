import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireRole, requireEmailVerified } from '../middleware/auth';

const router = express.Router();

// GET /api/bids - Get all bids (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { trip_id, driver_id, status } = req.query;
    
    let query = 'SELECT * FROM bids';
    const params: any[] = [];
    
    if (trip_id || driver_id || status) {
      query += ' WHERE';
      const conditions: string[] = [];
      
      if (trip_id) {
        params.push(trip_id);
        conditions.push(` trip_id = $${params.length}`);
      }
      if (driver_id) {
        params.push(driver_id);
        conditions.push(` driver_id = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(` status = $${params.length}`);
      }
      
      query += conditions.join(' AND');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// GET /api/bids/:id - Get single bid by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM bids WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching bid:', error);
    res.status(500).json({ error: 'Failed to fetch bid' });
  }
});

// POST /api/bids - Create new bid
// RULE: Only authenticated, email-verified drivers can bid
// RULE: Verification gates FEATURES, not login
router.post('/', authenticate, requireRole('driver'), requireEmailVerified, async (req: Request, res: Response) => {
  try {
    const { trip_id, bid_amount, message } = req.body;
    
    // Use authenticated driver's ID
    const driver_id = req.user!.id;

    const result = await pool.query(
      `INSERT INTO bids (trip_id, driver_id, bid_amount, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trip_id, driver_id, bid_amount, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

// PATCH /api/bids/:id/status - Update bid status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE bids SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bid status:', error);
    res.status(500).json({ error: 'Failed to update bid status' });
  }
});

// DELETE /api/bids/:id - Delete/withdraw bid
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE bids SET status = 'withdrawn' WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    res.json({ message: 'Bid withdrawn', bid: result.rows[0] });
  } catch (error) {
    console.error('Error withdrawing bid:', error);
    res.status(500).json({ error: 'Failed to withdraw bid' });
  }
});

export default router;
