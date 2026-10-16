import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const PAYMENT_METHODS = ['cod', 'card', 'bank_transfer'];

router.post('/checkout', async (req, res, next) => {
  const { address_id, payment_method = 'cod' } = req.body;
  if (!address_id) return res.status(400).json({ error: 'address_id is required' });
  if (!PAYMENT_METHODS.includes(payment_method))
    return res.status(400).json({ error: 'Invalid payment method' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [addr] = await conn.query(
      'SELECT 1 FROM ADDRESSES WHERE address_id = ? AND user_id = ?',
      [address_id, req.user.user_id]
    );
    if (!addr.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Invalid address' });
    }

    const [items] = await conn.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock, p.name
         FROM CART_ITEMS c JOIN PRODUCTS p ON p.product_id = c.product_id
        WHERE c.user_id = ? FOR UPDATE`,
      [req.user.user_id]
    );
    if (!items.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }
    for (const it of items) {
      if (it.quantity > it.stock) {
        await conn.rollback();
        return res.status(409).json({ error: `Not enough stock for ${it.name}` });
      }
    }

    const total = items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
    const [order] = await conn.query(
      'INSERT INTO ORDERS (user_id, address_id, total_amount) VALUES (?, ?, ?)',
      [req.user.user_id, address_id, total.toFixed(2)]
    );

    for (const it of items) {
      await conn.query(
        'INSERT INTO ORDER_DETAILS (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order.insertId, it.product_id, it.quantity, it.price]
      );
      await conn.query('UPDATE PRODUCTS SET stock = stock - ? WHERE product_id = ?', [
        it.quantity,
        it.product_id,
      ]);
    }

    await conn.query(
      'INSERT INTO PAYMENTS (order_id, user_id, amount, payment_method) VALUES (?, ?, ?, ?)',
      [order.insertId, req.user.user_id, total.toFixed(2), payment_method]
    );
    await conn.query('DELETE FROM CART_ITEMS WHERE user_id = ?', [req.user.user_id]);

    await conn.commit();
    res.status(201).json({ order_id: order.insertId, total_amount: total.toFixed(2) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM ORDERS WHERE user_id = ? ORDER BY order_id DESC',
      [req.user.user_id]
    );
    if (!orders.length) return res.json([]);

    const [items] = await pool.query(
      `SELECT d.order_id, d.quantity, d.price, p.name
         FROM ORDER_DETAILS d JOIN PRODUCTS p ON p.product_id = d.product_id
        WHERE d.order_id IN (?)`,
      [orders.map((o) => o.order_id)]
    );
    res.json(orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.order_id) })));
  } catch (err) {
    next(err);
  }
});

export default router;
