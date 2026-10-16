// This file contains "middleware" - small functions that run BEFORE a route.
// They can stop a request (e.g. "you are not logged in") or let it continue.

import crypto from 'crypto';
import pool from '../db.js';

// Turn the random token into a SHA-256 hash.
// We only store the hash in the database, never the real token.
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// 1) requireAuth: the user must be logged in.
//    The browser sends:  Authorization: Bearer <token>
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find a session that matches the token and has not expired yet
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

    // Save the user on the request so the next functions can use it
    req.user = rows[0];
    next(); // continue to the route
  } catch (err) {
    next(err);
  }
}

// 2) requireRole: the user must have one of the allowed roles.
//    Use it AFTER requireAuth. Example:
//      router.get('/users', requireAuth, requireRole('admin'), handler)
//      router.get('/orders', requireAuth, requireRole('admin', 'staff'), handler)
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' });
    }
    next();
  };
}

// Shortcut kept for convenience: only admins allowed
export const requireAdmin = requireRole('admin');
