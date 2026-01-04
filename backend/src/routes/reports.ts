import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// GET /api/reports - Get all reports (admin only eventually)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/reports - Create new report
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      reporter_type,
      reporter_id,
      reported_type,
      reported_id,
      trip_id,
      reason
    } = req.body;

    const result = await pool.query(
      `INSERT INTO reports (reporter_type, reporter_id, reported_type, reported_id, trip_id, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [reporter_type, reporter_id, reported_type, reported_id, trip_id, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /api/reports/flags - Get admin flags
router.get('/flags', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM admin_flags ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin flags:', error);
    res.status(500).json({ error: 'Failed to fetch admin flags' });
  }
});

// POST /api/reports/flags - Create admin flag
router.post('/flags', async (req: Request, res: Response) => {
  try {
    const { user_type, user_id, note } = req.body;

    const result = await pool.query(
      `INSERT INTO admin_flags (user_type, user_id, note)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_type, user_id, note]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating admin flag:', error);
    res.status(500).json({ error: 'Failed to create admin flag' });
  }
});

export default router;
