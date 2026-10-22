
export const GUEST_EMAIL = 'guest@system.local';

export async function getGuestUserId(conn) {
  const find = () =>
    conn.query("SELECT user_id FROM USERS WHERE email = ? AND role = 'guest'", [GUEST_EMAIL]);

  let [rows] = await find();
  if (rows.length > 0) return rows[0].user_id;

  await conn.query(
    `INSERT IGNORE INTO USERS (name, email, password_hash, role, phone)
     VALUES ('Guest checkout', ?, '!', 'guest', '-')`,
    [GUEST_EMAIL]
  );

  [rows] = await find();
  if (rows.length === 0) {
    throw new Error('Could not create the guest checkout account');
  }
  return rows[0].user_id;
}
