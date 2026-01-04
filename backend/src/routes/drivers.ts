import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// GET /api/drivers - Get all drivers
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT d.*, v.year, v.make, v.model, v.color, v.license_plate, 
             v.vehicle_verified, v.vehicle_verified_at
      FROM drivers d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/drivers/:id - Get single driver by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT d.*, v.year, v.make, v.model, v.color, v.license_plate,
             v.vehicle_verified, v.vehicle_verified_at
      FROM drivers d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// POST /api/drivers - Create new driver
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      `INSERT INTO drivers (email)
       VALUES ($1)
       RETURNING *`,
      [email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// PATCH /api/drivers/:id/verification - Update driver verification status
router.patch('/:id/verification', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      identity_verified,
      background_check_status,
      vehicle_verified
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (identity_verified !== undefined) {
      params.push(identity_verified);
      updates.push(`identity_verified = $${paramCount++}`);
      if (identity_verified) {
        updates.push(`identity_verified_at = NOW()`);
      }
    }
    if (background_check_status !== undefined) {
      params.push(background_check_status);
      updates.push(`background_check_status = $${paramCount++}`);
      if (background_check_status === 'passed') {
        updates.push(`background_check_completed_at = NOW()`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE drivers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating driver verification:', error);
    res.status(500).json({ error: 'Failed to update driver verification' });
  }
});

// POST /api/drivers/:id/vehicle - Create or update vehicle for driver
router.post('/:id/vehicle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { year, make, model, color, license_plate, insurance_expiration_date } = req.body;

    // Check if driver exists
    const driverCheck = await pool.query('SELECT vehicle_id FROM drivers WHERE id = $1', [id]);
    if (driverCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const vehicleId = driverCheck.rows[0].vehicle_id;

    let result;
    if (vehicleId) {
      // Update existing vehicle
      result = await pool.query(
        `UPDATE vehicles 
         SET year = $1, make = $2, model = $3, color = $4, license_plate = $5, insurance_expiration_date = $6
         WHERE id = $7
         RETURNING *`,
        [year, make, model, color, license_plate, insurance_expiration_date, vehicleId]
      );
    } else {
      // Create new vehicle
      const newVehicle = await pool.query(
        `INSERT INTO vehicles (year, make, model, color, license_plate, insurance_expiration_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [year, make, model, color, license_plate, insurance_expiration_date]
      );

      // Link vehicle to driver
      await pool.query(
        'UPDATE drivers SET vehicle_id = $1 WHERE id = $2',
        [newVehicle.rows[0].id, id]
      );

      result = newVehicle;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating/updating vehicle:', error);
    res.status(500).json({ error: 'Failed to create/update vehicle' });
  }
});

export default router;
