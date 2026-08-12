import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import Eyebrow from '../components/Eyebrow.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate(params.get('next') || '/booking');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <section className="auth-page">
      <div className="auth-card stagger">
        <Eyebrow>Join the shop</Eyebrow>
        <h1 className="h2">Create account</h1>
        {error && <p className="form-error">{error}</p>}
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Full name</span>
            <input required autoComplete="name" value={form.name} onChange={set('name')} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
          </label>
          <label className="field">
            <span>Phone (for reminders)</span>
            <input autoComplete="tel" value={form.phone} onChange={set('phone')} />
          </label>
          <label className="field">
            <span>Password (6+ characters)</span>
            <input type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
          </label>
          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="auth-alt">
          Already with us? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
