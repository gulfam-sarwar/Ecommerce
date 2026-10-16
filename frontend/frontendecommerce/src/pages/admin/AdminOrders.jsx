
import { useEffect, useState } from 'react';
import { api } from '../../api.js';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadOrders = () => {
    api('/admin/orders')
      .then(setOrders)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const changeStatus = async (orderId, status) => {
    setError('');
    setMessage('');

    if (status === 'cancelled' && !window.confirm('Cancel this order? This cannot be undone.')) {
      return;
    }

    try {
      await api(`/admin/orders/${orderId}/status`, { method: 'PUT', body: { status } });
      setMessage(`Order #${orderId} is now "${status}"`);
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Orders</h1>

      {message && <p className="alert alert-success">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}
      {orders.length === 0 && <p className="muted">No orders yet.</p>}

      {orders.map((order) => (
        <div className="card order-card" key={order.order_id}>
          <div className="order-head">
            <strong>Order #{order.order_id}</strong>
            <span className={`badge badge-${order.status}`}>{order.status}</span>
          </div>

          <p>
            <strong>{order.customer}</strong> · {order.email} · {order.phone}
          </p>
          <p className="muted">📍 {order.address}</p>
          <p className="muted">{new Date(order.created_at).toLocaleString()}</p>

          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.name} × {item.quantity} — Rs. {Number(item.price).toLocaleString()}
              </li>
            ))}
          </ul>

          <div className="order-foot">
            <p className="total">Total: Rs. {Number(order.total_amount).toLocaleString()}</p>

            {order.status === 'cancelled' ? (
              <span className="muted">Cancelled orders cannot be changed</span>
            ) : (
              <select value={order.status} onChange={(e) => changeStatus(order.order_id, e.target.value)}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
