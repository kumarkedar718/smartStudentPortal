const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Login Endpoint for Students & Teachers
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide username, password and role.' });
    }

    // Find user by username or roll_number/teacher_code or email
    const users = await db.query(
      `SELECT * FROM users WHERE (username = ? OR email = ?) AND role = ?`,
      [username, username, role]
    );

    let user = users.length > 0 ? users[0] : null;

    // If not found by username, check roll_number or teacher_code
    if (!user) {
      if (role === 'student') {
        const stuRecords = await db.query(
          `SELECT u.* FROM users u JOIN students s ON u.id = s.user_id WHERE s.roll_number = ?`,
          [username]
        );
        if (stuRecords.length > 0) user = stuRecords[0];
      } else if (role === 'teacher') {
        const tchRecords = await db.query(
          `SELECT u.* FROM users u JOIN teachers t ON u.id = t.user_id WHERE t.teacher_code = ?`,
          [username]
        );
        if (tchRecords.length > 0) user = tchRecords[0];
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: `No ${role} found with username/ID: ${username}` });
    }

    // Direct password comparison for simple setup
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }

    // Fetch role details
    let roleDetails = {};
    if (user.role === 'student') {
      const students = await db.query('SELECT * FROM students WHERE user_id = ?', [user.id]);
      if (students.length > 0) roleDetails = students[0];
    } else if (user.role === 'teacher') {
      const teachers = await db.query('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
      if (teachers.length > 0) roleDetails = teachers[0];
    }

    return res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: roleDetails.id || null,
        teacherId: roleDetails.id || null,
        rollNumber: roleDetails.roll_number || null,
        teacherCode: roleDetails.teacher_code || null,
        department: roleDetails.department || '',
        semester: roleDetails.semester || '',
        batch: roleDetails.batch || ''
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login: ' + error.message });
  }
});

module.exports = router;
