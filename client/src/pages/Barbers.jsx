import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import Reveal from '../components/Reveal.jsx';
import Eyebrow from '../components/Eyebrow.jsx';
import SmartImage from '../components/SmartImage.jsx';
import Stars from '../components/Stars.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Barbers() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/stylists')
      .then((r) => setStylists(r.data.stylists))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="page-hero">
        <div className="container center stagger">
          <Eyebrow light>The crew</Eyebrow>
          <h1 className="h1">Our barbers</h1>
          <p className="page-hero-sub">Four chairs, four characters, one standard.</p>
        </div>
      </section>

      <section className="section">
        <div className="container barber-list">
          {loading && <p className="muted center">Calling the crew in…</p>}
          {stylists.map((b, i) => {
            const offDays = b.schedule?.filter((d) => d.off).map((d) => DAYS[d.day]) || [];
            return (
              <Reveal key={b._id} delay={i * 90} className="barber-row">
                <div className="barber-photo">
                  <SmartImage src={b.photo} alt={b.name} />
                </div>
                <div className="barber-info">
                  <h2 className="h3">{b.name}</h2>
                  <p className="barber-title">{b.title}</p>
                  {b.rating?.count > 0 && (
                    <p className="barber-rating">
                      <Stars value={Math.round(b.rating.avg)} /> {b.rating.avg} · {b.rating.count}{' '}
                      review{b.rating.count > 1 ? 's' : ''}
                    </p>
                  )}
                  <p className="muted">{b.bio}</p>
                  <p className="barber-tags">
                    {b.specialties?.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </p>
                  <p className="barber-days">
                    {offDays.length ? `Off on ${offDays.join(' & ')}` : 'In the shop every day'}
                  </p>
                  <Link to={`/booking?stylist=${b._id}`} className="btn btn-ghost">
                    Book with {b.name.split(' ')[0]}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
