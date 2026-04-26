import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBackendBaseUrl, getProperties } from '../services/api';

const CATEGORY_OPTIONS = [
  'Kothi',
  'Flat',
  'Farmhouse',
  'Shop',
  'Penthouse',
  'Airbnb',
  'Rented Apartment',
  'Independent House',
  'Builder Floor',
  'Studio Apartment',
  'Villa',
  'Plot',
  'Commercial Office',
  'Warehouse',
  'Showroom',
  'Co-working Space',
  'PG',
  'Hostel',
  'Retail Space',
  'Industrial Shed',
  'Land',
  'Duplex',
  'Triplex'
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    category: '',
    bhk: '',
    status: ''
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await getProperties(filters);
      setProperties(response.data.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const resolveImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/300x200?text=Property';
    if (url.startsWith('http')) return url;
    return `${getBackendBaseUrl()}${url}`;
  };

  return (
    <div className="properties-page">
      <header>
        <h1>🏡 S.S ENTERPRISES</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/properties">Properties</Link>
        </nav>
      </header>

      <div className="container properties-shell" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.6rem' }}>Find Your Perfect Property</h2>
        <p className="properties-sub">Verified listings with real location insights, Indian pricing and transparent discounts.</p>

        <div className="card properties-filter-card" style={{ marginBottom: '2rem' }}>
          <div className="properties-filter-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>City</label>
              <select name="city" value={filters.city} onChange={handleFilterChange}>
                <option value="">All Cities</option>
                <option value="Mathura">Mathura</option>
                <option value="Agra">Agra</option>
                <option value="Noida">Noida</option>
                <option value="Delhi">Delhi</option>
                <option value="Gurugram">Gurugram</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Category</label>
              <select name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>BHK</label>
              <select name="bhk" value={filters.bhk} onChange={handleFilterChange}>
                <option value="">All BHK</option>
                <option value="Studio">Studio</option>
                <option value="1RK">1 RK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
                <option value="5">5 BHK</option>
                <option value="6+">6+ BHK</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Project Stage</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Stages</option>
                <option value="Active">Active</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>Loading properties...</p>
        ) : properties.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#64748b' }}>
            No properties found. Try different filters.
          </p>
        ) : (
          <>
            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
              Found {properties.length} properties
            </p>
            <div className="grid properties-grid">
              {properties.map(property => (
                <article key={property._id} className="property-card property-card-v2">
                  <img 
                    src={resolveImageUrl(property.images?.[0]?.url)} 
                    alt={property.title}
                  />
                  <div className="property-card-content">
                    <div className="property-badge-row">
                      <span className="property-badge-main">{property.category || property.type}</span>
                      <span className="property-badge-soft">{property.status}</span>
                    </div>
                    <h3>{property.title}</h3>
                    <p><strong>{property.city}</strong></p>
                    <p>{property.location}</p>
                    <p className="property-spec-line">{property.bhk} BHK • {(property.areaSqft || property.area)} sq.ft. • {(property.areaGaj || ((property.area || 0) / 9).toFixed(2))} gaj</p>
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

                    <Link to={`/property/${property._id}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <footer style={{
        background: '#0f172a',
        color: 'white',
        textAlign: 'center',
        padding: '2rem',
        marginTop: '4rem'
      }}>
        <p>&copy; 2024 S.S Enterprises. All rights reserved.</p>
      </footer>
    </div>
  );
}
