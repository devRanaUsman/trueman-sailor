import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import Reveal from '../components/Reveal.jsx';
import Eyebrow from '../components/Eyebrow.jsx';

const CATEGORIES = [
  { key: 'all', label: 'Everything' },
  { key: 'haircut', label: 'Haircuts' },
  { key: 'beard', label: 'Beard' },
  { key: 'shave', label: 'Shaves' },
  { key: 'combo', label: 'Combos' },
  { key: 'extras', label: 'Extras' },
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/services')
      .then((r) => setServices(r.data.services))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(
    () => (cat === 'all' ? services : services.filter((s) => s.category === cat)),
    [services, cat]
  );

  return (
    <>
      <section className="page-hero">
        <div className="container center stagger">
          <Eyebrow light>Price list</Eyebrow>
          <h1 className="h1">Services</h1>
          <p className="page-hero-sub">Every appointment ends with a hot towel and a firm handshake.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="chip-row" role="tablist" aria-label="Service categories">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                role="tab"
                aria-selected={cat === c.key}
                className={`chip ${cat === c.key ? 'on' : ''}`}
                onClick={() => setCat(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading && <p className="muted center">Loading the menu…</p>}

          <div className="service-grid" key={cat}>
            {shown.map((s, i) => (
              <Reveal key={s._id} delay={i * 70} className="service-card">
                {s.popular && <span className="service-flag">House favourite</span>}
                <h3 className="service-name">{s.name}</h3>
                <p className="service-desc">{s.description}</p>
                <div className="service-meta">
                  <span>{s.duration} min</span>
                  <span className="service-price">${s.price}</span>
                </div>
                <Link to={`/booking?service=${s._id}`} className="btn btn-ghost btn-block">
                  Book this
                </Link>
              </Reveal>
            ))}
          </div>

          {!loading && shown.length === 0 && (
            <p className="muted center">Nothing in this category yet — check back soon.</p>
          )}
        </div>
      </section>
    </>
  );
}
