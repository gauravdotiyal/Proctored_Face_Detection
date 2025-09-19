 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const proctoringRoutes = require('./routes/proctoring.cjs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI  || 'mongodb+srv://gauravdotiyal33_db_user:Ffuv1Z0TiJGNsqo1@cluster0.1cbbfut.mongodb.net/ProctoredDemo';

app.use(cors());
app.use(express.json());

const path = require('path');

// ✅ Mount API routes first
app.use('/api/proctoring', proctoringRoutes);

// ✅ Serve static frontend AFTER API routes
app.use(express.static(path.resolve(__dirname, '..', 'dist')));

// ✅ Fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
});


// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error :', error);
  });