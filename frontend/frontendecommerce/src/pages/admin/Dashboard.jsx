
import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null); 
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!stats) return <p className="muted">Loading...</p>;

  const cards = [
    { label: 'Revenue', value: `Rs. ${Number(stats.revenue).toLocaleString()}`},
    { label: 'Total orders', value: stats.totalOrders },
    { label: 'Pending orders', value: stats.pendingOrders },
    { label: 'Products', value: stats.totalProducts },
    { label: 'Low stock (5 or less)', value: stats.lowStockProducts },
    { label: 'Customers', value: stats.totalCustomers },
  ];

  return (
    <>
      <h1 className="page-title">Dashboard</h1>

      <div className="stat-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
          </div>
        ))}
      </div>

      <h2>Recent orders</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.length === 0 && (
              <tr>
                <td colSpan="5" className="muted">
                  No orders yet.
                </td>
              </tr>
            )}
            {stats.recentOrders.map((order) => (
              <tr key={order.order_id}>
                <td>#{order.order_id}</td>
                <td>{order.customer}</td>
                <td>Rs. {Number(order.total_amount).toLocaleString()}</td>
                <td>
                  <span className={`badge badge`}>{order.status}</span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
