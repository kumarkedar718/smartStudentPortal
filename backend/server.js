const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontEnd')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);

// Fallback to frontEnd/SSP.html for single page application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontEnd/SSP.html'));
});

// Start Server with EADDRINUSE handling
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Smart Student Portal Server is running on port ${PORT}`);
  console.log(`Open in browser: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use (Server is already running!)`);
    console.log(`Please open http://localhost:${PORT} in your browser.`);
  } else {
    console.error('Server error:', err);
  }
});

