import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireRole, requireEmailVerified } from '../middleware/auth';

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
// RULE: Only authenticated riders can post trips
router.post('/', authenticate, requireRole('rider'), async (req: Request, res: Response) => {
  try {
    const {
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

    // Use authenticated rider's ID
    const rider_id = req.user!.id;

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

// GET /api/trips/:id/bids - Get all bids for a trip (rider only)
// RULE: Order by created_at ASC (oldest first) - neutral, predictable ordering
// RULE: Return ALL bids - no filtering, no ranking, no recommendations
router.get('/:id/bids', authenticate, requireRole('rider'), async (req: Request, res: Response) => {
  try {
    const { id: tripId } = req.params;
    const riderId = req.user!.id;

    // Verify rider owns this trip
    const tripResult = await pool.query(
      'SELECT rider_id FROM trips WHERE id = $1',
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (tripResult.rows[0].rider_id !== riderId) {
      return res.status(403).json({ error: 'Not authorized to view bids for this trip' });
    }

    // Get all bids with minimal driver context (neutral only)
    // RULE: Order by created_at ASC (oldest first, neutral)
    const bidsResult = await pool.query(
      `SELECT 
        b.id,
        b.driver_id,
        b.bid_amount,
        b.message,
        b.status,
        b.created_at,
        d.email as driver_email,
        d.created_at as driver_account_created_at,
        d.identity_verified,
        d.background_check_status,
        (SELECT COUNT(*) FROM trips t2 
         JOIN bids b2 ON t2.id = b2.trip_id 
         WHERE b2.driver_id = d.id AND b2.status = 'accepted' AND t2.status = 'accepted') as completed_trip_count,
        (SELECT COUNT(*) FROM vehicles v WHERE v.driver_id = d.id AND v.vehicle_verified = true) > 0 as vehicle_verified
       FROM bids b
       JOIN drivers d ON b.driver_id = d.id
       WHERE b.trip_id = $1
       ORDER BY b.created_at ASC`,
      [tripId]
    );

    // Return ALL bids with neutral data only
    const bids = bidsResult.rows.map(row => ({
      id: row.id,
      driver_id: row.driver_id,
      bid_amount: row.bid_amount,
      message: row.message,
      status: row.status,
      created_at: row.created_at,
      // Neutral driver context (no scores, no rankings)
      driver_context: {
        account_age_days: Math.floor((Date.now() - new Date(row.driver_account_created_at).getTime()) / (1000 * 60 * 60 * 24)),
        completed_trip_count: parseInt(row.completed_trip_count),
        identity_verified: row.identity_verified,
        background_check_completed: row.background_check_status === 'passed',
        vehicle_verified: row.vehicle_verified,
      }
    }));

    res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// POST /api/trips/:id/accept-bid - Accept a bid for a trip (rider only)
// RULE: Explicit acceptance, no auto-accept, no recommendations
router.post('/:id/accept-bid', authenticate, requireRole('rider'), async (req: Request, res: Response) => {
  try {
    const { id: tripId } = req.params;
    const { bid_id } = req.body;
    const riderId = req.user!.id;

    if (!bid_id) {
      return res.status(400).json({ error: 'bid_id is required' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify rider owns this trip
      const tripResult = await client.query(
        'SELECT rider_id, status FROM trips WHERE id = $1 FOR UPDATE',
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Trip not found' });
      }

      if (tripResult.rows[0].rider_id !== riderId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Not authorized to accept bids for this trip' });
      }

      if (tripResult.rows[0].status !== 'open') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Trip is not open for bidding' });
      }

      // Verify bid belongs to this trip
      const bidResult = await client.query(
        'SELECT trip_id, status FROM bids WHERE id = $1 FOR UPDATE',
        [bid_id]
      );

      if (bidResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Bid not found' });
      }

      if (bidResult.rows[0].trip_id !== tripId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bid does not belong to this trip' });
      }

      if (bidResult.rows[0].status !== 'submitted') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bid is no longer available' });
      }

      // Accept the selected bid
      await client.query(
        "UPDATE bids SET status = 'accepted' WHERE id = $1",
        [bid_id]
      );

      // Reject all other bids for this trip
      await client.query(
        "UPDATE bids SET status = 'rejected' WHERE trip_id = $1 AND id != $2 AND status = 'submitted'",
        [tripId, bid_id]
      );

      // Update trip status to accepted
      await client.query(
        "UPDATE trips SET status = 'accepted' WHERE id = $1",
        [tripId]
      );

      await client.query('COMMIT');

      res.json({ 
        message: 'Bid accepted successfully',
        trip_id: tripId,
        bid_id: bid_id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

export default router;
