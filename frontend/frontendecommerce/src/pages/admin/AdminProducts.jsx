
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../AuthContext.jsx';
import Home from '../Home.jsx';

const emptyForm = { name: '', description: '', price: '', stock: '', image_url: '' };

export default function AdminProducts() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProducts = () => {
    api('/products')
      .then(setProducts)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const startEdit = (product) => {
    setEditingId(product.product_id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await api(`/products/${editingId}`, { method: 'PUT', body: form });
        setMessage('Product updated');
      } else {
        await api('/products', { method: 'POST', body: form });
        setMessage('Product added');
      }
      cancelEdit();
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;

    setError('');
    setMessage('');
    try {
      await api(`/products/${product.product_id}`, { method: 'DELETE' });
      setMessage('Product deleted');
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Products</h1>

      {message && <p className="alert alert-success">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <form className="panel form form-grid" onSubmit={handleSubmit}>
        <h3 className="full">{editingId ? `Edit product #${editingId}` : 'Add a new product'}</h3>

        <div>
          <label>Name</label>
          <input required value={form.name} onChange={handleChange('name')} />
        </div>

        <div>
          <label>Image URL (optional)</label>
          <input value={form.image_url} onChange={handleChange('image_url')} placeholder="https://..." />
        </div>

        <div>
          <label>Price (Rs.)</label>
          <input type="number" min="0" step="0.01" required value={form.price} onChange={handleChange('price')} />
        </div>

        <div>
          <label>Stock</label>
          <input type="number" min="0" required value={form.stock} onChange={handleChange('stock')} />
        </div>

        <div className="full">
          <label>Description</label>
          <textarea rows="3" value={form.description} onChange={handleChange('description')} />
        </div>

        <div className="full button-row">
          <button type="submit" className="btn">
            {editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_id}</td>
                <td>{product.name}</td>
                <td>Rs. {Number(product.price).toLocaleString()}</td>
                <td>
                  <span className={product.stock <= 5 ? 'text-red' : ''}>{product.stock}</span>
                </td>
                <td className="button-row">
                  <button className="btn btn-small" onClick={() => startEdit(product)}>
                    Edit
                  </button>
                  {isAdmin && (
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(product)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Home />
    </>
  );
}
