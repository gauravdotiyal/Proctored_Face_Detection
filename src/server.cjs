const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const proctoringRoutes = require('./routes/proctoring.cjs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutedude';

app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.resolve(__dirname, '..', 'dist')));

// fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
});

// API routes
app.use('/api/proctoring', proctoringRoutes);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });