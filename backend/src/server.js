const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const routeRoutes = require('./routes/route.routes');
const riskRoutes = require('./routes/risk.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
    ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim())
    : true
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
}));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NER Logistics API'
  });
});

app.use('/api', routeRoutes);
app.use('/api', riskRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`NER Logistics API running on port ${PORT}`);
  });
}

module.exports = app;
