
import { Link, Navigate, useLocation } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  const order = location.state;

  if (!order || !order.orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-box">
      <h2> Order placed!</h2>
      <p className="muted">Thank you for shopping with us.</p>

      <p>
        Your order number is <strong>#{order.orderId}</strong>.
      </p>
      <p>
        Total: <strong>Rs. {Number(order.total).toLocaleString()}</strong>
      </p>
      <p className="muted">
        We will contact you on {order.email} if we need anything. Please keep your order number
        to ask about your order.
      </p>

      <Link to="/" className="btn">
        Continue shopping
      </Link>
    </div>
  );
}
