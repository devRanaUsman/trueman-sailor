import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import Eyebrow from '../components/Eyebrow.jsx';

const TABS = ['Bookings', 'Services', 'Barbers'];
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const emptyService = { name: '', category: 'haircut', duration: 45, price: 35, description: '', popular: false };
const emptyStylist = { name: '', title: 'Barber', bio: '', photo: '', specialties: '' };

export default function Admin() {
  const [tab, setTab] = useState('Bookings');
  const [notice, setNotice] = useState('');

  /* ------------------------------- stats ------------------------------- */
  const [stats, setStats] = useState(null);
  const loadStats = () => api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  useEffect(() => {
    loadStats();
  }, []);

  /* ------------------------------ bookings ------------------------------ */
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState({ status: '', date: '' });

  const loadBookings = () => {
    const q = new URLSearchParams();
    if (filter.status) q.set('status', filter.status);
    if (filter.date) q.set('date', filter.date);
    api
      .get(`/admin/bookings?${q}`)
      .then((r) => setBookings(r.data.bookings))
      .catch((err) => setNotice(errMsg(err)));
  };
  useEffect(() => {
    if (tab === 'Bookings') loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filter]);

  const setStatus = async (b, status) => {
    try {
      await api.patch(`/admin/bookings/${b._id}/status`, { status });
      setNotice(`${b.serviceName} for ${b.user?.name} → ${status}`);
      loadBookings();
      loadStats();
    } catch (err) {
      setNotice(errMsg(err));
    }
  };

  /* ------------------------------ services ------------------------------ */
  const [services, setServices] = useState([]);
  const [svcForm, setSvcForm] = useState(emptyService);
  const [svcEditing, setSvcEditing] = useState(null);

  const loadServices = () =>
    api.get('/services?all=1').then((r) => setServices(r.data.services)).catch(() => {});
  useEffect(() => {
    if (tab === 'Services') loadServices();
  }, [tab]);

  const saveService = async (e) => {
    e.preventDefault();
    try {
      const body = { ...svcForm, duration: Number(svcForm.duration), price: Number(svcForm.price) };
      if (svcEditing) await api.put(`/services/${svcEditing}`, body);
      else await api.post('/services', body);
      setSvcForm(emptyService);
      setSvcEditing(null);
      setNotice('Service saved.');
      loadServices();
    } catch (err) {
      setNotice(errMsg(err));
    }
  };

  const toggleService = async (s) => {
    try {
      await api.put(`/services/${s._id}`, { active: !s.active });
      loadServices();
    } catch (err) {
      setNotice(errMsg(err));
    }
  };

  /* ------------------------------ stylists ------------------------------ */
  const [stylists, setStylists] = useState([]);
  const [styForm, setStyForm] = useState(emptyStylist);
  const [styEditing, setStyEditing] = useState(null);

  const loadStylists = () =>
    api.get('/stylists?all=1').then((r) => setStylists(r.data.stylists)).catch(() => {});
  useEffect(() => {
    if (tab === 'Barbers') loadStylists();
  }, [tab]);

  const saveStylist = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...styForm,
        specialties: styForm.specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (styEditing) await api.put(`/stylists/${styEditing}`, body);
      else await api.post('/stylists', body);
      setStyForm(emptyStylist);
      setStyEditing(null);
      setNotice('Barber saved.');
      loadStylists();
    } catch (err) {
      setNotice(errMsg(err));
    }
  };

  const toggleStylist = async (s) => {
    try {
      await api.put(`/stylists/${s._id}`, { active: !s.active });
      loadStylists();
    } catch (err) {
      setNotice(errMsg(err));
    }
  };

  /* -------------------------------- render ------------------------------- */
  return (
    <>
      <section className="page-hero">
        <div className="container center stagger">
          <Eyebrow light>Back of house</Eyebrow>
          <h1 className="h1">Shop dashboard</h1>
        </div>
      </section>

      <section className="section">
        <div className="container admin-wrap">
          {stats && (
            <div className="stat-row">
              <div className="stat-card">
                <span className="stat-num">{stats.todayCount}</span>
                <span className="stat-label">Today's chairs</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.pendingCount}</span>
                <span className="stat-label">Awaiting confirmation</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.upcomingCount}</span>
                <span className="stat-label">Upcoming bookings</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">${stats.monthRevenue}</span>
                <span className="stat-label">Completed this month</span>
              </div>
            </div>
          )}

          <div className="chip-row">
            {TABS.map((t) => (
              <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {notice && <p className="form-notice">{notice}</p>}

          {/* -------- Bookings tab -------- */}
          {tab === 'Bookings' && (
            <>
              <div className="admin-filters">
                <label className="field">
                  <span>Status</span>
                  <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                    <option value="">All</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Date</span>
                  <input type="date" value={filter.date} onChange={(e) => setFilter({ ...filter, date: e.target.value })} />
                </label>
                {(filter.status || filter.date) && (
                  <button className="wiz-back" onClick={() => setFilter({ status: '', date: '' })}>
                    Clear filters
                  </button>
                )}
              </div>

              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Barber</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b._id}>
                        <td>
                          <strong>{b.date}</strong> {b.start}
                        </td>
                        <td>
                          {b.user?.name}
                          <span className="cell-sub">{b.user?.phone || b.user?.email}</span>
                        </td>
                        <td>
                          {b.serviceName}
                          <span className="cell-sub">${b.price} · {b.duration} min</span>
                        </td>
                        <td>{b.stylist?.name}</td>
                        <td>
                          <span className={`status-chip status-${b.status}`}>{b.status}</span>
                        </td>
                        <td className="cell-actions">
                          {b.status === 'pending' && (
                            <button onClick={() => setStatus(b, 'confirmed')}>Confirm</button>
                          )}
                          {['pending', 'confirmed'].includes(b.status) && (
                            <>
                              <button onClick={() => setStatus(b, 'completed')}>Complete</button>
                              <button className="danger" onClick={() => setStatus(b, 'cancelled')}>
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="muted center">
                          No bookings match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* -------- Services tab -------- */}
          {tab === 'Services' && (
            <div className="admin-split">
              <form className="admin-form" onSubmit={saveService}>
                <h3 className="h4">{svcEditing ? 'Edit service' : 'Add a service'}</h3>
                <label className="field">
                  <span>Name</span>
                  <input required value={svcForm.name} onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })} />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select value={svcForm.category} onChange={(e) => setSvcForm({ ...svcForm, category: e.target.value })}>
                    {['haircut', 'shave', 'beard', 'combo', 'extras'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <div className="field-pair">
                  <label className="field">
                    <span>Duration (min)</span>
                    <input type="number" min={15} step={15} required value={svcForm.duration} onChange={(e) => setSvcForm({ ...svcForm, duration: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>Price ($)</span>
                    <input type="number" min={0} required value={svcForm.price} onChange={(e) => setSvcForm({ ...svcForm, price: e.target.value })} />
                  </label>
                </div>
                <label className="field">
                  <span>Description</span>
                  <textarea rows={2} value={svcForm.description} onChange={(e) => setSvcForm({ ...svcForm, description: e.target.value })} />
                </label>
                <label className="field field-check">
                  <input type="checkbox" checked={svcForm.popular} onChange={(e) => setSvcForm({ ...svcForm, popular: e.target.checked })} />
                  <span>Mark as house favourite</span>
                </label>
                <div className="wiz-nav">
                  {svcEditing && (
                    <button type="button" className="wiz-back" onClick={() => { setSvcEditing(null); setSvcForm(emptyService); }}>
                      Cancel edit
                    </button>
                  )}
                  <button className="btn btn-sm">{svcEditing ? 'Save changes' : 'Add service'}</button>
                </div>
              </form>

              <ul className="admin-list">
                {services.map((s) => (
                  <li key={s._id} className={s.active ? '' : 'inactive'}>
                    <div>
                      <strong>{s.name}</strong>
                      <span className="cell-sub">
                        {s.category} · {s.duration} min · ${s.price}
                        {!s.active && ' · hidden'}
                      </span>
                    </div>
                    <div className="cell-actions">
                      <button onClick={() => { setSvcEditing(s._id); setSvcForm({ ...s }); }}>Edit</button>
                      <button className={s.active ? 'danger' : ''} onClick={() => toggleService(s)}>
                        {s.active ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* -------- Barbers tab -------- */}
          {tab === 'Barbers' && (
            <div className="admin-split">
              <form className="admin-form" onSubmit={saveStylist}>
                <h3 className="h4">{styEditing ? 'Edit barber' : 'Add a barber'}</h3>
                <label className="field">
                  <span>Name</span>
                  <input required value={styForm.name} onChange={(e) => setStyForm({ ...styForm, name: e.target.value })} />
                </label>
                <label className="field">
                  <span>Title</span>
                  <input value={styForm.title} onChange={(e) => setStyForm({ ...styForm, title: e.target.value })} />
                </label>
                <label className="field">
                  <span>Photo URL</span>
                  <input value={styForm.photo} onChange={(e) => setStyForm({ ...styForm, photo: e.target.value })} />
                </label>
                <label className="field">
                  <span>Specialties (comma-separated)</span>
                  <input value={styForm.specialties} onChange={(e) => setStyForm({ ...styForm, specialties: e.target.value })} />
                </label>
                <label className="field">
                  <span>Bio</span>
                  <textarea rows={2} value={styForm.bio} onChange={(e) => setStyForm({ ...styForm, bio: e.target.value })} />
                </label>
                <div className="wiz-nav">
                  {styEditing && (
                    <button type="button" className="wiz-back" onClick={() => { setStyEditing(null); setStyForm(emptyStylist); }}>
                      Cancel edit
                    </button>
                  )}
                  <button className="btn btn-sm">{styEditing ? 'Save changes' : 'Add barber'}</button>
                </div>
              </form>

              <ul className="admin-list">
                {stylists.map((s) => (
                  <li key={s._id} className={s.active ? '' : 'inactive'}>
                    <div>
                      <strong>{s.name}</strong>
                      <span className="cell-sub">
                        {s.title}
                        {s.rating?.count > 0 && ` · ★ ${s.rating.avg} (${s.rating.count})`}
                        {!s.active && ' · hidden'}
                      </span>
                    </div>
                    <div className="cell-actions">
                      <button
                        onClick={() => {
                          setStyEditing(s._id);
                          setStyForm({
                            name: s.name,
                            title: s.title,
                            bio: s.bio,
                            photo: s.photo,
                            specialties: (s.specialties || []).join(', '),
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className={s.active ? 'danger' : ''} onClick={() => toggleStylist(s)}>
                        {s.active ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
