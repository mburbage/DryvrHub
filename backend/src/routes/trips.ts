import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// GET /api/trips - Get all trips (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, rider_id } = req.query;
    
    let query = 'SELECT * FROM trips';
    const params: any[] = [];
    
    if (status || rider_id) {
      query += ' WHERE';
      if (status) {
        params.push(status);
        query += ` status = $${params.length}`;
      }
      if (rider_id) {
        if (params.length > 0) query += ' AND';
        params.push(rider_id);
        query += ` rider_id = $${params.length}`;
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/open - Get all open trips
router.get('/open', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE status = 'open' AND expires_at > NOW() ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching open trips:', error);
    res.status(500).json({ error: 'Failed to fetch open trips' });
  }
});

// GET /api/trips/:id - Get single trip by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// POST /api/trips - Create new trip
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      rider_id,
      pickup_address,
      dropoff_address,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      estimated_distance_miles,
      estimated_duration_minutes,
      scheduled_pickup_time,
      notes,
    } = req.body;

    // Default expiry: 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const result = await pool.query(
      `INSERT INTO trips (
        rider_id, pickup_address, dropoff_address,
        pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        estimated_distance_miles, estimated_duration_minutes,
        scheduled_pickup_time, notes, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        rider_id, pickup_address, dropoff_address,
        pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        estimated_distance_miles, estimated_duration_minutes,
        scheduled_pickup_time, notes, expiresAt
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// PATCH /api/trips/:id/status - Update trip status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE trips SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

// DELETE /api/trips/:id - Delete/cancel trip
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE trips SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip cancelled', trip: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling trip:', error);
    res.status(500).json({ error: 'Failed to cancel trip' });
  }
});

export default router;
