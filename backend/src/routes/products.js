
import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const canManageProducts = [requireAuth, requireRole('admin', 'staff')];

router.get('/', async (req, res, next) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTS WHERE name LIKE ? ORDER BY product_id DESC',
      [search]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM PRODUCTS WHERE product_id = ?', [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', canManageProducts, async (req, res, next) => {
  try {
    const { name, description, price, stock, image_url } = req.body;

    if (!name || price === undefined || price === '') {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO PRODUCTS (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', price, stock || 0, image_url || null]
    );
    res.status(201).json({ product_id: result.insertId });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', canManageProducts, async (req, res, next) => {
  try {
    const { name, description, price, stock, image_url } = req.body;

    if (!name || price === undefined || price === '') {
      return res.status(400).json({ error: 'name and price are required' });
    }

    await pool.query(
      `UPDATE PRODUCTS
          SET name = ?, description = ?, price = ?, stock = ?, image_url = ?
        WHERE product_id = ?`,
      [name, description || '', price, stock || 0, image_url || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM PRODUCTS WHERE product_id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res
        .status(409)
        .json({ error: 'This product is part of an order, so it cannot be deleted. Set its stock to 0 instead.' });
    }
    next(err);
  }
});

export default router;
