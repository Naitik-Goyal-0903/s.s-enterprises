import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBackendBaseUrl, getProperties } from '../services/api';

const STAGE_TABS = ['Active', 'Under Construction', 'Upcoming'];
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hi S.S Enterprises, I am interested in your properties. Please share details for active listings, price breakup, EMI options, location highlights, site visit availability, and required booking documents. Kindly let me know what details or documents are required from my side so that I can provide all the necessary information accordingly.'
);
const WHATSAPP_URL = `https://wa.me/917078542301?text=${WHATSAPP_MESSAGE}`;

export default function HomePage() {
  const [allProperties, setAllProperties] = useState([]);
  const [stage, setStage] = useState('Active');
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoadingProjects(true);
      const response = await getProperties();
      setAllProperties(response.data.data || []);
    } catch (error) {
      console.error('Error fetching homepage properties:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price || 0);
  };

  const resolveImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/1200x700?text=S.S+Enterprises';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${getBackendBaseUrl()}${url}`;
  };

  const sortedProperties = useMemo(() => {
    return [...allProperties].sort((a, b) => {
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (a.status !== 'Active' && b.status === 'Active') return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [allProperties]);

  const stageProperties = useMemo(() => {
    return sortedProperties.filter((property) => property.status === stage).slice(0, 6);
  }, [sortedProperties, stage]);

  const latestAdded = useMemo(() => {
    return sortedProperties.slice(0, 4);
  }, [sortedProperties]);

  const activeCount = allProperties.filter((item) => item.status === 'Active').length;
  const ucCount = allProperties.filter((item) => item.status === 'Under Construction').length;
  const upcomingCount = allProperties.filter((item) => item.status === 'Upcoming').length;

  return (
    <div className="home-page">
      <header>
        <h1>S.S ENTERPRISES</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/properties">Properties</Link>
        </nav>
      </header>

      <section className="hero home-hero">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />

        <div className="container hero-content">
          <p className="hero-tag">Trusted Real Estate Partner For India</p>
          <h2>Find Your Perfect Property With Confidence</h2>
          <p className="hero-subtitle">
            Live listings from your own admin dashboard, transparent Indian pricing, strong location intelligence,
            and fast response support from S.S Enterprises.
          </p>
          <div className="hero-actions">
            <Link to="/properties" className="btn btn-secondary btn-lg">Explore Properties</Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-light btn-lg"
            >
              WhatsApp Us
            </a>
          </div>

          <div className="hero-metrics">
            <div>
              <h4>{allProperties.length}</h4>
              <p>Total Live Listings</p>
            </div>
            <div>
              <h4>{activeCount}</h4>
              <p>Active Focus Properties</p>
            </div>
            <div>
              <h4>{ucCount}</h4>
              <p>Under Construction</p>
            </div>
            <div>
              <h4>{upcomingCount}</h4>
              <p>Future Launches</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="section-headline">
          <h3>Why S.S Enterprises</h3>
          <p>Built for Indian homebuyers and investors with practical filters, real locality context, and honest pricing.</p>
        </div>
        <div className="grid home-benefits-grid">
          <div className="card home-benefit-card">
            <h4>Verified Listings</h4>
            <p>Only admin-curated properties are published, so what you add is what your users see.</p>
          </div>
          <div className="card home-benefit-card">
            <h4>Price Transparency</h4>
            <p>Original price, discount, and offer price show clearly in the same card.</p>
          </div>
          <div className="card home-benefit-card">
            <h4>Indian Unit Support</h4>
            <p>Property size available in both sq.ft and gaj to match local buying behavior.</p>
          </div>
          <div className="card home-benefit-card">
            <h4>Fast Enquiry On WhatsApp</h4>
            <p>One-click lead capture and direct agent conversation on WhatsApp.</p>
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="section-headline">
          <h3>Current Projects</h3>
          <p>Switch between Active, Under Construction, and Upcoming projects from your live database.</p>
        </div>

        <div className="home-stage-switch">
          {STAGE_TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              className={stage === tab ? 'home-stage-btn active' : 'home-stage-btn'}
              onClick={() => setStage(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loadingProjects ? (
          <p className="admin-muted">Loading projects...</p>
        ) : stageProperties.length === 0 ? (
          <p className="admin-muted">No properties available in this stage right now.</p>
        ) : (
          <div className="grid home-live-grid">
            {stageProperties.map((property) => (
              <article key={property._id} className="card home-live-card">
                <img
                  src={resolveImageUrl(property.images?.[0]?.url)}
                  alt={property.title}
                  className="home-live-image"
                />
                <div className="home-live-body">
                  <div className="home-live-row">
                    <span className="showcase-badge">{property.status}</span>
                    <span className="property-badge-main">{property.category || property.type}</span>
                  </div>

                  <h4>{property.title}</h4>
                  <p>{property.city}, {property.location}</p>
                  <p className="property-spec-line">
                    {property.bhk} BHK • {property.areaSqft || property.area} sq.ft • {property.areaGaj || (((property.area || 0) / 9).toFixed(2))} gaj
                  </p>
                  {(property.nearbyLandmarks || []).length > 0 && (
                    <p className="property-landmark-line">Near: {property.nearbyLandmarks.slice(0, 2).join(', ')}</p>
                  )}

                  <div className="property-price-wrap">
                    {Number(property.discountPercent || 0) > 0 && (
                      <p className="property-old-price">{formatPrice(property.originalPrice || property.price)}</p>
                    )}
                    <div className="property-price">{formatPrice(property.price)}</div>
                    {Number(property.discountPercent || 0) > 0 && (
                      <span className="property-discount-chip">{Number(property.discountPercent).toFixed(1)}% OFF</span>
                    )}
                  </div>

                  <Link to={`/property/${property._id}`} className="btn btn-primary project-detail-btn">
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="container section-space">
        <div className="section-headline">
          <h3>Latest Added Listings</h3>
          <p>Below section always reflects only the properties you add from admin panel.</p>
        </div>

        <div className="grid home-added-grid">
          {latestAdded.map((property) => (
            <Link key={property._id} to={`/property/${property._id}`} className="card home-added-item">
              <strong>{property.title}</strong>
              <p>{property.city} • {property.status}</p>
            </Link>
          ))}
          {latestAdded.length === 0 && <p className="admin-muted">No property added yet.</p>}
        </div>
      </section>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="home-fab-whatsapp"
        aria-label="Chat on WhatsApp"
      >
        <span className="home-fab-icon">W</span>
        <span className="home-fab-text">Instant Property Help</span>
      </a>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>S.S Enterprises</h4>
            <p>Your trusted real estate partner in India</p>
          </div>
          <div className="footer-section">
            <h4>📞 Contact</h4>
            <p><a href="tel:+917078542301">+91 7078542301</a></p>
            <p><a href="mailto:SS.Koffice23@gmail.com">SS.Koffice23@gmail.com</a></p>
          </div>
          <div className="footer-section">
            <h4>📍 Address</h4>
            <p>40 Foota Road, Tomar Choraya<br/>Mathura, UP</p>
          </div>
          <div className="footer-section">
            <h4>💬 Connect</h4>
            <p><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 S.S Enterprises. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
