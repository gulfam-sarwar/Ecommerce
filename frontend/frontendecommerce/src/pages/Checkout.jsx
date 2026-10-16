import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const emptyAddress = {
  address_line: '',
  city: '',
  state: '',
  country: 'Pakistan',
  postal_code: '',
};

export default function Checkout() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(''); 
  const [method, setMethod] = useState('cod'); 
  const [form, setForm] = useState(emptyAddress);
  const [error, setError] = useState('');

  const loadAddresses = async () => {
    const list = await api('/addresses');
    setAddresses(list);

    if (list.length > 0 && !addressId) {
      setAddressId(String(list[0].address_id));
    }
  };

  useEffect(() => {
    loadAddresses().catch((err) => setError(err.message));
  }, []); 

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const saveAddress = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await api('/addresses', { method: 'POST', body: form });
      setForm(emptyAddress);
      setAddressId(String(result.address_id)); 
      await loadAddresses();
    } catch (err) {
      setError(err.message);
    }
  };

  const placeOrder = async () => {
    setError('');
    try {
      await api('/orders/checkout', {
        method: 'POST',
        body: { address_id: Number(addressId), payment_method: method },
      });
      navigate('/orders'); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h2 className="page-title">Checkout</h2>
      {error && <p className="alert alert-error">{error}</p>}

      <div className="two-columns">
        <div className="panel">
          <h3>Delivery address</h3>

          {addresses.length === 0 && <p className="muted">You have no saved address yet. Add one below.</p>}

          {addresses.map((address) => (
            <label className="radio" key={address.address_id}>
              <input
                type="radio"
                name="address"
                value={address.address_id}
                checked={String(address.address_id) === addressId}
                onChange={(e) => setAddressId(e.target.value)}
              />
              {address.address_line}, {address.city}, {address.state}, {address.country}{' '}
              {address.postal_code}
            </label>
          ))}

          <h3>Payment method</h3>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cod">Cash on delivery</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank transfer</option>
          </select>

          <p>
            <button className="btn" disabled={!addressId} onClick={placeOrder}>
              Place order
            </button>
          </p>
        </div>

        <form className="panel form" onSubmit={saveAddress}>
          <h3>Add a new address</h3>
          <input placeholder="Address line" required value={form.address_line} onChange={handleChange('address_line')} />
          <input placeholder="City" required value={form.city} onChange={handleChange('city')} />
          <input placeholder="State / Province" required value={form.state} onChange={handleChange('state')} />
          <input placeholder="Country" required value={form.country} onChange={handleChange('country')} />
          <input placeholder="Postal code" required value={form.postal_code} onChange={handleChange('postal_code')} />
          <button type="submit" className="btn btn-outline">
            Save address
          </button>
        </form>
      </div>
    </>
  );
}
