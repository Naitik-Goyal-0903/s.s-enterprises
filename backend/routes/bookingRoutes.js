const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { verifyToken } = require('./authRoutes');

// Get all bookings
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, phone } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (phone) filter.phone = { $regex: phone, $options: 'i' };

    const bookings = await Booking.find(filter).populate('propertyId').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get booking stats
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const total = await Booking.countDocuments();
    const byStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {};
    byStatus.forEach(item => {
      stats[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get booking by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('propertyId');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create booking 
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, propertyId, propertyName, visitDate, message, budget, interest } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, email, and propertyId are required'
      });
    }

    const booking = new Booking({
      name,
      phone,
      email,
      propertyId,
      propertyName: propertyName || 'Property',
      visitDate: visitDate ? new Date(visitDate) : null,
      message,
      budget,
      interest,
      source: 'Website'
    });

    await booking.save();
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update booking status/notes
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { status, notes, visitDate } = req.body;
    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      updateData.status = status;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'notes')) {
      updateData.notes = notes;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'visitDate')) {
      updateData.visitDate = visitDate ? new Date(visitDate) : null;
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('propertyId');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete booking
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
