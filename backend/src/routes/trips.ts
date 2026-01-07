import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireRole, requireEmailVerified } from '../middleware/auth';
import { generatePickupCode, hashPickupCode, verifyPickupCode } from '../utils/pickupCode';
import { io } from '../index';

const router = express.Router();

// GET /api/trips - Get all trips (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, rider_id } = req.query;
    
    let query = `
      SELECT 
        t.*,
        COUNT(b.id) as bid_count
      FROM trips t
      LEFT JOIN bids b ON t.id = b.trip_id
    `;
    const params: any[] = [];
    
    if (status || rider_id) {
      query += ' WHERE';
      if (status) {
        params.push(status);
        query += ` t.status = $${params.length}`;
      }
      if (rider_id) {
        if (params.length > 0) query += ' AND';
        params.push(rider_id);
        query += ` t.rider_id = $${params.length}`;
      }
    }
    
    query += ' GROUP BY t.id ORDER BY t.created_at DESC';
    
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
      const bidCheckResult = await client.query(
        'SELECT trip_id, status FROM bids WHERE id = $1 FOR UPDATE',
        [bid_id]
      );

      if (bidCheckResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Bid not found' });
      }

      if (bidCheckResult.rows[0].trip_id !== tripId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bid does not belong to this trip' });
      }

      if (bidCheckResult.rows[0].status !== 'submitted') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bid is no longer available' });
      }

      // Accept the selected bid
      const bidResult = await client.query(
        "UPDATE bids SET status = 'accepted' WHERE id = $1 RETURNING bid_amount",
        [bid_id]
      );

      const finalAmount = bidResult.rows[0]?.bid_amount;

      // Reject all other bids for this trip
      await client.query(
        "UPDATE bids SET status = 'rejected' WHERE trip_id = $1 AND id != $2 AND status = 'submitted'",
        [tripId, bid_id]
      );

      // Generate pickup code for trip verification
      const pickupCode = generatePickupCode();
      const codeHash = hashPickupCode(pickupCode);

      // Update trip to accepted status (driver accepted, ready for pickup)
      // Store both plain code (for rider display) and hash (for driver verification)
      await client.query(
        "UPDATE trips SET status = 'accepted', pickup_code = $2, pickup_code_hash = $3, final_amount = $4 WHERE id = $1",
        [tripId, pickupCode, codeHash, finalAmount]
      );

      await client.query('COMMIT');

      res.json({ 
        message: 'Bid accepted - driver will head to pickup location',
        trip_id: tripId,
        bid_id: bid_id,
        pickup_code: pickupCode,
        status: 'accepted',
        final_amount: finalAmount
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

// POST /api/trips/:id/cancel - Cancel a trip (rider or driver)
// RULE: Riders can cancel their own trips
// RULE: Drivers can cancel trips they've accepted
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: tripId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { reason } = req.body; // Optional cancellation reason

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get trip details
      const tripResult = await client.query(
        'SELECT * FROM trips WHERE id = $1 FOR UPDATE',
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = tripResult.rows[0];

      // Verify authorization based on role
      if (userRole === 'rider') {
        // Rider must own the trip
        if (trip.rider_id !== userId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to cancel this trip' });
        }
      } else if (userRole === 'driver') {
        // Driver must have an accepted bid for this trip
        const acceptedBidResult = await client.query(
          'SELECT id FROM bids WHERE trip_id = $1 AND driver_id = $2 AND status = $3',
          [tripId, userId, 'accepted']
        );

        if (acceptedBidResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to cancel this trip' });
        }
      } else {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Invalid user role' });
      }

      // Check if trip can be cancelled
      if (trip.status === 'cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Trip is already cancelled' });
      }

      if (trip.status === 'paid') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot cancel a completed trip' });
      }

      if (trip.status === 'in_progress') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot cancel a trip that is in progress' });
      }

      // Cancel the trip
      await client.query(
        "UPDATE trips SET status = 'cancelled' WHERE id = $1",
        [tripId]
      );

      // If trip was accepted, update the accepted bid status to withdrawn
      if (trip.status === 'accepted') {
        await client.query(
          "UPDATE bids SET status = 'withdrawn' WHERE trip_id = $1 AND status = 'accepted'",
          [tripId]
        );
      }

      // Log cancellation reason if provided
      if (reason) {
        // TODO: Store cancellation reason in a cancellations table
        console.log(`Trip ${tripId} cancelled by ${userRole} ${userId}: ${reason}`);
      }

      await client.query('COMMIT');

      res.json({ 
        message: 'Trip cancelled successfully',
        trip_id: tripId,
        cancelled_by: userRole
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error cancelling trip:', error);
    res.status(500).json({ error: 'Failed to cancel trip', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/trips/:id/start-en-route - Driver marks they are en route to pickup
router.post('/:id/start-en-route', authenticate, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify driver has an accepted bid for this trip
      const bidCheck = await client.query(
        `SELECT b.id FROM bids b 
         JOIN trips t ON t.id = b.trip_id
         WHERE b.trip_id = $1 AND b.driver_id = $2 AND b.status = 'accepted' AND t.status = 'accepted'
         FOR UPDATE`,
        [tripId, driverId]
      );

      if (bidCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'You do not have an accepted bid for this trip or trip is not in accepted state' });
      }

      // Update trip status to en_route
      const enRouteResult = await client.query(
        "UPDATE trips SET status = 'en_route', en_route_at = NOW() WHERE id = $1 RETURNING *",
        [tripId]
      );

      await client.query('COMMIT');

      // Emit WebSocket event
      io.to(`trip:${tripId}`).emit('trip-updated', enRouteResult.rows[0]);

      res.json({ 
        message: 'Trip status updated to en route',
        trip_id: tripId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating trip to en route:', error);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

// POST /api/trips/:id/arrived - Driver marks they have arrived at pickup location
router.post('/:id/arrived', authenticate, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify driver has an accepted bid and trip is en_route
      const bidCheck = await client.query(
        `SELECT b.id FROM bids b 
         JOIN trips t ON t.id = b.trip_id
         WHERE b.trip_id = $1 AND b.driver_id = $2 AND b.status = 'accepted' AND t.status = 'en_route'
         FOR UPDATE`,
        [tripId, driverId]
      );

      if (bidCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'You do not have an accepted bid for this trip or trip is not in en_route state' });
      }

      // Update trip status to arrived
      const arrivedResult = await client.query(
        "UPDATE trips SET status = 'arrived', arrived_at = NOW() WHERE id = $1 RETURNING *",
        [tripId]
      );

      await client.query('COMMIT');

      // Emit WebSocket event
      io.to(`trip:${tripId}`).emit('trip-updated', arrivedResult.rows[0]);

      res.json({ 
        message: 'Trip status updated to arrived',
        trip_id: tripId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating trip to arrived:', error);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

// POST /api/trips/:id/verify-pickup - Verify pickup code (doesn't change state, just validates)
router.post('/:id/verify-pickup', authenticate, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const { pickup_code } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!pickup_code) {
      return res.status(400).json({ error: 'Pickup code is required' });
    }

    // Verify driver has an accepted bid for this trip
    const bidCheck = await pool.query(
      `SELECT b.id FROM bids b 
       JOIN trips t ON t.id = b.trip_id
       WHERE b.trip_id = $1 AND b.driver_id = $2 AND b.status = 'accepted'`,
      [tripId, driverId]
    );

    if (bidCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have an accepted bid for this trip' });
    }

    // Get pickup code hash from trip
    const tripResult = await pool.query(
      'SELECT pickup_code_hash FROM trips WHERE id = $1',
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { pickup_code_hash } = tripResult.rows[0];

    if (!pickup_code_hash) {
      return res.status(400).json({ error: 'No pickup code set for this trip' });
    }

    // Verify the code
    const isValid = verifyPickupCode(pickup_code, pickup_code_hash);

    res.json({ 
      valid: isValid,
      message: isValid ? 'Pickup code is valid' : 'Pickup code is invalid'
    });
  } catch (error) {
    console.error('Error verifying pickup code:', error);
    res.status(500).json({ error: 'Failed to verify pickup code' });
  }
});

// POST /api/trips/:id/start-trip - Start trip after verifying pickup code
router.post('/:id/start-trip', authenticate, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const { pickup_code } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!pickup_code) {
      return res.status(400).json({ error: 'Pickup code is required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify driver has an accepted bid and trip is arrived
      const tripCheck = await client.query(
        `SELECT t.id, t.pickup_code_hash FROM trips t 
         JOIN bids b ON b.trip_id = t.id
         WHERE t.id = $1 AND b.driver_id = $2 AND b.status = 'accepted' AND t.status = 'arrived'
         FOR UPDATE`,
        [tripId, driverId]
      );

      if (tripCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'You do not have an accepted bid for this trip or trip is not in arrived state' });
      }

      const { pickup_code_hash } = tripCheck.rows[0];

      if (!pickup_code_hash) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No pickup code set for this trip' });
      }

      // Verify the pickup code
      const isValid = verifyPickupCode(pickup_code, pickup_code_hash);
      
      console.log('🔐 Pickup code verification:');
      console.log('  - Received code:', pickup_code);
      console.log('  - Code length:', pickup_code.length);
      console.log('  - Stored hash:', pickup_code_hash);
      console.log('  - Is valid:', isValid);

      if (!isValid) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid pickup code' });
      }

      // Update trip status to code_verified (driver verified, awaiting rider payment confirmation)
      const codeVerifiedResult = await client.query(
        "UPDATE trips SET status = 'code_verified', pickup_at = NOW() WHERE id = $1 RETURNING *",
        [tripId]
      );

      await client.query('COMMIT');

      // Emit WebSocket event
      io.to(`trip:${tripId}`).emit('trip-updated', codeVerifiedResult.rows[0]);

      res.json({ 
        message: 'Pickup code verified - awaiting rider payment confirmation',
        trip_id: tripId,
        status: 'code_verified'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

// POST /api/trips/:id/complete - Driver marks trip as complete
router.post('/:id/complete', authenticate, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify driver has an accepted bid and trip is in_progress
      const bidCheck = await client.query(
        `SELECT b.id FROM bids b 
         JOIN trips t ON t.id = b.trip_id
         WHERE b.trip_id = $1 AND b.driver_id = $2 AND b.status = 'accepted' AND t.status = 'in_progress'
         FOR UPDATE`,
        [tripId, driverId]
      );

      if (bidCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'You do not have an accepted bid for this trip or trip is not in progress' });
      }

      // Update trip status to completed (driver finished, awaiting rider confirmation)
      const completedResult = await client.query(
        "UPDATE trips SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *",
        [tripId]
      );

      await client.query('COMMIT');

      // Emit WebSocket event
      io.to(`trip:${tripId}`).emit('trip-updated', completedResult.rows[0]);

      res.json({ 
        message: 'Trip marked as completed - awaiting rider verification',
        trip_id: tripId,
        status: 'completed'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error completing trip:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

// POST /api/trips/:id/confirm-completion - Rider confirms trip was completed successfully
// RULE: Only the rider who owns the trip can confirm completion
// RULE: Trip must be in 'completed' status (driver has finished)
router.post('/:id/confirm-completion', authenticate, requireRole('rider'), async (req: Request, res: Response) => {
  try {
    const { id: tripId } = req.params;
    const riderId = req.user!.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get trip and verify rider owns it
      const tripResult = await client.query(
        `SELECT * FROM trips WHERE id = $1 FOR UPDATE`,
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = tripResult.rows[0];

      // Verify rider owns the trip
      if (trip.rider_id !== riderId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Not authorized to confirm completion for this trip' });
      }

      // Verify trip is in completed state (driver finished)
      if (trip.status !== 'completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Cannot confirm completion from status: ${trip.status}`,
          message: 'Trip must be completed by driver first'
        });
      }

      // Update trip to rider_confirmed status (rider verified, final status)
      const confirmedResult = await client.query(
        "UPDATE trips SET status = 'rider_confirmed', rider_confirmed_at = NOW() WHERE id = $1 RETURNING *",
        [tripId]
      );

      await client.query('COMMIT');

      // Emit WebSocket event
      io.to(`trip:${tripId}`).emit('trip-updated', confirmedResult.rows[0]);

      res.json({ 
        message: 'Trip completion confirmed - trip finalized',
        trip_id: tripId,
        status: 'rider_confirmed'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error confirming trip completion:', error);
    res.status(500).json({ error: 'Failed to confirm trip completion' });
  }
});

// POST /api/trips/:id/confirm-payment - Rider confirms payment was made
router.post('/:id/confirm-payment', authenticate, requireRole('rider'), async (req: Request, res: Response) => {
  try {
    const { id: tripId } = req.params;
    const riderId = req.user!.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get trip and verify rider owns it
      const tripResult = await client.query(
        `SELECT * FROM trips WHERE id = $1 FOR UPDATE`,
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = tripResult.rows[0];

      // Verify rider owns the trip
      if (trip.rider_id !== riderId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Not authorized to confirm payment for this trip' });
      }

      // Verify trip is in code_verified state (driver verified pickup, awaiting payment)
      if (trip.status !== 'code_verified') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Cannot confirm payment from status: ${trip.status}`,
          message: 'Driver must verify pickup code first'
        });
      }

      // Update trip to in_progress (payment confirmed, trip starting)
      const inProgressResult = await client.query(
        "UPDATE trips SET status = 'in_progress', paid_at = NOW() WHERE id = $1 RETURNING *",
        [tripId]
      );

      await client.query('COMMIT');

      // Emit WebSocket event
      io.to(`trip:${tripId}`).emit('trip-updated', inProgressResult.rows[0]);

      res.json({ 
        message: 'Payment confirmed - trip in progress',
        trip_id: tripId,
        status: 'in_progress'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

export default router;
