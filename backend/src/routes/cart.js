import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.cart_item_id, c.quantity, p.product_id, p.name, p.price, p.stock, p.image_url
         FROM CART_ITEMS c JOIN PRODUCTS p ON p.product_id = c.product_id
        WHERE c.user_id = ? ORDER BY c.cart_item_id`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id || quantity < 1)
      return res.status(400).json({ error: 'product_id and positive quantity required' });

    const [p] = await pool.query('SELECT stock FROM PRODUCTS WHERE product_id = ?', [product_id]);
    if (!p.length) return res.status(404).json({ error: 'Product not found' });

    await pool.query(
      `INSERT INTO CART_ITEMS (user_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)`,
      [req.user.user_id, product_id, quantity, p[0].stock]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const quantity = parseInt(req.body.quantity, 10);
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });
    await pool.query(
      'UPDATE CART_ITEMS SET quantity = ? WHERE cart_item_id = ? AND user_id = ?',
      [quantity, req.params.id, req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM CART_ITEMS WHERE cart_item_id = ? AND user_id = ?', [
      req.params.id,
      req.user.user_id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
