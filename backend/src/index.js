const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);


app.get('/', (req, res) => {
  res.send('Voice Interview Backend is running!');
});

// API Routes
const interviewRoutes = require('./api/routes/interviews');
const audioRoutes = require('./api/routes/audio');
const evaluationRoutes = require('./api/routes/evaluations');

app.use('/api/interviews', interviewRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/evaluations', evaluationRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
