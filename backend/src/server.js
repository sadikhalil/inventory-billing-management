'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Route imports
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// ── Database ─────────────────────────────────────────────
connectDB();

// ── Security Middleware ───────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  },
}));

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',  // Vite dev server
  'https://inventory-billing-management-fronte.vercel.app', // no trailing slash!
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Handle preflight requests
app.options('*', cors());

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

// ── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Inventory API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Root Route ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management API is running! 🚀',
    version: '1.0.0',
  });
});

// ── API Routes ────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/invoices`, invoiceRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/inventory`, inventoryRoutes);
app.use(`${API}/users`, userRoutes);

// ── Static Files ──────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── Error Handling ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

// ✅ Don't listen on Vercel production
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`📡 API Base: http://localhost:${PORT}/api/v1`);
    logger.info(`❤️  Health:  http://localhost:${PORT}/health`);
  });
}

module.exports = app;