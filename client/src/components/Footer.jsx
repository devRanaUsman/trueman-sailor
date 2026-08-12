import { Link } from 'react-router-dom';
import Eyebrow from './Eyebrow.jsx';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
        <div>
          <p className="footer-logo">Trueman<span>✂</span></p>
          <p className="footer-tag">Grooming Co. — haircuts, shaves, apparel and accessories since 1998.</p>
        </div>
        <div>
          <Eyebrow light>Visit us</Eyebrow>
          <p>123 Chicago Ave, New Lenox<br />IL 60606</p>
          <p><a href="tel:8004567890">800-456-7890</a><br /><a href="mailto:book@trueman.co">book@trueman.co</a></p>
        </div>
        <div>
          <Eyebrow light>Open hours</Eyebrow>
          <p>Mon – Sun<br />10 am – 9 pm</p>
        </div>
        <div>
          <Eyebrow light>Quick cuts</Eyebrow>
          <p className="footer-links">
            <Link to="/services">Services</Link>
            <Link to="/barbers">Barbers</Link>
            <Link to="/booking">Book a chair</Link>
            <Link to="/account">My bookings</Link>
          </p>
        </div>
      </div>
      <div className="footer-bar">
        <div className="container footer-bar-inner">
          <span>© {new Date().getFullYear()} Trueman Grooming Co.</span>
          <span>Walk-ins welcome, appointments cherished.</span>
        </div>
      </div>
    </footer>
  );
}
