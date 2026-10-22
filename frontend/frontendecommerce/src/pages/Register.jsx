import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const comeBackTo = location.state?.from;

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await register(form);
      navigate(comeBackTo || '/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-box">
      <h2>Create your account</h2>
      <p className="muted">It only takes a minute</p>

      {error && <p className="alert alert-error">{error}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <label>Full name</label>
        <input placeholder="Your name" required value={form.name} onChange={handleChange('name')} />

        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={handleChange('email')}
        />

        <label>Phone</label>
        <input placeholder="03001234567" required value={form.phone} onChange={handleChange('phone')} />

        <label>Password</label>
        <input
          type="password"
          placeholder="At least 6 characters"
          required
          value={form.password}
          onChange={handleChange('password')}
        />

        <button type="submit" className="btn">
          Register
        </button>
      </form>

      <p className="muted">
        Already registered?{' '}
        <Link to="/login" state={{ from: comeBackTo }}>
          Login
        </Link>
      </p>
    </div>
  );
}
