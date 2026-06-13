const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @route   POST /api/alerts/analyze
 * @desc    Analyze uploaded image/snapshot using the Python AI microservice
 * @access  Public
 */
router.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image data provided for analysis' });
    }

    let buffer;
    if (image.startsWith('data:image')) {
      const base64Data = image.split(';base64,').pop();
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({ message: 'Invalid image format. Base64 data URI required.' });
    }

    // Prepare FormData for Python AI microservice
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('media', blob, 'snapshot.jpg');

    // Call Flask AI service on port 5001
    const aiResponse = await fetch('http://localhost:5001/analyze', {
      method: 'POST',
      body: formData
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[AI SERVICE ERROR]', errorText);
      return res.status(502).json({ message: 'AI microservice returned an error', error: errorText });
    }

    const data = await aiResponse.json();
    return res.json(data);
  } catch (error) {
    console.error('[ANALYZE ROUTE ERROR]', error.message);
    return res.status(500).json({ message: 'Internal server error during AI analysis' });
  }
});

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts (sorted by newest timestamp first)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    return res.json(alerts);
  } catch (error) {
    console.error('[GET ALERTS ERROR]', error.message);
    return res.status(500).json({ message: 'Server error retrieving alerts database' });
  }
});

/**
 * @route   GET /api/alerts/:id
 * @desc    Get a single alert by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Emergency alert report not found' });
    }
    
    return res.json(alert);
  } catch (error) {
    console.error('[GET ALERT BY ID ERROR]', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Emergency alert report not found' });
    }
    return res.status(500).json({ message: 'Server error retrieving alert details' });
  }
});

/**
 * @route   POST /api/alerts
 * @desc    Create a new emergency alert report
 * @access  Protected (Authenticated Users)
 */
router.post('/', async (req, res) => {
  try {
    const { category, severity, location, latitude, longitude, description, imageUrl } = req.body;

    // Validation
    if (!category || !severity || !location || !latitude || !longitude || !description) {
      return res.status(400).json({ message: 'Please provide all required alert parameters' });
    }

    // Determine reporter - support authenticated user or anonymous fallback
    let reporter = 'Anonymous Citizen';
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          reporter = user.email;
        }
      } catch (err) {
        console.warn('[ALERT ROUTE] Invalid token supplied, falling back to anonymous reporter');
      }
    }

    const newAlert = await Alert.create({
      category,
      severity,
      location,
      latitude,
      longitude,
      description,
      imageUrl,
      reporter
    });

    return res.status(201).json(newAlert);
  } catch (error) {
    console.error('[CREATE ALERT ERROR]', error.message);
    return res.status(500).json({ message: 'Server error generating alert report' });
  }
});

/**
 * @route   PUT /api/alerts/:id
 * @desc    Update alert properties (e.g. modify severity, resolve status, assign agency)
 * @access  Protected (Authenticated Users)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { category, severity, location, description, resolved, assignedAgency } = req.body;
    
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Emergency alert report not found' });
    }

    // Apply updates if present
    if (category) alert.category = category;
    if (severity) alert.severity = severity;
    if (location) alert.location = location;
    if (description) alert.description = description;
    if (typeof resolved === 'boolean') alert.resolved = resolved;
    
    // Assign agency update (supports resetting with empty string or undefined)
    if (assignedAgency !== undefined) {
      alert.assignedAgency = assignedAgency === '' ? undefined : assignedAgency;
    }

    const updatedAlert = await alert.save();
    return res.json(updatedAlert);
  } catch (error) {
    console.error('[UPDATE ALERT ERROR]', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Emergency alert report not found' });
    }
    return res.status(500).json({ message: 'Server error modifying alert details' });
  }
});

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete an emergency alert report from database
 * @access  Restricted (Admin Users Only)
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Emergency alert report not found' });
    }

    await Alert.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Incident report successfully deleted from database log' });
  } catch (error) {
    console.error('[DELETE ALERT ERROR]', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Emergency alert report not found' });
    }
    return res.status(500).json({ message: 'Server error deleting incident report' });
  }
});

module.exports = router;
