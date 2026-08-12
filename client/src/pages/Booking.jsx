import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Eyebrow from '../components/Eyebrow.jsx';
import SmartImage from '../components/SmartImage.jsx';

const STEPS = ['Service', 'Barber', 'Date & time', 'Confirm'];

const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const maxDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return todayStr(d);
};

const prettyDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export default function Booking() {
  const { user, login, register } = useAuth();
  const [params] = useSearchParams();

  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [stylist, setStylist] = useState(null); // stylist object | 'any'
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState(null); // [{time, stylistId}]
  const [slot, setSlot] = useState(null);
  const [notes, setNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // created booking

  // Inline auth on step 4
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });

  /* -------- load catalogue + honor ?service= / ?stylist= deep links -------- */
  useEffect(() => {
    Promise.all([api.get('/services'), api.get('/stylists')])
      .then(([sv, st]) => {
        setServices(sv.data.services);
        setStylists(st.data.stylists);

        const preService = sv.data.services.find((s) => s._id === params.get('service'));
        const preStylist = st.data.stylists.find((s) => s._id === params.get('stylist'));
        if (preService) setService(preService);
        if (preStylist) setStylist(preStylist);
        if (preService && preStylist) setStep(3);
        else if (preService) setStep(2);
      })
      .catch(() => setError('Could not reach the booking service. Is the API running?'))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- fetch availability whenever service/stylist/date settle -------- */
  useEffect(() => {
    if (step !== 3 || !service || !stylist || !date) return;
    setSlots(null);
    setSlot(null);
    setError('');

    const query =
      stylist === 'any'
        ? `/bookings/availability?serviceId=${service._id}&date=${date}`
        : `/bookings/availability?serviceId=${service._id}&date=${date}&stylistId=${stylist._id}`;

    api
      .get(query)
      .then((r) => {
        if (stylist === 'any') {
          // merge: first barber that has each time wins
          const map = new Map();
          for (const row of r.data.byStylist) {
            for (const t of row.slots) {
              if (!map.has(t)) map.set(t, row.stylist._id);
            }
          }
          setSlots(
            [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([time, stylistId]) => ({ time, stylistId }))
          );
        } else {
          setSlots(r.data.slots.map((time) => ({ time, stylistId: stylist._id })));
        }
      })
      .catch((err) => setError(errMsg(err, 'Could not load available times.')));
  }, [step, service, stylist, date]);

  const resolvedStylist = useMemo(() => {
    if (!slot) return stylist === 'any' ? null : stylist;
    if (stylist !== 'any') return stylist;
    return stylists.find((s) => s._id === slot.stylistId) || null;
  }, [slot, stylist, stylists]);

  /* ------------------------------ actions ------------------------------ */
  const pickService = (s) => {
    setService(s);
    setSlot(null);
    setStep(2);
  };
  const pickStylist = (b) => {
    setStylist(b);
    setSlot(null);
    setStep(3);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (authMode === 'login') await login(authForm.email, authForm.password);
      else await register(authForm);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!user || !service || !resolvedStylist || !slot) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/bookings', {
        serviceId: service._id,
        stylistId: resolvedStylist._id,
        date,
        start: slot.time,
        notes,
      });
      setDone(res.data.booking);
    } catch (err) {
      setError(errMsg(err));
      if (err?.response?.status === 409) {
        setStep(3); // slot got sniped — send them back to fresh times
        setSlot(null);
      }
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------ success ------------------------------ */
  if (done) {
    return (
      <section className="page-hero page-hero-tall">
        <div className="container center">
          <div className="ticket stagger">
            <div className="ticket-top">
              <Eyebrow>Booking received</Eyebrow>
              <h1 className="h2">You're on the list</h1>
              <p className="muted">
                We emailed a summary to <strong>{user.email}</strong>. The shop will confirm shortly.
              </p>
            </div>
            <div className="ticket-divider" />
            <dl className="ticket-details">
              <div>
                <dt>Service</dt>
                <dd>{done.serviceName}</dd>
              </div>
              <div>
                <dt>Barber</dt>
                <dd>{done.stylist?.name}</dd>
              </div>
              <div>
                <dt>When</dt>
                <dd>
                  {prettyDate(done.date)} · {done.start}
                </dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>${done.price}</dd>
              </div>
            </dl>
            <div className="ticket-actions">
              <Link to="/account" className="btn">
                My bookings
              </Link>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setDone(null);
                  setStep(1);
                  setService(null);
                  setStylist(null);
                  setSlot(null);
                  setNotes('');
                }}
              >
                Book another
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------ wizard ------------------------------ */
  return (
    <>
      <section className="page-hero">
        <div className="container center stagger">
          <Eyebrow light>Reserve your chair</Eyebrow>
          <h1 className="h1">Book an appointment</h1>
        </div>
      </section>

      <section className="section">
        <div className="container booking-wrap">
          {/* step rail */}
          <ol className="steps" aria-label="Booking progress">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const state = n < step ? 'done' : n === step ? 'now' : '';
              return (
                <li key={label} className={`step ${state}`}>
                  <button
                    className="step-dot"
                    disabled={n >= step}
                    onClick={() => setStep(n)}
                    aria-label={`Go back to step ${n}: ${label}`}
                  >
                    {n < step ? '✓' : n}
                  </button>
                  <span className="step-label">{label}</span>
                </li>
              );
            })}
          </ol>

          {error && <p className="form-error">{error}</p>}
          {!loaded && <p className="muted center">Opening the book…</p>}

          {/* STEP 1 — service */}
          {loaded && step === 1 && (
            <div className="wiz-panel">
              <h2 className="h3 wiz-title">What are we doing today?</h2>
              <div className="pick-grid">
                {services.map((s, i) => (
                  <button
                    key={s._id}
                    className={`pick-card pop ${service?._id === s._id ? 'on' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => pickService(s)}
                  >
                    <span className="pick-name">{s.name}</span>
                    <span className="pick-desc">{s.description}</span>
                    <span className="pick-meta">
                      <span>{s.duration} min</span>
                      <strong>${s.price}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — barber */}
          {loaded && step === 2 && (
            <div className="wiz-panel">
              <h2 className="h3 wiz-title">Who's holding the clippers?</h2>
              <div className="pick-grid pick-grid-barbers">
                <button
                  className={`pick-card pick-any pop ${stylist === 'any' ? 'on' : ''}`}
                  onClick={() => pickStylist('any')}
                >
                  <span className="pick-any-mark">✂</span>
                  <span className="pick-name">No preference</span>
                  <span className="pick-desc">Show every open time, first free chair wins</span>
                </button>
                {stylists.map((b, i) => (
                  <button
                    key={b._id}
                    className={`pick-card pick-barber pop ${stylist?._id === b._id ? 'on' : ''}`}
                    style={{ animationDelay: `${(i + 1) * 60}ms` }}
                    onClick={() => pickStylist(b)}
                  >
                    <span className="pick-avatar">
                      <SmartImage src={b.photo} alt="" />
                    </span>
                    <span className="pick-name">{b.name}</span>
                    <span className="pick-desc">{b.title}</span>
                    {b.rating?.count > 0 && <span className="pick-rating">★ {b.rating.avg}</span>}
                  </button>
                ))}
              </div>
              <button className="wiz-back" onClick={() => setStep(1)}>
                ← Change service
              </button>
            </div>
          )}

          {/* STEP 3 — date & time */}
          {loaded && step === 3 && service && stylist && (
            <div className="wiz-panel">
              <h2 className="h3 wiz-title">
                {service.name}
                {stylist !== 'any' ? ` with ${stylist.name}` : ' — any barber'}
              </h2>
              <label className="field field-date">
                <span>Pick a day</span>
                <input
                  type="date"
                  value={date}
                  min={todayStr()}
                  max={maxDateStr()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              {slots === null && !error && <p className="muted">Checking the book for {prettyDate(date)}…</p>}

              {slots?.length === 0 && (
                <p className="muted">
                  Fully booked {stylist !== 'any' ? `for ${stylist.name.split(' ')[0]} ` : ''}on this day —
                  try another date{stylist !== 'any' ? ' or another barber' : ''}.
                </p>
              )}

              {slots?.length > 0 && (
                <div className="slot-grid">
                  {slots.map((s, i) => (
                    <button
                      key={s.time}
                      className={`slot pop ${slot?.time === s.time ? 'on' : ''}`}
                      style={{ animationDelay: `${i * 30}ms` }}
                      onClick={() => setSlot(s)}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}

              <div className="wiz-nav">
                <button className="wiz-back" onClick={() => setStep(2)}>
                  ← Change barber
                </button>
                <button className="btn" disabled={!slot} onClick={() => setStep(4)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — confirm (with inline sign-in if needed) */}
          {loaded && step === 4 && service && resolvedStylist && slot && (
            <div className="wiz-panel wiz-confirm">
              <div className="ticket">
                <div className="ticket-top">
                  <Eyebrow>Your appointment</Eyebrow>
                  <h2 className="h3">{service.name}</h2>
                </div>
                <div className="ticket-divider" />
                <dl className="ticket-details">
                  <div>
                    <dt>Barber</dt>
                    <dd>{resolvedStylist.name}</dd>
                  </div>
                  <div>
                    <dt>When</dt>
                    <dd>
                      {prettyDate(date)} · {slot.time}
                    </dd>
                  </div>
                  <div>
                    <dt>Length</dt>
                    <dd>{service.duration} min</dd>
                  </div>
                  <div>
                    <dt>Price</dt>
                    <dd>${service.price}</dd>
                  </div>
                </dl>
              </div>

              {user ? (
                <div className="confirm-side">
                  <label className="field">
                    <span>Anything the barber should know? (optional)</span>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={notes}
                      placeholder="e.g. keep the length on top, skin fade sides"
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                  <p className="fine-print">
                    Free cancellation up to 2 hours before. Booking as {user.name} ({user.email}).
                  </p>
                  <div className="wiz-nav">
                    <button className="wiz-back" onClick={() => setStep(3)}>
                      ← Change time
                    </button>
                    <button className="btn btn-lg" disabled={busy} onClick={confirm}>
                      {busy ? 'Reserving…' : 'Confirm booking'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="confirm-side">
                  <h3 className="h4">
                    {authMode === 'login' ? 'Sign in to lock it in' : 'Create an account to lock it in'}
                  </h3>
                  <form className="auth-form" onSubmit={handleAuth}>
                    {authMode === 'register' && (
                      <>
                        <label className="field">
                          <span>Name</span>
                          <input
                            required
                            value={authForm.name}
                            onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                          />
                        </label>
                        <label className="field">
                          <span>Phone</span>
                          <input
                            value={authForm.phone}
                            onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                          />
                        </label>
                      </>
                    )}
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        required
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Password</span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      />
                    </label>
                    <button className="btn btn-block" disabled={busy}>
                      {busy ? 'One second…' : authMode === 'login' ? 'Sign in & continue' : 'Register & continue'}
                    </button>
                  </form>
                  <button
                    className="auth-switch"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  >
                    {authMode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
