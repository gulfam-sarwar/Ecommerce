
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';

import pool from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import guestCartRoutes from './routes/guestCart.js';
import addressRoutes from './routes/addresses.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/guest-cart', guestCartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);

  pool
    .query('DELETE FROM GUEST_CART_ITEMS WHERE created_at < NOW() - INTERVAL 30 DAY')
    .catch((err) => {
      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('\n[DATABASE] MySQL refused the login. Check DB_USER and DB_PASSWORD in backend/.env.');
      } else if (err.code === 'ER_BAD_DB_ERROR') {
        console.error('\n[DATABASE] The database does not exist. Run backend/schema.sql in MySQL Workbench first.');
      } else if (err.code === 'ECONNREFUSED') {
        console.error('\n[DATABASE] Cannot reach MySQL. Is the MySQL server running, and is DB_HOST in backend/.env correct?');
      } else if (err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('\n[DATABASE] The GUEST_CART_ITEMS table is missing. Run backend/migrations/001_guest_cart.sql once.');
      } else {
        console.warn('\n[DATABASE] Guest cart cleanup skipped:', err.message);
      }
    });


  pool
    .query("SHOW COLUMNS FROM ORDERS LIKE 'guest_name'")
    .then(([columns]) => {
      if (columns.length === 0) {
        console.warn(
          '\n[DATABASE] ORDERS is missing the guest_* columns. Run backend/migrations/002_guest_checkout.sql once, ' +
            'otherwise guest checkout and the admin orders page will fail.'
        );
      }
    })
    .catch(() => {
    });
});
