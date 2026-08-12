import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/barbers', label: 'Barbers' },
  { to: '/account', label: 'My bookings' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`nav ${scrolled ? 'nav-scrolled' : ''} ${open ? 'nav-open' : ''}`}>
      <div className="nav-top container">
        <a className="nav-phone" href="tel:8004567890">
          Call us: <strong>800-456-7890</strong>
        </a>

        <Link to="/" className="nav-logo" onClick={close}>
          <span className="nav-logo-eyebrow">Grooming Co.</span>
          <span className="nav-logo-word">
            True<em>✂</em>man
          </span>
          <span className="nav-logo-est">est ~ 1998</span>
        </Link>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">Hi, {user.name.split(' ')[0]}</span>
              {user.role === 'admin' && (
                <Link className="nav-mini-link" to="/admin">
                  Dashboard
                </Link>
              )}
              <button
                className="nav-mini-link"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link className="nav-mini-link" to="/login">
              Sign in
            </Link>
          )}
          <Link to="/booking" className="btn btn-sm">
            Make an appointment
          </Link>
        </div>

        <button
          className="nav-burger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav className="nav-links container" aria-label="Primary">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className="nav-link">
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile overlay menu */}
      <div className="nav-mobile" role="dialog" aria-modal="true" aria-label="Menu">
        <nav className="nav-mobile-links">
          {LINKS.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className="nav-mobile-link"
              style={{ transitionDelay: open ? `${120 + i * 70}ms` : '0ms' }}
              onClick={close}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="nav-mobile-cta" style={{ transitionDelay: open ? '450ms' : '0ms' }}>
            <Link to="/booking" className="btn" onClick={close}>
              Make an appointment
            </Link>
            {user ? (
              <div className="nav-mobile-account">
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={close}>
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    close();
                    navigate('/');
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/login" className="nav-mobile-account" onClick={close}>
                Sign in / Register
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
