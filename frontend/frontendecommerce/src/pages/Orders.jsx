import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders')
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <h2 className="page-title">My orders</h2>
      {error && <p className="alert alert-error">{error}</p>}
      {orders.length === 0 && <p className="muted">You have not placed any orders yet.</p>}

      {orders.map((order) => (
        <div className="card order-card" key={order.order_id}>
          <div className="order-head">
            <strong>Order #{order.order_id}</strong>
            <span className={`badge badge-${order.status}`}>{order.status}</span>
          </div>

          <p className="muted">{new Date(order.created_at).toLocaleString()}</p>

          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.name} × {item.quantity} — Rs. {Number(item.price).toLocaleString()}
              </li>
            ))}
          </ul>

          <p className="total">Total: Rs. {Number(order.total_amount).toLocaleString()}</p>
        </div>
      ))}
    </>
  );
}
