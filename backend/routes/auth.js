const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../services/emailService');
const { protect } = require('../middleware/auth');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile (using verified JWT)
 * @access  Protected
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('[GET PROFILE ERROR]', error.message);
    return res.status(500).json({ message: 'Server error retrieving profile details' });
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new citizen/responder or admin user (sends email OTP)
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

    // Generate 6-digit random verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes limit

    // Create user in DB (unverified initially)
    const user = await User.create({
      email,
      password,
      role: userRole,
      isVerified: false,
      verificationOTP: otp,
      verificationOTPExpires: otpExpiry
    });

    if (user) {
      // Send verification email via Gmail SMTP
      const mailSent = await sendVerificationEmail(user.email, otp);
      
      return res.status(201).json({
        message: mailSent 
          ? 'Verification passcode sent to your email. Please verify to activate account.'
          : 'User registered. Failed to send mail, please trigger code re-send.',
        email: user.email,
        requiresVerification: true
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
 * @route   POST /api/auth/verify-email
 * @desc    Verify account email registration via 6-digit OTP code
 * @access  Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email address and verification code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    // Verify OTP code matches and hasn't expired
    if (user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired email verification passcode' });
    }

    // Activate User
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    return res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('[EMAIL VERIFICATION ERROR]', error.message);
    return res.status(500).json({ message: 'Server error during account verification' });
  }
});

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Generate and re-send a new verification code
 * @access  Public
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account has already been verified' });
    }

    // Generate new OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationOTP = otp;
    user.verificationOTPExpires = otpExpiry;
    await user.save();

    // Re-send verification email
    const mailSent = await sendVerificationEmail(user.email, otp);

    return res.json({
      message: mailSent 
        ? 'A fresh verification passcode has been dispatched to your email.'
        : 'Failed to send mail, please trigger code re-send again.',
      email: user.email
    });
  } catch (error) {
    console.error('[RESEND OTP ERROR]', error.message);
    return res.status(500).json({ message: 'Server error during passcode dispatch' });
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

    // Check if account is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Access Denied: Email address is unverified. Please verify your email first.',
        email: user.email,
        requiresVerification: true
      });
    }

    // Double-check: if user has admin role in DB, they must write the admin code to login as admin?
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
