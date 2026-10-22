
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';

export default function AdminLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="admin">
      <aside className="sidebar">
        <h2 className="sidebar-title"> Admin</h2>
        <p className="sidebar-role">
          {user.name} <span className={`role-tag role-${user.role}`}>{user.role}</span>
        </p>

        <nav className="sidebar-links">
          <NavLink to="/admin" end>
             Dashboard
          </NavLink>
          <NavLink to="/admin/products"> Products</NavLink>
          <NavLink to="/admin/orders"> Orders</NavLink>

          {isAdmin && <NavLink to="/admin/users"> Users</NavLink>}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/">← Back to shop</Link>
          <button className="btn btn-small btn-outline-light" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
