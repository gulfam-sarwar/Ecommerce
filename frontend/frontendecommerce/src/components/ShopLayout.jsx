
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function ShopLayout() {
  const { user, logout, canAccessAdmin } = useAuth();

  return (
    <>
      <header className="navbar">
        <Link to="/" className="brand">
           CLEANIFY
        </Link>

        <nav className="nav-links">
          <Link to="/">Products</Link>
          <Link to="/cart">Cart</Link>

          {user ? (
            <>
              <Link to="/orders">My Orders</Link>

              {canAccessAdmin && (
                <Link to="/admin" className="nav-admin">
                  Admin Panel
                </Link>
              )}

              <span className="nav-user">Hi, {user.name}</span>
              <button className="btn btn-small btn-outline" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-small">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
