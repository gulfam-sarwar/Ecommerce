import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const loadCart = () => {
    api('/cart')
      .then(setItems)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const changeQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    await api(`/cart/${cartItemId}`, { method: 'PUT', body: { quantity: newQuantity } });
    loadCart();
  };

  const removeItem = async (cartItemId) => {
    await api(`/cart/${cartItemId}`, { method: 'DELETE' });
    loadCart();
  };

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <>
      <h2 className="page-title">Your cart</h2>
      {error && <p className="alert alert-error">{error}</p>}

      {items.length === 0 ? (
        <p className="muted">
          Your cart is empty. <Link to="/">Browse products</Link>
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.cart_item_id}>
                    <td>{item.name}</td>
                    <td>Rs. {Number(item.price).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => changeQuantity(item.cart_item_id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty">{item.quantity}</span>
                      <button
                        className="btn btn-small btn-outline"
                        disabled={item.quantity >= item.stock}
                        onClick={() => changeQuantity(item.cart_item_id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </td>
                    <td>Rs. {(Number(item.price) * item.quantity).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => removeItem(item.cart_item_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-footer">
            <p className="total">Total: Rs. {total.toLocaleString()}</p>
            <Link to="/checkout" className="btn">
              Proceed to checkout
            </Link>
          </div>
        </>
      )}
    </>
  );
}
