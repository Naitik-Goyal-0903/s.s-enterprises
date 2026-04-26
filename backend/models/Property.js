const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 90
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    trim: true,
    required: true
  },
  bhk: {
    type: String,
    trim: true,
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  areaSqft: {
    type: Number,
    required: true
  },
  areaGaj: {
    type: Number,
    required: true
  },
  nearbyLandmarks: [{
    type: String,
    trim: true
  }],
  facilitiesDescription: {
    type: String,
    default: ''
  },
  amenities: [{
    type: String
  }],
  images: [{
    url: String,
    filename: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Under Construction', 'Upcoming', 'Sold', 'Rented'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

propertySchema.pre('validate', function normalizeDerivedFields(next) {
  const resolvedSqft = Number(this.areaSqft || this.area || 0);
  const resolvedGaj = Number(this.areaGaj || (resolvedSqft ? resolvedSqft / 9 : 0));

  if (resolvedSqft > 0) {
    this.areaSqft = Number(resolvedSqft.toFixed(2));
    this.area = this.areaSqft;
  }

  if (resolvedGaj > 0) {
    this.areaGaj = Number(resolvedGaj.toFixed(2));
  }

  if (!this.category && this.type) {
    this.category = this.type;
  }

  if (!this.type && this.category) {
    this.type = this.category;
  }

  if (!this.originalPrice) {
    this.originalPrice = this.price;
  }

  if (!this.price && this.originalPrice) {
    this.price = this.originalPrice;
  }

  if (this.originalPrice > 0 && this.price > 0) {
    const percent = ((this.originalPrice - this.price) / this.originalPrice) * 100;
    this.discountPercent = Math.max(0, Number(percent.toFixed(2)));
  }

  if (this.discountPercent > 0 && this.originalPrice > 0 && (!this.price || this.price >= this.originalPrice)) {
    this.price = Number((this.originalPrice * (1 - this.discountPercent / 100)).toFixed(0));
  }

  next();
});

module.exports = mongoose.model('Property', propertySchema);
