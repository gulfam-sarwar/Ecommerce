
import pool from '../db.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidDeviceId = (id) => typeof id === 'string' && UUID_PATTERN.test(id);

export async function mergeGuestCart(userId, deviceId) {
  if (!isValidDeviceId(deviceId)) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [items] = await conn.query(
      `SELECT g.product_id, g.quantity, p.stock
         FROM GUEST_CART_ITEMS g
         JOIN PRODUCTS p ON p.product_id = g.product_id
        WHERE g.device_id = ?
          FOR UPDATE`,
      [deviceId]
    );

    for (const item of items) {
      if (item.stock < 1) continue;

      await conn.query(
        `INSERT INTO CART_ITEMS (user_id, product_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)`,
        [userId, item.product_id, Math.min(item.quantity, item.stock), item.stock]
      );
    }

    await conn.query('DELETE FROM GUEST_CART_ITEMS WHERE device_id = ?', [deviceId]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('Could not merge guest cart:', err.message);
  } finally {
    conn.release();
  }
}
