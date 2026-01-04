import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// GET /api/riders - Get all riders
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM riders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching riders:', error);
    res.status(500).json({ error: 'Failed to fetch riders' });
  }
});

// GET /api/riders/:id - Get single rider by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM riders WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching rider:', error);
    res.status(500).json({ error: 'Failed to fetch rider' });
  }
});

// POST /api/riders - Create new rider
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, email_verified, phone_verified } = req.body;

    const result = await pool.query(
      `INSERT INTO riders (email, email_verified, phone_verified)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, email_verified || false, phone_verified || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating rider:', error);
    res.status(500).json({ error: 'Failed to create rider' });
  }
});

// PATCH /api/riders/:id - Update rider
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, email_verified, phone_verified } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (email !== undefined) {
      params.push(email);
      updates.push(`email = $${paramCount++}`);
    }
    if (email_verified !== undefined) {
      params.push(email_verified);
      updates.push(`email_verified = $${paramCount++}`);
    }
    if (phone_verified !== undefined) {
      params.push(phone_verified);
      updates.push(`phone_verified = $${paramCount++}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE riders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating rider:', error);
    res.status(500).json({ error: 'Failed to update rider' });
  }
});

export default router;
