const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new citizen/responder or admin user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, adminCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Role-based admin secret validation check
    let userRole = 'user';
    if (role === 'admin') {
      if (adminCode !== process.env.ADMIN_CODE) {
        return res.status(403).json({ 
          message: 'Access Denied: Invalid System Administrator registration passcode' 
        });
      }
      userRole = 'admin';
    }

    // Create user in DB
    const user = await User.create({
      email,
      password,
      role: userRole
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      return res.status(400).json({ message: 'Invalid user registration input' });
    }
  } catch (error) {
    console.error('[REGISTER ERROR]', error.message);
    return res.status(500).json({ message: 'Server error during user registration' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password credentials' });
    }

    // Match hashed password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password credentials' });
    }

    // Double-check: if user has admin role in DB, they must write the admin code to login as admin?
    // Wait, the requirement says: "make it so a normal user cant login as admin how tehy will need to write a specific code to login as admin"
    // To implement this precisely:
    // If the database role is 'admin', we can double check if they supplied the correct adminCode on login as well!
    // This perfectly matches: "make it so a normal user cant login as admin how tehy will need to write a specific code to login as admin"
    // Let's implement this!
    if (user.role === 'admin' && adminCode !== process.env.ADMIN_CODE) {
      return res.status(403).json({ 
        message: 'Access Denied: Administrative scope login requires the secret code' 
      });
    }

    return res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error.message);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
});

module.exports = router;
