import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Eyebrow from '../components/Eyebrow.jsx';
import Stars from '../components/Stars.jsx';
import Reveal from '../components/Reveal.jsx';

const prettyDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const STATUS_LABEL = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function ReviewForm({ booking, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/reviews', { bookingId: booking._id, rating, comment });
      onDone();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <p className="review-ask">How was {booking.stylist?.name?.split(' ')[0]}?</p>
      <Stars value={rating} onChange={setRating} />
      <textarea
        rows={2}
        maxLength={600}
        placeholder="A line for the wall of fame (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-sm" disabled={busy}>
        {busy ? 'Posting…' : 'Post review'}
      </button>
    </form>
  );
}

export default function Account() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [fetched, setFetched] = useState(false);
  const [notice, setNotice] = useState('');
  const [reviewing, setReviewing] = useState(null);

  const load = () =>
    api
      .get('/bookings/mine')
      .then((r) => setBookings(r.data.bookings))
      .catch(() => {})
      .finally(() => setFetched(true));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login?next=/account');
      return;
    }
    load();
  }, [user, loading, navigate]);

  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const up = [];
    const pa = [];
    for (const b of bookings) {
      const isUpcoming = ['pending', 'confirmed'].includes(b.status) && b.date >= today;
      (isUpcoming ? up : pa).push(b);
    }
    up.sort((a, z) => (a.date + a.start).localeCompare(z.date + z.start));
    return { upcoming: up, past: pa };
  }, [bookings]);

  const cancel = async (b) => {
    if (!window.confirm(`Cancel ${b.serviceName} on ${prettyDate(b.date)} at ${b.start}?`)) return;
    setNotice('');
    try {
      await api.patch(`/bookings/${b._id}/cancel`);
      setNotice('Booking cancelled — the slot is free for someone else.');
      load();
    } catch (err) {
      setNotice(errMsg(err));
    }
  };

  const Card = ({ b, i, isUpcoming }) => (
    <Reveal delay={i * 60} className={`ticket booking-card status-${b.status}${isUpcoming ? ' upcoming-card' : ''}`}>
      <div className="booking-card-head">
        <div>
          <h3 className="h4">{b.serviceName}</h3>
          <p className="muted">
            with {b.stylist?.name} · {b.duration} min · ${b.price}
          </p>
        </div>
        <span className={`status-chip status-${b.status}`}>{STATUS_LABEL[b.status]}</span>
      </div>
      <div className="ticket-divider" />
      <div className="booking-card-foot">
        <p className="booking-when">
          {prettyDate(b.date)} · {b.start}–{b.end}
        </p>
        <div className="booking-actions">
          {['pending', 'confirmed'].includes(b.status) && (
            <button className="link-danger" onClick={() => cancel(b)}>
              Cancel
            </button>
          )}
          {b.status === 'completed' && !b.reviewed && (
            <button className="link-brass" onClick={() => setReviewing(reviewing === b._id ? null : b._id)}>
              {reviewing === b._id ? 'Close' : 'Leave a review'}
            </button>
          )}
          {b.status === 'completed' && b.reviewed && <span className="muted">Reviewed ✓</span>}
        </div>
      </div>
      {reviewing === b._id && (
        <ReviewForm
          booking={b}
          onDone={() => {
            setReviewing(null);
            setNotice('Thanks — your review is up on the wall.');
            load();
          }}
        />
      )}
    </Reveal>
  );

  return (
    <>
      <section className="page-hero">
        <div className="container center stagger">
          <Eyebrow light>Your chair history</Eyebrow>
          <h1 className="h1">My bookings</h1>
        </div>
      </section>

      <section className="section">
        <div className="container account-wrap">
          {notice && <p className="form-notice">{notice}</p>}
          {!fetched && <p className="muted center">Opening your file…</p>}

          {fetched && bookings.length === 0 && (
            <div className="center empty-state">
              <p className="muted">No appointments yet — the first one is the start of a good habit.</p>
              <Link to="/booking" className="btn">
                Book your first cut
              </Link>
            </div>
          )}

          {upcoming.length > 0 && (
            <>
              <h2 className="h3 rule">Upcoming</h2>
              <div className="booking-list">
                {upcoming.map((b, i) => (
                  <Card key={b._id} b={b} i={i} isUpcoming />
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="h3 rule">Past</h2>
              <div className="booking-list">
                {past.map((b, i) => (
                  <Card key={b._id} b={b} i={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
