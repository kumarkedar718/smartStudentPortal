const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Dashboard Summary
router.get('/dashboard/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    // Assigned courses
    const courses = await db.query(`SELECT * FROM courses WHERE teacher_id = ?`, [teacherId]);

    // Total Students
    const students = await db.query(`SELECT COUNT(*) as count FROM students`);

    // Pending Grading
    const pendingGrading = await db.query(
      `SELECT COUNT(s.id) as count
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE a.teacher_id = ? AND s.status = 'Pending'`,
      [teacherId]
    );

    res.json({
      success: true,
      data: {
        assignedCoursesCount: courses.length,
        totalStudentsCount: students[0].count || 0,
        pendingGradingCount: pendingGrading[0].count || 0,
        courses: courses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Teacher Schedule & Courses
router.get('/courses/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const courses = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM students) as enrolled_students 
       FROM courses c 
       WHERE c.teacher_id = ?`,
      [teacherId]
    );
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get Student Roster (All students or filter by course)
router.get('/students', async (req, res) => {
  try {
    const courseId = req.query.courseId;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const students = await db.query(
      `SELECT s.id as student_id, s.roll_number, s.department, s.semester, u.name, u.email,
              a.status as today_status
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN attendance a ON s.id = a.student_id AND a.course_id = ? AND a.date = ?
       ORDER BY s.roll_number`,
      [courseId || 0, date]
    );

    res.json({ success: true, data: students, date: date });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Mark / Save Attendance
router.post('/attendance', async (req, res) => {
  try {
    const { course_id, date, records } = req.body; // records: [{ student_id, status }]

    if (!course_id || !date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }

    for (let item of records) {
      const existing = await db.query(
        `SELECT id FROM attendance WHERE student_id = ? AND course_id = ? AND date = ?`,
        [item.student_id, course_id, date]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE attendance SET status = ? WHERE id = ?`,
          [item.status, existing[0].id]
        );
      } else {
        await db.query(
          `INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)`,
          [item.student_id, course_id, date, item.status]
        );
      }
    }

    res.json({ success: true, message: 'Attendance recorded successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Create New Assignment
router.post('/assignments', async (req, res) => {
  try {
    const { course_id, teacher_id, title, description, due_date, total_marks } = req.body;

    if (!course_id || !teacher_id || !title || !due_date) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    await db.query(
      `INSERT INTO assignments (course_id, teacher_id, title, description, due_date, total_marks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_id, teacher_id, title, description || '', due_date, total_marks || 100]
    );

    res.json({ success: true, message: 'Assignment created successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. View Submissions for Teacher's Assignments
router.get('/submissions/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    const submissions = await db.query(
      `SELECT s.*, a.title as assignment_title, a.total_marks, c.course_name,
              u.name as student_name, stu.roll_number
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       JOIN students stu ON s.student_id = stu.id
       JOIN users u ON stu.user_id = u.id
       WHERE a.teacher_id = ?
       ORDER BY s.submission_date DESC`,
      [teacherId]
    );

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Grade Submission
router.post('/submissions/grade', async (req, res) => {
  try {
    const { submission_id, marks_obtained, feedback } = req.body;

    if (!submission_id || marks_obtained === undefined) {
      return res.status(400).json({ success: false, message: 'Submission ID and marks are required.' });
    }

    await db.query(
      `UPDATE submissions SET marks_obtained = ?, feedback = ?, status = 'Graded' WHERE id = ?`,
      [marks_obtained, feedback || '', submission_id]
    );

    res.json({ success: true, message: 'Submission graded successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
