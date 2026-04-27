const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Property = require('../models/Property');
const { verifyToken } = require('./authRoutes');

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

function isAdminRequest(req) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.role === 'admin';
  } catch {
    return false;
  }
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const toDataUri = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

const makeFilename = (file) => {
  const extension = String(file.originalname || 'image.jpg').split('.').pop().toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  // Keep file size small because image data is stored directly inside MongoDB documents.
  limits: { fileSize: 1200 * 1024 } // 1.2MB per image
});

// Get all properties
router.get('/', async (req, res) => {
  try {
    const { city, type, category, bhk, min, max, status } = req.query;
    const adminMode = isAdminRequest(req);
    let filter = adminMode ? {} : { isActive: true };

    if (city) filter.city = city;
    if (category) filter.category = category;
    else if (type) filter.type = type;
    if (bhk) filter.bhk = bhk;
    if (status) filter.status = status;
    if (min || max) {
      filter.price = {};
      if (min) filter.price.$gte = Number(min);
      if (max) filter.price.$lte = Number(max);
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create property with images
router.post('/', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      city,
      location,
      price,
      originalPrice,
      discountPercent,
      category,
      type,
      bhk,
      area,
      areaSqft,
      areaGaj,
      amenities,
      nearbyLandmarks,
      facilitiesDescription,
      status
    } = req.body;

    const files = Array.isArray(req.files) ? req.files : [];
    const parsedAmenities = parseListField(amenities);
    const parsedLandmarks = parseListField(nearbyLandmarks);

    const resolvedCategory = String(category || type || '').trim();
    const resolvedOriginal = toNumber(originalPrice || price);
    const resolvedDiscount = Math.max(0, toNumber(discountPercent));
    const resolvedPrice = toNumber(price) || Number((resolvedOriginal * (1 - resolvedDiscount / 100)).toFixed(0));
    const resolvedSqft = toNumber(areaSqft || area || (toNumber(areaGaj) * 9));
    const resolvedGaj = toNumber(areaGaj || (resolvedSqft ? resolvedSqft / 9 : 0));

    if (!resolvedCategory) {
      return res.status(400).json({ success: false, error: 'Property category is required' });
    }

    if (!resolvedSqft || !resolvedGaj) {
      return res.status(400).json({ success: false, error: 'Property size in sq.ft and gaj is required' });
    }

    const images = files.map(file => ({
      url: toDataUri(file),
      filename: makeFilename(file)
    }));

    const property = new Property({
      title,
      description,
      city,
      location,
      price: resolvedPrice,
      originalPrice: resolvedOriginal || resolvedPrice,
      discountPercent: resolvedDiscount,
      category: resolvedCategory,
      type: resolvedCategory,
      bhk,
      area: resolvedSqft,
      areaSqft: resolvedSqft,
      areaGaj: Number(resolvedGaj.toFixed(2)),
      nearbyLandmarks: parsedLandmarks,
      facilitiesDescription: facilitiesDescription || '',
      amenities: parsedAmenities,
      images,
      status: status || 'Active'
    });

    await property.save();
    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update property
router.put('/:id', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      city,
      location,
      price,
      originalPrice,
      discountPercent,
      category,
      type,
      bhk,
      area,
      areaSqft,
      areaGaj,
      amenities,
      nearbyLandmarks,
      facilitiesDescription,
      status
    } = req.body;

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Update basic fields
    if (title) property.title = title;
    if (description) property.description = description;
    if (city) property.city = city;
    if (location) property.location = location;
    const resolvedCategory = String(category || type || '').trim();
    if (resolvedCategory) {
      property.category = resolvedCategory;
      property.type = resolvedCategory;
    }
    if (bhk) property.bhk = bhk;

    const resolvedSqft = toNumber(areaSqft || area || (toNumber(areaGaj) * 9));
    const resolvedGaj = toNumber(areaGaj || (resolvedSqft ? resolvedSqft / 9 : 0));
    if (resolvedSqft) {
      property.area = resolvedSqft;
      property.areaSqft = resolvedSqft;
    }
    if (resolvedGaj) {
      property.areaGaj = Number(resolvedGaj.toFixed(2));
    }

    const resolvedOriginal = toNumber(originalPrice);
    const resolvedDiscount = toNumber(discountPercent);
    const resolvedPrice = toNumber(price);

    if (originalPrice !== undefined && originalPrice !== '') property.originalPrice = resolvedOriginal;
    if (discountPercent !== undefined && discountPercent !== '') property.discountPercent = Math.max(0, resolvedDiscount);
    if (price !== undefined && price !== '') property.price = resolvedPrice;

    if (property.originalPrice && property.discountPercent > 0 && !resolvedPrice) {
      property.price = Number((property.originalPrice * (1 - property.discountPercent / 100)).toFixed(0));
    }

    if (amenities !== undefined) {
      property.amenities = parseListField(amenities);
    }
    if (nearbyLandmarks !== undefined) {
      property.nearbyLandmarks = parseListField(nearbyLandmarks);
    }
    if (facilitiesDescription !== undefined) {
      property.facilitiesDescription = facilitiesDescription;
    }
    if (status) property.status = status;

    // Handle new images
    if (Array.isArray(req.files) && req.files.length > 0) {
      const totalImageCount = (property.images?.length || 0) + req.files.length;
      if (totalImageCount > 5) {
        return res.status(400).json({ success: false, error: 'Maximum 5 images are allowed per property' });
      }

      const newImages = req.files.map(file => ({
        url: toDataUri(file),
        filename: makeFilename(file)
      }));
      property.images = [...property.images, ...newImages];
    }

    await property.save();
    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete property image
router.delete('/:id/image/:filename', verifyToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    const decodedFilename = decodeURIComponent(req.params.filename);
    const imageToRemove = property.images.find(img => img.filename === decodedFilename);
    if (!imageToRemove) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    // Remove from database
    property.images = property.images.filter(img => img.filename !== decodedFilename);
    await property.save();

    res.json({ success: true, message: 'Image deleted successfully', data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete property
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
