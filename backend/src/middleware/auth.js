
import crypto from 'crypto';
import pool from '../db.js';

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.role
         FROM SESSION s
         JOIN USERS u ON u.user_id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > NOW()`,
      [hashToken(token)]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Session expired' });
    }

    req.user = rows[0];
    next(); 
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' });
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');
