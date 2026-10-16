// Admin only: see all users and change their role.
//
// Roles:
//   customer - can shop
//   staff    - can manage products and orders
//   admin    - can do everything, including managing users

import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../AuthContext.jsx';

const ROLES = ['customer', 'staff', 'admin'];

export default function AdminUsers() {
  const { user: currentUser } = useAuth(); // the admin who is logged in now

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = () => {
    api('/admin/users')
      .then(setUsers)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (userId, role) => {
    setError('');
    setMessage('');
    try {
      await api(`/admin/users/${userId}/role`, { method: 'PUT', body: { role } });
      setMessage('Role updated');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Users</h1>

      {message && <p className="alert alert-success">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>
                  {/* You cannot change your own role */}
                  {u.user_id === currentUser.user_id ? (
                    <span className={`role-tag role-${u.role}`}>{u.role} (you)</span>
                  ) : (
                    <select value={u.role} onChange={(e) => changeRole(u.user_id, e.target.value)}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
