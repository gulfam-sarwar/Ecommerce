
import { Router } from 'express';
import pool from '../db.js';
import { isValidDeviceId } from '../utils/guestCart.js';
import { getGuestUserId } from '../utils/guestUser.js';
import { sendOrderConfirmation } from '../utils/mailer.js';

const router = Router();

router.use((req, res, next) => {
  const deviceId = req.headers['x-device-id'];

  if (!isValidDeviceId(deviceId)) {
    return res.status(400).json({ error: 'Missing or invalid device id' });
  }

  req.deviceId = deviceId; 
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.guest_cart_item_id AS cart_item_id, g.quantity,
              p.product_id, p.name, p.price, p.stock, p.image_url
         FROM GUEST_CART_ITEMS g
         JOIN PRODUCTS p ON p.product_id = g.product_id
        WHERE g.device_id = ?
        ORDER BY g.guest_cart_item_id`,
      [req.deviceId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const quantity = Number(req.body.quantity ?? 1);

    if (!product_id || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'product_id and a positive quantity are required' });
    }

    const [products] = await pool.query('SELECT stock FROM PRODUCTS WHERE product_id = ?', [
      product_id,
    ]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stock = products[0].stock;
    if (stock < 1) {
      return res.status(409).json({ error: 'This product is out of stock' });
    }

    await pool.query(
      `INSERT INTO GUEST_CART_ITEMS (device_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)`,
      [req.deviceId, product_id, Math.min(quantity, stock), stock]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    await pool.query(
      `UPDATE GUEST_CART_ITEMS g
         JOIN PRODUCTS p ON p.product_id = g.product_id
          SET g.quantity = LEAST(?, p.stock)
        WHERE g.guest_cart_item_id = ? AND g.device_id = ?`,
      [quantity, req.params.id, req.deviceId]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM GUEST_CART_ITEMS WHERE guest_cart_item_id = ? AND device_id = ?', [
      req.params.id,
      req.deviceId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const PAYMENT_METHODS = ['cod', 'card', 'bank_transfer'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_LENGTH = {
  name: 100,
  email: 150,
  phone: 20,
  address_line: 255,
  city: 100,
  state: 100,
  country: 100,
  postal_code: 20,
};

router.post('/checkout', async (req, res, next) => {
  const form = {};
  for (const field of Object.keys(MAX_LENGTH)) {
    const value = req.body[field];
    form[field] = typeof value === 'string' ? value.trim() : '';
  }
  const paymentMethod = req.body.payment_method || 'cod';

  if (Object.values(form).some((value) => value === '')) {
    return res.status(400).json({ error: 'Please fill in all the fields' });
  }
  if (!EMAIL_PATTERN.test(form.email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  for (const field of Object.keys(MAX_LENGTH)) {
    if (form[field].length > MAX_LENGTH[field]) {
      return res.status(400).json({ error: `"${field}" is too long` });
    }
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [items] = await conn.query(
      `SELECT g.product_id, g.quantity, p.price, p.stock, p.name
         FROM GUEST_CART_ITEMS g
         JOIN PRODUCTS p ON p.product_id = g.product_id
        WHERE g.device_id = ?
          FOR UPDATE`,
      [req.deviceId]
    );

    if (items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    for (const item of items) {
      if (item.quantity > item.stock) {
        await conn.rollback();
        return res.status(409).json({ error: `Not enough stock for ${item.name}` });
      }
    }

    const guestUserId = await getGuestUserId(conn);

    const [address] = await conn.query(
      `INSERT INTO ADDRESSES (user_id, address_line, city, state, country, postal_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [guestUserId, form.address_line, form.city, form.state, form.country, form.postal_code]
    );

    const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const [order] = await conn.query(
      `INSERT INTO ORDERS (user_id, address_id, total_amount, guest_name, guest_email, guest_phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [guestUserId, address.insertId, total.toFixed(2), form.name, form.email, form.phone]
    );

    for (const item of items) {
      await conn.query(
        'INSERT INTO ORDER_DETAILS (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order.insertId, item.product_id, item.quantity, item.price]
      );
      await conn.query('UPDATE PRODUCTS SET stock = stock - ? WHERE product_id = ?', [
        item.quantity,
        item.product_id,
      ]);
    }

    await conn.query(
      'INSERT INTO PAYMENTS (order_id, user_id, amount, payment_method) VALUES (?, ?, ?, ?)',
      [order.insertId, guestUserId, total.toFixed(2), paymentMethod]
    );

    await conn.query('DELETE FROM GUEST_CART_ITEMS WHERE device_id = ?', [req.deviceId]);

    await conn.commit();

    sendOrderConfirmation({
      to: form.email,
      name: form.name,
      orderId: order.insertId,
      total: total.toFixed(2),
      paymentMethod,
      items,
      address: form,
    });

    res.status(201).json({ order_id: order.insertId, total_amount: total.toFixed(2) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

export default router;
