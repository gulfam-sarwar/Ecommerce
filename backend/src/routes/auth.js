import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db.js';
import { hashToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const SESSION_DAYS = 7;

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO SESSION (user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [userId, hashToken(token), SESSION_DAYS]
  );
  return token;
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res.status(400).json({ error: 'name, email, password and phone are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const [exists] = await pool.query('SELECT 1 FROM USERS WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO USERS (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
      [name, email, hash, phone]
    );
    const token = await createSession(result.insertId);
    res.status(201).json({
      token,
      user: { user_id: result.insertId, name, email, role: 'customer' },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM USERS WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || '', user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = await createSession(user.user_id);
    res.json({
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization.slice(7);
    await pool.query('DELETE FROM SESSION WHERE token_hash = ?', [hashToken(token)]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
