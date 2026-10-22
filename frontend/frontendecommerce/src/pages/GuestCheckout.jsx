
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address_line: '',
  city: '',
  state: '',
  country: 'Pakistan',
  postal_code: '',
  payment_method: 'cod',
};

function Field({ id, label, className = '', ...inputProps }) {
  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <input id={id} required {...inputProps} />
    </div>
  );
}

export default function GuestCheckout() {
  const navigate = useNavigate();

  const [items, setItems] = useState(null); 
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false); 

  useEffect(() => {
    api('/guest-cart')
      .then(setItems)
      .catch((err) => {
        setItems([]);
        setError(err.message);
      });
  }, []);

  const bind = (field) => ({
    value: form[field],
    onChange: (e) => setForm({ ...form, [field]: e.target.value }),
  });

  const total = (items || []).reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true); 

    try {
      const result = await api('/guest-cart/checkout', { method: 'POST', body: form });

      navigate('/order-success', {
        replace: true,
        state: { orderId: result.order_id, total: result.total_amount, email: form.email },
      });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  };

  if (items === null) {
    return <p className="muted">Loading...</p>;
  }

  if (items.length === 0) {
    return (
      <>
        <h2 className="page-title">Checkout</h2>
        {error && <p className="alert alert-error">{error}</p>}
        <p className="muted">
          Your cart is empty. <Link to="/">Browse products</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="page-title">Checkout</h2>
      {error && <p className="alert alert-error">{error}</p>}

      <div className="two-columns">
        <form className="panel form form-grid" onSubmit={handleSubmit}>
          <h3 className="full">Your details</h3>

          <Field id="gc-name" label="Full name" placeholder="Your name" {...bind('name')} />
          <Field id="gc-phone" label="Phone" placeholder="03001234567" {...bind('phone')} />
          <Field
            id="gc-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            className="full"
            {...bind('email')}
          />

          <h3 className="full">Delivery address</h3>

          <Field
            id="gc-address"
            label="Address"
            placeholder="House, street, area"
            className="full"
            {...bind('address_line')}
          />
          <Field id="gc-city" label="City" {...bind('city')} />
          <Field id="gc-state" label="State / Province" {...bind('state')} />
          <Field id="gc-country" label="Country" {...bind('country')} />
          <Field id="gc-postal" label="Postal code" {...bind('postal_code')} />

          <h3 className="full">Payment method</h3>

          <div className="full">
            <label htmlFor="gc-payment">How will you pay?</label>
            <select id="gc-payment" {...bind('payment_method')}>
              <option value="cod">Cash on delivery</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </div>

          <div className="full button-row">
            <button type="submit" className="btn" disabled={placing}>
              {placing ? 'Placing order...' : 'Place order'}
            </button>
          </div>

          <p className="full muted">
            Already have an account?{' '}
            <Link to="/login" state={{ from: '/checkout' }}>
              Login
            </Link>{' '}
            to see your order history.
          </p>
        </form>

        <div className="card order-card">
          <h3>Order summary</h3>
          <ul>
            {items.map((item) => (
              <li key={item.cart_item_id}>
                {item.name} × {item.quantity} — Rs. {(Number(item.price) * item.quantity).toLocaleString()}
              </li>
            ))}
          </ul>
          <p className="total">Total: Rs. {total.toLocaleString()}</p>
          <Link to="/cart" className="muted">
            ← Change your cart
          </Link>
        </div>
      </div>
    </>
  );
}
