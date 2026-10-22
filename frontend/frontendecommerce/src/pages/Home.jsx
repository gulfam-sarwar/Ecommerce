import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      api(`/products?search=${encodeURIComponent(search)}`)
        .then(setProducts)
        .catch((err) => setMessage(err.message));
    }, 250);

    return () => clearTimeout(timer); 
  }, [search]);

  const addToCart = async (productId) => {
    const cartPath = user ? '/cart' : '/guest-cart';

    try {
      await api(cartPath, { method: 'POST', body: { product_id: productId, quantity: 1 } });
      setMessage(' Added to cart');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <>
      <section className="hero">
        <h1>Find something you love</h1>
        <p>Great products, simple checkout, delivered to your door.</p>
        <input
          className="search"
          placeholder="  Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      {message && <p className="alert alert-info">{message}</p>}

      {products.length === 0 && <p className="muted">No products found.</p>}

      <div className="grid">
        {products.map((product) => (
          <div className="card product-card" key={product.product_id}>
            <div className="product-image">
              {product.image_url ? <img src={product.image_url} alt={product.name} /> : '📦'}
            </div>

            <h3>{product.name}</h3>
            <p className="muted product-desc">{product.description}</p>
            <p className="price">Rs. {Number(product.price).toLocaleString()}</p>

            {product.stock > 0 && product.stock <= 5 && (
              <p className="low-stock">Only {product.stock} left!</p>
            )}

            <button
              className="btn"
              disabled={product.stock < 1}
              onClick={() => addToCart(product.product_id)}
            >
              {product.stock < 1 ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
