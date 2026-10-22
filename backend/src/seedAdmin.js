// Creates (or upgrades) an admin account so you can log in to the admin panel.
//
// Run it once with:   npm run seed:admin
//
// Login after running:
//   email:    admin@shop.com
//   password: admin123      <- change this after your first login!

import bcrypt from 'bcryptjs';
import pool from './db.js';

const ADMIN_EMAIL = 'admin@shop.com';
const ADMIN_PASSWORD = 'admin123';

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const [existing] = await pool.query('SELECT user_id FROM USERS WHERE email = ?', [ADMIN_EMAIL]);

  if (existing.length > 0) {
    await pool.query("UPDATE USERS SET role = 'admin', password_hash = ? WHERE email = ?", [
      hash,
      ADMIN_EMAIL,
    ]);
    console.log('Existing user updated to admin.');
  } else {
    await pool.query(
      "INSERT INTO USERS (name, email, password_hash, role, phone) VALUES ('Admin', ?, ?, 'admin', '0000000000')",
      [ADMIN_EMAIL, hash]
    );
    console.log('Admin user created.');
  }

  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Could not create admin:', err.message);
  process.exit(1);
});
