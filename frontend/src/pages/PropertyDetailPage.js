import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBackendBaseUrl, getProperty, createBooking } from '../services/api';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    name: '',
    phone: '',
    email: '',
    interest: '',
    budget: ''
  });
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await getProperty(id);
      setProperty(response.data.data);
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    try {
      const bookingData = {
        ...booking,
        propertyId: id,
        propertyName: property.title
      };

      const response = await createBooking(bookingData);

      if (response.data.success) {
        setBookingSubmitted(true);

        // Redirect to WhatsApp
        const whatsappNumber = process.env.REACT_APP_WHATSAPP || '7078542301';
        const message = `Hello, I'm interested in the property: ${property.title} (${property.location}). My name is ${booking.name} and my phone number is ${booking.phone}. Kindly let me know what details or documents are required from my side so that I can provide all the necessary information accordingly.`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');

        // Reset form
        setTimeout(() => {
          setBooking({ name: '', phone: '', email: '', interest: '', budget: '' });
          setBookingSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error submitting booking. Please try again.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const resolveImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/600x400?text=Property';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${getBackendBaseUrl()}${url}`;
  };

  const gallery = property?.images?.length ? property.images : [{ url: 'https://via.placeholder.com/600x400?text=Property' }];

  if (loading) {
    return (
      <div>
        <header>
          <h1>🏡 S.S ENTERPRISES</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/properties">Properties</Link>
          </nav>
        </header>
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading property...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <header>
          <h1>🏡 S.S ENTERPRISES</h1>
        </header>
        <div style={{ textAlign: 'center', padding: '4rem' }}>Property not found</div>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>🏡 S.S ENTERPRISES</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/properties">Properties</Link>
        </nav>
      </header>

      <div className="container" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/properties')} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
          ← Back to Properties
        </button>

        <div className="property-detail-grid" style={{ marginBottom: '2rem' }}>
          <div className="property-gallery-panel">
            <img 
              src={resolveImageUrl(gallery[activeImage]?.url)} 
              alt={property.title}
              className="property-main-image"
            />
            <div className="property-thumbnail-row">
              {gallery.slice(0, 5).map((img, idx) => (
                <img 
                  key={idx}
                  src={resolveImageUrl(img.url)} 
                  alt={`Preview ${idx + 1}`}
                  className={idx === activeImage ? 'property-thumb active' : 'property-thumb'}
                  onClick={() => setActiveImage(idx)}
                />
              ))}
            </div>
          </div>

          <div className="property-meta-panel">
            <h1>{property.title}</h1>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>{property.city}, {property.location}</p>

            <div className="property-price-showcase">
              {Number(property.discountPercent || 0) > 0 && (
                <p className="property-old-price">{formatPrice(property.originalPrice || property.price)}</p>
              )}
              <div className="property-price">{formatPrice(property.price)}</div>
              {Number(property.discountPercent || 0) > 0 && (
                <span className="property-discount-chip">{Number(property.discountPercent).toFixed(1)}% OFF</span>
              )}
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <p><strong>Category:</strong> {property.category || property.type}</p>
              <p><strong>BHK:</strong> {property.bhk}</p>
              <p><strong>Area:</strong> {property.areaSqft || property.area} sq.ft. ({property.areaGaj || ((property.area || 0) / 9).toFixed(2)} gaj)</p>
              <p><strong>Status:</strong> <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>{property.status}</span></p>
            </div>

            {(property.nearbyLandmarks || []).length > 0 && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '0.8rem' }}>Nearby Landmarks</h3>
                <div className="property-chip-wrap">
                  {(property.nearbyLandmarks || []).map((item) => (
                    <span key={item} className="property-chip">{item}</span>
                  ))}
                </div>
              </div>
            )}

            <h3 style={{ marginBottom: '1rem' }}>Amenities</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {property.amenities?.map((amenity, idx) => (
                <span key={idx} style={{ background: '#e0f2fe', color: '#0c4a6e', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                  ✓ {amenity}
                </span>
              ))}
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Description</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {property.description}
            </p>

            {property.facilitiesDescription && (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Facilities & Locality Advantage</h3>
                <p style={{ color: '#64748b', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                  {property.facilitiesDescription}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Schedule Booking / Enquiry</h3>
          
          {bookingSubmitted && (
            <div className="alert alert-success">
              ✓ Request submitted! Redirecting to WhatsApp...
            </div>
          )}

          <form onSubmit={handleBookingSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={booking.name}
                  onChange={handleBookingChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={booking.phone}
                  onChange={handleBookingChange}
                  required
                  placeholder="10-digit number"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  name="email"
                  value={booking.email}
                  onChange={handleBookingChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label>Budget (Optional)</label>
                <input 
                  type="text" 
                  name="budget"
                  value={booking.budget}
                  onChange={handleBookingChange}
                  placeholder="e.g., 50-60 lakh"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Interest / Additional Notes</label>
              <textarea 
                name="interest"
                value={booking.interest}
                onChange={handleBookingChange}
                rows="3"
                placeholder="Tell us more about your requirement..."
                style={{ marginBottom: '1rem' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
              disabled={bookingSubmitted}
            >
              {bookingSubmitted ? '✓ Processing...' : 'Continue to WhatsApp'}
            </button>
          </form>
        </div>
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
