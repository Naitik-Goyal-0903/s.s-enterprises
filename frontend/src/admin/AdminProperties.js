import React, { useState, useEffect, useMemo } from 'react';
import {
  getBackendBaseUrl,
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  deletePropertyImage
} from '../services/api';

const PROPERTY_CATEGORIES = [
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

const MAX_IMAGES = 5;

const roundTo = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export default function AdminProperties({ onPropertyAdded }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [busyImageFilename, setBusyImageFilename] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    location: '',
    category: 'Flat',
    customCategory: '',
    price: '',
    originalPrice: '',
    discountPercent: '',
    emiStartingPrice: '',
    type: 'Apartment',
    bhk: '1',
    areaSqft: '',
    areaGaj: '',
    nearbyLandmarks: '',
    facilitiesDescription: '',
    amenities: [],
    status: 'Active'
  });

  const amenitiesOptions = [
    'Parking',
    'Covered Parking',
    'Gym',
    'Pool',
    'Security',
    'Lift',
    'Club House',
    'Garden',
    'Power Backup',
    'Kids Play Area',
    'Jogging Track',
    'Community Hall',
    'Visitor Parking',
    'CCTV Surveillance',
    'Gated Society',
    'Intercom',
    'Modular Kitchen',
    'Air Conditioning',
    'Balcony',
    'Terrace',
    'Rainwater Harvesting',
    'EV Charging Point',
    'Fire Safety System',
    '24x7 Water Supply'
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await getProperties();
      setProperties(response.data.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchStatus = statusFilter === 'All' ? true : property.status === statusFilter;
      const q = searchText.trim().toLowerCase();
      const matchQuery =
        q.length === 0
          ? true
          : `${property.title} ${property.city} ${property.location}`.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [properties, searchText, statusFilter]);

  const pendingImagePreviews = useMemo(() => {
    return images.map((file, idx) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${idx}`,
      name: file.name,
      url: URL.createObjectURL(file)
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      pendingImagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [pendingImagePreviews]);

  const resolveImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/300x180?text=Property+Image';
    if (url.startsWith('http')) return url;
    return `${getBackendBaseUrl()}${url}`;
  };

  const appendImages = (newFiles) => {
    const availableSlots = Math.max(0, MAX_IMAGES - existingImages.length - images.length);

    if (availableSlots <= 0) {
      alert(`Maximum ${MAX_IMAGES} photos allowed per property. Delete an existing image first to add new one.`);
      return;
    }

    const accepted = newFiles.slice(0, availableSlots);
    if (accepted.length < newFiles.length) {
      alert(`Only ${availableSlots} more image(s) can be added for this property.`);
    }

    setImages((prev) => [...prev, ...accepted]);
  };

  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === 'amenities') {
      setForm((prev) => ({
        ...prev,
        amenities: checked
          ? [...(prev.amenities || []), value]
          : (prev.amenities || []).filter((item) => item !== value)
      }));
      return;
    }

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'areaSqft') {
        const sqft = Number(value);
        if (!value) {
          next.areaGaj = '';
        } else if (Number.isFinite(sqft) && sqft > 0) {
          next.areaGaj = String(roundTo(sqft / 9, 2));
        }
      }

      if (name === 'areaGaj') {
        const gaj = Number(value);
        if (!value) {
          next.areaSqft = '';
        } else if (Number.isFinite(gaj) && gaj > 0) {
          next.areaSqft = String(roundTo(gaj * 9, 2));
        }
      }

      const original = Number(name === 'originalPrice' ? value : next.originalPrice);
      const discount = Number(name === 'discountPercent' ? value : next.discountPercent);
      const offer = Number(name === 'price' ? value : next.price);

      if (name === 'discountPercent') {
        if (!value) {
          next.discountPercent = '';
          if (Number.isFinite(original) && original > 0) {
            next.price = String(Math.round(original));
          }
        } else if (Number.isFinite(original) && original > 0) {
          const safeDiscount = Math.max(0, Math.min(discount, 90));
          next.discountPercent = String(roundTo(safeDiscount, 2));
          next.price = String(Math.round(original * (1 - safeDiscount / 100)));
        }
      }

      if (name === 'price') {
        if (!value) {
          next.discountPercent = '';
        } else if (Number.isFinite(original) && original > 0 && Number.isFinite(offer) && offer >= 0) {
          const computedDiscount = Math.max(0, ((original - offer) / original) * 100);
          next.discountPercent = String(roundTo(computedDiscount, 2));
        }
      }

      if (name === 'originalPrice') {
        if (!value) {
          next.discountPercent = '';
        } else if (Number.isFinite(original) && original > 0) {
          if (next.discountPercent !== '' && Number.isFinite(discount)) {
            const safeDiscount = Math.max(0, Math.min(discount, 90));
            next.price = String(Math.round(original * (1 - safeDiscount / 100)));
            next.discountPercent = String(roundTo(safeDiscount, 2));
          } else if (next.price !== '' && Number.isFinite(offer) && offer >= 0) {
            const computedDiscount = Math.max(0, ((original - offer) / original) * 100);
            next.discountPercent = String(roundTo(computedDiscount, 2));
          }
        }
      }

      return next;
    });
  };

  const handleSingleImageAdd = (e) => {
    const [single] = Array.from(e.target.files || []);
    if (single) {
      appendImages([single]);
    }
    e.target.value = '';
  };

  const handleBulkImageAdd = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      appendImages(selectedFiles);
    }
    e.target.value = '';
  };

  const removePendingImage = (previewKey) => {
    setImages((prev) => {
      const previews = prev.map((file, idx) => `${file.name}-${file.size}-${file.lastModified}-${idx}`);
      const index = previews.indexOf(previewKey);
      if (index === -1) return prev;

      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const removeExistingImage = async (filename) => {
    if (!editingId || !filename) return;
    if (!window.confirm('Delete this image from this property?')) return;

    try {
      setBusyImageFilename(filename);
      const response = await deletePropertyImage(editingId, filename);
      const updated = response?.data?.data;

      if (updated?.images) {
        setExistingImages(updated.images);
        setProperties((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      } else {
        setExistingImages((prev) => prev.filter((img) => img.filename !== filename));
      }
    } catch (error) {
      const message = error?.response?.data?.error || 'Unable to delete image right now.';
      alert(message);
    } finally {
      setBusyImageFilename('');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      city: '',
      location: '',
      category: 'Flat',
      customCategory: '',
      price: '',
      originalPrice: '',
      discountPercent: '',
      emiStartingPrice: '',
      type: 'Apartment',
      bhk: '1',
      areaSqft: '',
      areaGaj: '',
      nearbyLandmarks: '',
      facilitiesDescription: '',
      amenities: [],
      status: 'Active'
    });
    setImages([]);
    setExistingImages([]);
    setEditingId(null);
    setShowModal(false);
  };

  const openForCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openForEdit = (property) => {
    setEditingId(property._id);
    setForm({
      title: property.title || '',
      description: property.description || '',
      city: property.city || '',
      location: property.location || '',
      category: PROPERTY_CATEGORIES.includes(property.category || property.type) ? (property.category || property.type) : 'Other',
      customCategory: PROPERTY_CATEGORIES.includes(property.category || property.type) ? '' : (property.category || property.type || ''),
      price: String(property.price || ''),
      originalPrice: String(property.originalPrice || property.price || ''),
      discountPercent: String(property.discountPercent || ''),
      emiStartingPrice: String(property.emiStartingPrice || ''),
      type: property.type || 'Flat',
      bhk: String(property.bhk || '1'),
      areaSqft: String(property.areaSqft || property.area || ''),
      areaGaj: String(property.areaGaj || (property.area ? Number(property.area / 9).toFixed(2) : '')),
      nearbyLandmarks: (property.nearbyLandmarks || []).join(', '),
      facilitiesDescription: property.facilitiesDescription || '',
      amenities: property.amenities || [],
      status: property.status || 'Active'
    });
    setExistingImages(property.images || []);
    setImages([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!editingId && images.length === 0) {
        alert('Please upload at least one property photo.');
        return;
      }

      const resolvedCategory = form.category === 'Other' ? form.customCategory.trim() : form.category;
      const resolvedOriginalPrice = Number(form.originalPrice || form.price || 0);
      const resolvedDiscount = Number(form.discountPercent || 0);
      const resolvedPrice = Number(form.price || 0) || Number((resolvedOriginalPrice * (1 - resolvedDiscount / 100)).toFixed(0));
      const resolvedSqft = Number(form.areaSqft || 0);
      const resolvedGaj = Number(form.areaGaj || (resolvedSqft ? resolvedSqft / 9 : 0));

      if (!resolvedCategory) {
        alert('Please select or enter a property category.');
        return;
      }

      const availableSlots = Math.max(0, MAX_IMAGES - existingImages.length);
      if (images.length > availableSlots) {
        alert(`You can upload only ${availableSlots} more image(s) for this property.`);
        return;
      }

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('city', form.city);
      formData.append('location', form.location);
      formData.append('category', resolvedCategory);
      formData.append('type', resolvedCategory);
      formData.append('price', String(resolvedPrice));
      formData.append('originalPrice', String(resolvedOriginalPrice || resolvedPrice));
      formData.append('discountPercent', String(resolvedDiscount));
      formData.append('emiStartingPrice', String(form.emiStartingPrice || 0));
      formData.append('bhk', form.bhk);
      formData.append('areaSqft', String(resolvedSqft));
      formData.append('areaGaj', String(Number(resolvedGaj.toFixed(2))));
      formData.append('area', String(resolvedSqft));
      formData.append('nearbyLandmarks', JSON.stringify(form.nearbyLandmarks.split(',').map((item) => item.trim()).filter(Boolean)));
      formData.append('facilitiesDescription', form.facilitiesDescription);
      formData.append('amenities', JSON.stringify(form.amenities));
      formData.append('status', form.status);
      images.forEach((img) => formData.append('images', img));

      if (editingId) {
        await updateProperty(editingId, formData);
      } else {
        await createProperty(formData);
      }

      resetForm();
      fetchProperties();
      onPropertyAdded?.();
    } catch (error) {
      const message = error?.response?.data?.error || 'Unable to save property. Please try again.';
      alert(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this property permanently?')) return;
    try {
      await deleteProperty(id);
      fetchProperties();
      onPropertyAdded?.();
    } catch (error) {
      alert('Unable to delete property.');
    }
  };

  return (
    <div>
      <div className="admin-module-head">
        <div>
          <h2>Inventory Management</h2>
          <p>Maintain listings, status, and media assets from one place.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={openForCreate}>
          Add New Property
        </button>
      </div>

      <div className="admin-filters-bar">
        <input
          type="text"
          placeholder="Search by title, city or location"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Under Construction">Under Construction</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Sold">Sold</option>
          <option value="Rented">Rented</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <p>Loading properties...</p>
        ) : filteredProperties.length === 0 ? (
          <p className="admin-muted">No properties found for current filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Location</th>
                <th>Specs</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr key={property._id}>
                  <td>
                    <strong>{property.title}</strong>
                    <p className="admin-mini-text">{property.images?.length || 0} photos</p>
                  </td>
                  <td>
                    <strong>{property.city}</strong>
                    <p className="admin-mini-text">{property.location}</p>
                  </td>
                  <td>
                    <p className="admin-mini-text">{property.category || property.type} • {property.bhk} BHK</p>
                    <p className="admin-mini-text">{property.areaSqft || property.area} sq.ft. • {property.areaGaj || (property.area ? (property.area / 9).toFixed(2) : '-')} gaj</p>
                  </td>
                  <td>
                    {Number(property.discountPercent || 0) > 0 && (
                      <p className="admin-mini-text" style={{ textDecoration: 'line-through' }}>
                        ₹{Number(property.originalPrice || property.price).toLocaleString('en-IN')}
                      </p>
                    )}
                    <strong>₹{Number(property.price).toLocaleString('en-IN')}</strong>
                    {Number(property.discountPercent || 0) > 0 && (
                      <p className="admin-mini-text" style={{ color: '#b45309' }}>
                        {Number(property.discountPercent).toFixed(1)}% off
                      </p>
                    )}
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge-${(property.status || 'active').toLowerCase().replace(/\s+/g, '-')}`}>
                      {property.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="btn btn-primary" onClick={() => openForEdit(property)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(property._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={`modal ${showModal ? 'active' : ''}`}>
        <div className="modal-content admin-modal-wide">
          <div className="modal-header">
            <h2>{editingId ? 'Edit Property Listing' : 'Create Property Listing'}</h2>
            <button className="close-btn" onClick={resetForm}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Upload Photos (Max 5)</label>
              <div className="admin-image-input-grid">
                <div>
                  <label className="admin-mini-text">Add One By One</label>
                  <input type="file" accept="image/*" onChange={handleSingleImageAdd} />
                </div>
                <div>
                  <label className="admin-mini-text">Add Multiple Together</label>
                  <input type="file" multiple accept="image/*" onChange={handleBulkImageAdd} />
                </div>
              </div>
              <p className="admin-mini-text">
                Existing: {existingImages.length} | New selected: {images.length} | Total after save: {existingImages.length + images.length}/{MAX_IMAGES}
              </p>

              {existingImages.length > 0 && (
                <div className="admin-image-gallery">
                  {existingImages.map((img) => (
                    <div key={img.filename || img.url} className="admin-image-card">
                      <a href={resolveImageUrl(img.url)} target="_blank" rel="noopener noreferrer">
                        <img src={resolveImageUrl(img.url)} alt="Existing property" className="admin-image-thumb" />
                      </a>
                      <div className="admin-image-actions">
                        <a
                          className="btn btn-secondary"
                          href={resolveImageUrl(img.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeExistingImage(img.filename)}
                          disabled={busyImageFilename === img.filename}
                        >
                          {busyImageFilename === img.filename ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingImagePreviews.length > 0 && (
                <div className="admin-image-gallery">
                  {pendingImagePreviews.map((item) => (
                    <div key={item.key} className="admin-image-card">
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <img src={item.url} alt={item.name} className="admin-image-thumb" />
                      </a>
                      <p className="admin-mini-text">{item.name}</p>
                      <div className="admin-image-actions">
                        <a className="btn btn-secondary" href={item.url} target="_blank" rel="noopener noreferrer">View</a>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removePendingImage(item.key)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-form-grid">
              <div className="form-group">
                <label>Title *</label>
                <input type="text" name="title" value={form.title} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input type="text" name="city" value={form.city} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input type="text" name="location" value={form.location} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleFormChange} required>
                  {PROPERTY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
              </div>

              {form.category === 'Other' && (
                <div className="form-group">
                  <label>Custom Category *</label>
                  <input
                    type="text"
                    name="customCategory"
                    value={form.customCategory}
                    onChange={handleFormChange}
                    placeholder="e.g. Row House, Holiday Home"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Rate After Discount (INR) *</label>
                <input type="number" name="price" value={form.price} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Original Price (INR) *</label>
                <input type="number" name="originalPrice" value={form.originalPrice} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Discount %</label>
                <input type="number" name="discountPercent" min="0" max="90" step="0.1" value={form.discountPercent} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>EMI Starting From (INR) 💰</label>
                <input type="number" name="emiStartingPrice" value={form.emiStartingPrice} onChange={handleFormChange} placeholder="e.g., 25000" />
                <p className="admin-mini-text">Monthly EMI starting price (optional)</p>
              </div>
              <div className="form-group">
                <label>BHK</label>
                <select name="bhk" value={form.bhk} onChange={handleFormChange}>
                  <option value="Studio">Studio</option>
                  <option value="1RK">1 RK</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6+">6+</option>
                </select>
              </div>
              <div className="form-group">
                <label>Size (sq.ft.) *</label>
                <input type="number" name="areaSqft" value={form.areaSqft} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Size (gaj) *</label>
                <input type="number" name="areaGaj" value={form.areaGaj} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleFormChange}>
                  <option>Active</option>
                  <option>Under Construction</option>
                  <option>Upcoming</option>
                  <option>Sold</option>
                  <option>Rented</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Nearby Landmarks (comma separated) *</label>
              <input
                type="text"
                name="nearbyLandmarks"
                value={form.nearbyLandmarks}
                onChange={handleFormChange}
                placeholder="e.g. Metro Station, DPS School, City Mall"
                required
              />
            </div>

            <div className="form-group">
              <label>Facilities Description *</label>
              <textarea
                name="facilitiesDescription"
                value={form.facilitiesDescription}
                onChange={handleFormChange}
                rows="3"
                placeholder="Describe nearby roads, hospitals, schools, commute, and lifestyle value"
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={form.description} onChange={handleFormChange} rows="4" required />
            </div>

            <div className="form-group">
              <label>Amenities</label>
              <div className="admin-amenities-grid">
                {amenitiesOptions.map((amenity) => (
                  <label key={amenity} className="admin-checkbox-row">
                    <input
                      type="checkbox"
                      name="amenities"
                      value={amenity}
                      checked={form.amenities.includes(amenity)}
                      onChange={handleFormChange}
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-modal-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Property' : 'Create Property'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
