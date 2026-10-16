import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ADDRESSES WHERE user_id = ?', [req.user.user_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { address_line, city, state, country, postal_code } = req.body;
    if (!address_line || !city || !state || !country || !postal_code)
      return res.status(400).json({ error: 'All address fields are required' });
    const [r] = await pool.query(
      `INSERT INTO ADDRESSES (user_id, address_line, city, state, country, postal_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, address_line, city, state, country, postal_code]
    );
    res.status(201).json({ address_id: r.insertId });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM ADDRESSES WHERE address_id = ? AND user_id = ?', [
      req.params.id,
      req.user.user_id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
