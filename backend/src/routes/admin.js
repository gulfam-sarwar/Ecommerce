import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ROLES = ['customer', 'staff', 'admin'];

router.get('/stats', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const [[orders]] = await pool.query('SELECT COUNT(*) AS count FROM ORDERS');
    const [[pending]] = await pool.query(
      "SELECT COUNT(*) AS count FROM ORDERS WHERE status = 'pending'"
    );
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS total FROM ORDERS WHERE status <> 'cancelled'"
    );
    const [[products]] = await pool.query('SELECT COUNT(*) AS count FROM PRODUCTS');
    const [[lowStock]] = await pool.query('SELECT COUNT(*) AS count FROM PRODUCTS WHERE stock <= 5');
    const [[customers]] = await pool.query(
      "SELECT COUNT(*) AS count FROM USERS WHERE role = 'customer'"
    );

    const [recentOrders] = await pool.query(
      `SELECT o.order_id, o.total_amount, o.status, o.created_at,
              COALESCE(o.guest_name, u.name) AS customer
         FROM ORDERS o JOIN USERS u ON u.user_id = o.user_id
        ORDER BY o.order_id DESC LIMIT 5`
    );

    res.json({
      totalOrders: orders.count,
      pendingOrders: pending.count,
      revenue: revenue.total,
      totalProducts: products.count,
      lowStockProducts: lowStock.count,
      totalCustomers: customers.count,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.order_id, o.total_amount, o.status, o.created_at,
              COALESCE(o.guest_name, u.name) AS customer,
              COALESCE(o.guest_email, u.email) AS email,
              COALESCE(o.guest_phone, u.phone) AS phone,
              (o.guest_name IS NOT NULL) AS is_guest,
              CONCAT(a.address_line, ', ', a.city, ', ', a.state, ', ', a.country) AS address
         FROM ORDERS o
         JOIN USERS u ON u.user_id = o.user_id
         JOIN ADDRESSES a ON a.address_id = o.address_id
        ORDER BY o.order_id DESC`
    );

    if (orders.length === 0) {
      return res.json([]);
    }

    const [items] = await pool.query(
      `SELECT d.order_id, d.quantity, d.price, p.name
         FROM ORDER_DETAILS d JOIN PRODUCTS p ON p.product_id = d.product_id
        WHERE d.order_id IN (?)`,
      [orders.map((o) => o.order_id)]
    );

    const result = orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.order_id),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put('/orders/:id/status', requireRole('admin', 'staff'), async (req, res, next) => {
  const { status } = req.body;
  const orderId = req.params.id;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT status FROM ORDERS WHERE order_id = ? FOR UPDATE', [
      orderId,
    ]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldStatus = rows[0].status;

    if (oldStatus === 'cancelled') {
      await conn.rollback();
      return res.status(400).json({ error: 'A cancelled order cannot be changed' });
    }

    if (status === 'cancelled') {
      await conn.query(
        `UPDATE PRODUCTS p
           JOIN ORDER_DETAILS d ON d.product_id = p.product_id
            SET p.stock = p.stock + d.quantity
          WHERE d.order_id = ?`,
        [orderId]
      );
      await conn.query("UPDATE PAYMENTS SET status = 'cancelled' WHERE order_id = ?", [orderId]);
    }

    if (status === 'delivered') {
      await conn.query("UPDATE PAYMENTS SET status = 'paid' WHERE order_id = ?", [orderId]);
    }

    await conn.query('UPDATE ORDERS SET status = ? WHERE order_id = ?', [status, orderId]);

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release(); 
  }
});

router.get('/users', requireRole('admin'), async (req, res, next) => {
  try {
    const [users] = await pool.query(
      "SELECT user_id, name, email, phone, role, created_at FROM USERS WHERE role <> 'guest' ORDER BY user_id"
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/role', requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (Number(req.params.id) === req.user.user_id) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    await pool.query('UPDATE USERS SET role = ? WHERE user_id = ?', [role, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;


















