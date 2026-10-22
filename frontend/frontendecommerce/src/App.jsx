
import { Routes, Route } from 'react-router-dom';

import RoleRoute from './components/RoleRoute.jsx';
import ShopLayout from './components/ShopLayout.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<ShopLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />

        <Route path="/orders" element={<RoleRoute><Orders /></RoleRoute>} />
      </Route>

      <Route
        path="/admin"
        element={
          <RoleRoute roles={['admin', 'staff']}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />

        <Route
          path="users"
          element={
            <RoleRoute roles={['admin']}>
              <AdminUsers />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  );
}
