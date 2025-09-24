const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');
const { authenticateToken, validateInput } = require('./middleware/auth');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'https://yourdomain.com'] 
    : true,
  credentials: true
}));

// Body parsing middleware with enhanced security
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Basic JSON parsing protection
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input validation middleware
app.use(validateInput);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Serve root-level assets needed by index.html (legacy paths)
app.get('/services.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'services.json'));
});
app.get('/contact.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'contact.json'));
});
app.get('/courses.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'courses.json'));
});

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
  try {
    await fs.access('./uploads');
  } catch {
    await fs.mkdir('./uploads', { recursive: true });
  }
};
const createDataDir = async () => {
  try {
    await fs.access('./data');
  } catch {
    await fs.mkdir('./data', { recursive: true });
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// Simple analytics store in JSON
const analyticsFile = path.join(__dirname, 'data', 'analytics.json');
const getToday = () => new Date().toISOString().slice(0, 10);
const readAnalytics = async () => {
  try {
    const data = await fs.readFile(analyticsFile, 'utf8');
    const parsed = JSON.parse(data);
    // Normalize legacy shapes
    if (parsed && typeof parsed === 'object') {
      if (parsed.visits !== undefined) {
        // Legacy flat shape -> convert
        return {
          totals: { visits: parsed.visits || 0, uniqueVisitors: 0 },
          byDate: {},
          byPath: {},
          visitors: { overall: {} }
        };
      }
      // Ensure all keys exist
      parsed.totals = parsed.totals || { visits: 0, uniqueVisitors: 0 };
      parsed.byDate = parsed.byDate || {};
      parsed.byPath = parsed.byPath || {};
      parsed.visitors = parsed.visitors || { overall: {} };
      if (!parsed.visitors.overall) parsed.visitors.overall = {};
      return parsed;
    }
    return {
      totals: { visits: 0, uniqueVisitors: 0 },
      byDate: {},
      byPath: {},
      visitors: { overall: {} }
    };
  } catch {
    return {
      totals: { visits: 0, uniqueVisitors: 0 },
      byDate: {}, // YYYY-MM-DD -> { visits, uniqueVisitors }
      byPath: {}, // path -> visits
      visitors: { overall: {} } // overall IP hashes; plus daily stores
    };
  }
};
const writeAnalytics = async (data) => {
  await fs.writeFile(analyticsFile, JSON.stringify(data, null, 2), 'utf8');
};
const hashIp = (ip) => crypto.createHmac('sha256', process.env.JWT_SECRET || 'salt').update(ip).digest('hex');

// Public: record a visit
app.post('/api/analytics/visit', async (req, res) => {
  try {
    const analytics = await readAnalytics();
    const pathVisited = (req.body && req.body.path) || '/';
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
    const ipHash = ip ? hashIp(ip) : null;
    const today = getToday();

    // totals
    analytics.totals.visits = (analytics.totals.visits || 0) + 1;
    if (ipHash) {
      if (!analytics.visitors.overall[ipHash]) {
        analytics.visitors.overall[ipHash] = true;
        analytics.totals.uniqueVisitors = (analytics.totals.uniqueVisitors || 0) + 1;
      }
    }

    // byPath
    analytics.byPath[pathVisited] = (analytics.byPath[pathVisited] || 0) + 1;

    // byDate
    if (!analytics.byDate[today]) {
      analytics.byDate[today] = { visits: 0, uniqueVisitors: 0 };
    }
    analytics.byDate[today].visits += 1;

    // daily unique
    if (!analytics.visitors[today]) analytics.visitors[today] = {};
    if (ipHash && !analytics.visitors[today][ipHash]) {
      analytics.visitors[today][ipHash] = true;
      analytics.byDate[today].uniqueVisitors += 1;
    }

    await writeAnalytics(analytics);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

// Admin: read analytics
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const analytics = await readAnalytics();
    const today = getToday();
    const byDateKeys = analytics.byDate ? Object.keys(analytics.byDate) : [];
    const last7 = byDateKeys
      .sort()
      .slice(-7)
      .map(d => ({ date: d, ...analytics.byDate[d] }));
    const byPathEntries = analytics.byPath ? Object.entries(analytics.byPath) : [];
    const topPaths = byPathEntries
      .sort((a,b) => b[1]-a[1])
      .slice(0, 5)
      .map(([path, visits]) => ({ path, visits }));

    res.json({
      totals: analytics.totals,
      today: analytics.byDate[today] || { visits: 0, uniqueVisitors: 0 },
      last7Days: last7,
      topPaths
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read analytics' });
  }
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve main website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  await Promise.all([createUploadsDir(), createDataDir()]);
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🌐 Main website: http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch(console.error);
