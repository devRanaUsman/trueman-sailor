import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import Reveal from '../components/Reveal.jsx';
import SmartImage from '../components/SmartImage.jsx';
import Eyebrow from '../components/Eyebrow.jsx';
import Marquee from '../components/Marquee.jsx';
import Stars from '../components/Stars.jsx';

const U = (id, w = 1400) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const HERO_BG = U('photo-1503951914875-452162b0f3f1', 2000);
const CARDS = [
  { title: 'The Place', img: U('photo-1585747860715-2ba37e788b70'), to: '/booking', note: 'Details' },
  { title: 'Barbers', img: U('photo-1605497788044-5a32c7078486'), to: '/barbers', note: 'Details' },
  { title: 'Philosophy', img: U('photo-1517832606299-7ae9b720a186'), to: '/services', note: 'Details' },
];
const ABOUT_IMG = U('photo-1621605815971-fbc98d665033', 900);
const COLLAGE = [
  U('photo-1519345182560-3f2917c472ef', 700),
  U('photo-1521490878406-2f2e1d1e0f6a', 700),
  U('photo-1622287162716-f311baa1a2b8', 900),
];

const FALLBACK_QUOTES = [
  {
    _id: 'q1',
    authorName: 'Martin C.',
    rating: 5,
    comment:
      'Being in this business for almost a decade, I can tell this place is absolutely worth your time and money. Great incredible job, keep it up boys!',
  },
  {
    _id: 'q2',
    authorName: 'Dave R.',
    rating: 5,
    comment: 'The hot towel shave is a ritual. Forty-five minutes later I walked out a new man.',
  },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [reviews, setReviews] = useState(FALLBACK_QUOTES);
  const [quote, setQuote] = useState(0);

  useEffect(() => {
    api.get('/services').then((r) => setServices(r.data.services)).catch(() => {});
    api.get('/stylists').then((r) => setStylists(r.data.stylists)).catch(() => {});
    api
      .get('/reviews?limit=6')
      .then((r) => r.data.reviews.length && setReviews(r.data.reviews))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setQuote((q) => (q + 1) % reviews.length), 6000);
    return () => clearInterval(id);
  }, [reviews.length]);

  const menu = services.slice(0, 6);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${HERO_BG})` }} />
        <div className="hero-shade" />
        <div className="hero-inner stagger">
          <p className="eyebrow eyebrow-light">~ Grooming Co ~</p>
          <h1 className="hero-title">Dig the look</h1>
          <p className="hero-sub">
            Come by for a haircut, shave, apparel
            <br />
            and accessories
          </p>
          <Link to="/booking" className="btn btn-lg">
            Make an appointment
          </Link>
        </div>
        <div className="hero-dots" aria-hidden="true">
          <span />
          <span className="on" />
          <span />
          <span />
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span />
        </div>
      </section>

      <Marquee />

      {/* ============ FRAME CARDS ============ */}
      <section className="section section-smoke">
        <div className="container frame-grid">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={i * 120}>
              <Link to={c.to} className="frame-card">
                <SmartImage src={c.img} alt={c.title} className="frame-img" />
                <span className="frame-border" />
                <span className="frame-body">
                  <span className="frame-title">— {c.title} —</span>
                  <span className="frame-x">✂ ✂ ✂</span>
                  <span className="frame-note">{c.note}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section className="section">
        <div className="container about-grid">
          <Reveal className="about-copy">
            <Eyebrow>Welcome</Eyebrow>
            <h2 className="h2 rule">We are Trueman</h2>
            <p className="lead">
              We offer a full range of barber services — from straight razor shaving and hairstyling to
              beard care and eyebrow grooming.
            </p>
            <p className="muted">
              Book online in under a minute, pick your barber and your time, and we will have the chair
              hot and the towels hotter. Running late or plans changed? Manage everything from your
              account.
            </p>
            <Link to="/services" className="btn btn-ghost">
              More about us
            </Link>
          </Reveal>

          <Reveal delay={150} className="about-media">
            <SmartImage src={ABOUT_IMG} alt="Barber tools" className="about-img" />
          </Reveal>

          <Reveal delay={280} className="hours-card">
            <h3 className="hours-title">Open hours</h3>
            <p className="hours-line">Mon – Sun&ensp;10am – 9pm</p>
            <h3 className="hours-title">Location</h3>
            <p className="hours-line">
              123 Chicago Ave, New Lenox
              <br />
              IL 60606
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ SERVICE MENU ============ */}
      <section className="section section-smoke">
        <div className="container menu-wrap">
          <Reveal className="menu-head">
            <Eyebrow>Price list</Eyebrow>
            <h2 className="h2 rule rule-center">The barber's menu</h2>
          </Reveal>
          <div className="menu-list">
            {menu.map((s, i) => (
              <Reveal key={s._id} delay={i * 80} className="menu-row">
                <span className="menu-name">
                  {s.name}
                  {s.popular && <em className="menu-pop">house favourite</em>}
                </span>
                <span className="menu-dots" />
                <span className="menu-meta">{s.duration} min</span>
                <span className="menu-price">${s.price}</span>
              </Reveal>
            ))}
            {menu.length === 0 && (
              <p className="muted center">Start the API and run the seed to load the service menu.</p>
            )}
          </div>
          <Reveal delay={200} className="center">
            <Link to="/services" className="btn">
              Full price list & booking
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ BARBERS ============ */}
      <section className="section">
        <div className="container">
          <Reveal className="center">
            <Eyebrow>The crew</Eyebrow>
            <h2 className="h2 rule rule-center">Pick your barber</h2>
          </Reveal>
          <div className="crew-grid">
            {stylists.slice(0, 4).map((b, i) => (
              <Reveal key={b._id} delay={i * 100} className="crew-card">
                <div className="crew-photo">
                  <SmartImage src={b.photo} alt={b.name} />
                </div>
                <h3 className="crew-name">{b.name}</h3>
                <p className="crew-title">{b.title}</p>
                {b.rating?.count > 0 && (
                  <p className="crew-rating">
                    <Stars value={Math.round(b.rating.avg)} /> {b.rating.avg} ({b.rating.count})
                  </p>
                )}
                <Link to={`/booking?stylist=${b._id}`} className="crew-book">
                  Book with {b.name.split(' ')[0]} →
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="testi">
        <div className="testi-collage" aria-hidden="true">
          <SmartImage src={COLLAGE[0]} alt="" className="testi-img a" />
          <SmartImage src={COLLAGE[1]} alt="" className="testi-img b" />
          <SmartImage src={COLLAGE[2]} alt="" className="testi-img c" />
        </div>
        <div className="testi-panel">
          <Reveal>
            <p className="eyebrow eyebrow-ink">~ Testimonials ~</p>
            <h2 className="h2 testi-title">Clients say</h2>
            <div className="testi-quotes">
              {reviews.map((r, i) => (
                <blockquote key={r._id} className={`testi-quote ${i === quote ? 'on' : ''}`}>
                  <p>“{r.comment}”</p>
                  <footer>
                    <Stars value={r.rating} />
                    <cite>
                      {r.authorName}
                      {r.stylist?.name ? `, on ${r.stylist.name}` : ''}
                    </cite>
                  </footer>
                </blockquote>
              ))}
            </div>
            <div className="testi-dots">
              {reviews.map((r, i) => (
                <button
                  key={r._id}
                  className={i === quote ? 'on' : ''}
                  onClick={() => setQuote(i)}
                  aria-label={`Show review ${i + 1}`}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta-band">
        <div className="container center">
          <Reveal>
            <p className="eyebrow eyebrow-light">~ No waiting around ~</p>
            <h2 className="cta-title">Ready for a fresh cut?</h2>
            <p className="cta-sub">Pick a service, a barber and a time — done in under a minute.</p>
            <Link to="/booking" className="btn btn-lg">
              Book your chair
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
