const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  propertyName: {
    type: String,
    required: true
  },
  visitDate: {
    type: Date
  },
  message: {
    type: String
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Visited', 'Negotiating', 'Closed', 'Lost'],
    default: 'New'
  },
  source: {
    type: String,
    enum: ['Website', 'WhatsApp', 'Phone', 'Walk-in'],
    default: 'Website'
  },
  budget: {
    type: String
  },
  interest: {
    type: String
  },
  notes: {
    type: String
  },
  whatsappSent: {
    type: Boolean,
    default: false
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

module.exports = mongoose.model('Booking', bookingSchema);
