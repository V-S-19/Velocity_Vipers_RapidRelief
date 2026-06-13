const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic Route for service status health check
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'UP',
    message: 'RapidRelief Backend API Service is fully operational.',
    timestamp: new Date()
  });
});

// Mounting API routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));

// 404 Undefined route fallback handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API Endpoint not found: [${req.method}] ${req.originalUrl}` });
});

// Global central error handler middleware
app.use((err, req, res, next) => {
  console.error('[GLOBAL SERVER ERROR]', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong inside the RapidRelief server. Please check logs.',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SERVER] RapidRelief backend is running on port ${PORT}`);
});
