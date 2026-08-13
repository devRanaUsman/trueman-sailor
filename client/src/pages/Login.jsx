import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import Eyebrow from '../components/Eyebrow.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(params.get('next') || (user.role === 'admin' ? '/admin' : '/account'));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const fillAdmin = () => {
    setForm({ email: 'admin@trueman.co', password: 'Admin@123' });
    setError('');
  };

  const fillDemo = () => {
    setForm({ email: 'demo@trueman.co', password: 'Demo@123' });
    setError('');
  };

  return (
    <section className="auth-page">
      <div className="auth-card stagger">
        <Eyebrow>Welcome back</Eyebrow>
        <h1 className="h2">Sign in</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={fillAdmin}>
            Demo Admin
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={fillDemo}>
            Demo Client
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="admin@trueman.co"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Admin@123"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-alt">
          First visit? <Link to={`/register${params.get('next') ? `?next=${params.get('next')}` : ''}`}>Create an account</Link>
        </p>
      </div>
    </section>
  );
}
