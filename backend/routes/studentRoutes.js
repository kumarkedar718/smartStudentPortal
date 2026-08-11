const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Dashboard Overview
router.get('/dashboard/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Courses count
    const courses = await db.query('SELECT COUNT(*) as count FROM courses');
    const totalCourses = courses[0].count || 0;

    // Pending assignments
    const pendingAssignments = await db.query(
      `SELECT COUNT(*) as count FROM assignments a 
       LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
       WHERE s.id IS NULL OR s.status = 'Pending'`,
      [studentId]
    );

    // Attendance rate
    const attendanceRecords = await db.query(
      `SELECT status FROM attendance WHERE student_id = ?`,
      [studentId]
    );
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(r => r.status === 'Present').length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

    // Fees summary
    const feesRecords = await db.query(`SELECT * FROM fees WHERE student_id = ?`, [studentId]);
    let totalFees = 0, totalPaid = 0;
    feesRecords.forEach(f => {
      totalFees += Number(f.total_amount);
      totalPaid += Number(f.paid_amount);
    });
    const feeStatus = (totalFees - totalPaid <= 0) ? 'Cleared' : `Due ₹${totalFees - totalPaid}`;

    res.json({
      success: true,
      data: {
        enrolledCourses: totalCourses,
        pendingAssignments: pendingAssignments[0].count || 0,
        attendanceRate: `${attendanceRate}%`,
        feeStatus: feeStatus
      }
    });

  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Class Timetable
router.get('/timetable/:studentId', async (req, res) => {
  try {
    const timetable = await db.query(
      `SELECT t.*, c.course_name, c.course_code, u.name as teacher_name 
       FROM timetable t
       JOIN courses c ON t.course_id = c.id
       LEFT JOIN teachers tch ON c.teacher_id = tch.id
       LEFT JOIN users u ON tch.user_id = u.id
       ORDER BY CASE t.day_of_week
         WHEN 'Monday' THEN 1
         WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5
         WHEN 'Saturday' THEN 6
         ELSE 7 END, t.id ASC`
    );

    res.json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Teachers Information
router.get('/teachers/:studentId', async (req, res) => {
  try {
    const teachers = await db.query(
      `SELECT tch.id, tch.teacher_code, tch.department, tch.phone, tch.office_hours, u.name, u.email,
              GROUP_CONCAT(c.course_name) as courses
       FROM teachers tch
       JOIN users u ON tch.user_id = u.id
       LEFT JOIN courses c ON c.teacher_id = tch.id
       GROUP BY tch.id`
    );

    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Attendance Details
router.get('/attendance/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const summary = await db.query(
      `SELECT c.course_name, c.course_code,
              COUNT(a.id) as total_lectures,
              SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
              SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count
       FROM courses c
       LEFT JOIN attendance a ON c.id = a.course_id AND a.student_id = ?
       GROUP BY c.id`,
      [studentId]
    );

    const logs = await db.query(
      `SELECT a.date, a.status, c.course_name, c.course_code
       FROM attendance a
       JOIN courses c ON a.course_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.date DESC`,
      [studentId]
    );

    res.json({ success: true, summary, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Assignments
router.get('/assignments/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const assignments = await db.query(
      `SELECT a.*, c.course_name, c.course_code, u.name as teacher_name,
              s.id as submission_id, s.submission_text, s.submission_date, s.status as submission_status, s.marks_obtained, s.feedback
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       LEFT JOIN teachers tch ON a.teacher_id = tch.id
       LEFT JOIN users u ON tch.user_id = u.id
       LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
       ORDER BY a.due_date ASC`,
      [studentId]
    );

    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit Assignment
router.post('/assignments/submit', async (req, res) => {
  try {
    const { assignment_id, student_id, submission_text } = req.body;

    if (!assignment_id || !student_id || !submission_text) {
      return res.status(400).json({ success: false, message: 'Submission content is required.' });
    }

    const existing = await db.query(
      `SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?`,
      [assignment_id, student_id]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE submissions SET submission_text = ?, submission_date = CURRENT_TIMESTAMP, status = 'Pending' WHERE id = ?`,
        [submission_text, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO submissions (assignment_id, student_id, submission_text, status) VALUES (?, ?, ?, 'Pending')`,
        [assignment_id, student_id, submission_text]
      );
    }

    res.json({ success: true, message: 'Assignment submitted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Fees Details
router.get('/fees/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const fees = await db.query(`SELECT * FROM fees WHERE student_id = ?`, [studentId]);
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Academic Results / Marks
router.get('/marks/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const marks = await db.query(
      `SELECT m.*, c.course_name, c.course_code, c.credits
       FROM marks m
       JOIN courses c ON m.course_id = c.id
       WHERE m.student_id = ?`,
      [studentId]
    );
    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Notes
router.get('/notes', async (req, res) => {
  try {
    const notes = await db.query(
      `SELECT n.*, c.course_name, u.name as teacher_name
       FROM notes n
       JOIN courses c ON n.course_id = c.id
       LEFT JOIN teachers tch ON n.teacher_id = tch.id
       LEFT JOIN users u ON tch.user_id = u.id
       ORDER BY n.created_at DESC`
    );
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. AI Academic Assistant / Chatbot Endpoint
router.post('/ai-chat', async (req, res) => {
  try {
    const { question, studentName } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const q = question.toLowerCase();
    let reply = "";

    // Intelligent Knowledge Base Responses
    if (q.includes('bst') || q.includes('binary search tree') || q.includes('tree')) {
      reply = `🤖 **Apex AI Tutor (Data Structures & Algorithms)**:\n\nA **Binary Search Tree (BST)** is a node-based binary tree data structure with the following properties:\n\n1. The **left subtree** of a node contains only nodes with keys *lesser* than the node's key.\n2. The **right subtree** of a node contains only nodes with keys *greater* than the node's key.\n3. Both left & right subtrees must also be binary search trees.\n\n⏱️ **Time Complexities**:\n- **Search / Insert / Delete**: Average O(log N), Worst Case O(N).\n- **In-order Traversal** yields sorted elements!`;
    } 
    else if (q.includes('3nf') || q.includes('normalization') || q.includes('dbms') || q.includes('database')) {
      reply = `🤖 **Apex AI Tutor (Database Systems)**:\n\n**3rd Normal Form (3NF)** requires:\n1. The table must already be in **2NF**.\n2. **No Transitive Functional Dependency** (i.e. Non-prime attributes should not depend on other non-prime attributes).\n\n💡 *Rule of Thumb*: Every non-key attribute must depend on **the key, the whole key, and nothing but the key**!`;
    } 
    else if (q.includes('tcp') || q.includes('handshake') || q.includes('network') || q.includes('osi')) {
      reply = `🤖 **Apex AI Tutor (Computer Networks)**:\n\n**TCP 3-Way Handshake** establishes a reliable connection between client & server:\n\n1. **SYN**: Client sends a packet with SYN flag & initial Sequence Number (ISN).\n2. **SYN-ACK**: Server acknowledges with SYN-ACK packet.\n3. **ACK**: Client sends ACK back to confirm connection setup.\n\n🌐 Connection is now Established!`;
    } 
    else if (q.includes('process') && q.includes('thread')) {
      reply = `🤖 **Apex AI Tutor (Operating Systems)**:\n\n**Process vs Thread**:\n\n- **Process**: An executing program with its own dedicated memory space, file handles, and PID. High context-switch overhead.\n- **Thread**: A lightweight execution unit within a process. Threads share memory & code segment, making communication faster!`;
    } 
    else if (q.includes('exam') || q.includes('prepare') || q.includes('study') || q.includes('marks')) {
      reply = `🤖 **Apex AI Tutor (Exam Prep Guide)**:\n\nHey ${studentName || 'Student'}! Here are top tips for B.Tech Semester Exams:\n\n1. **Revise Unit Cheat Sheets** in the Notes section.\n2. Practice solving previous year **Binary Search Tree, Semaphore, & Normalization numericals**.\n3. Keep attendance above **75%** to secure your hall ticket.\n4. Complete all pending assignments on time!`;
    } 
    else if (q.includes('automata') || q.includes('dfa') || q.includes('nfa') || q.includes('toc')) {
      reply = `🤖 **Apex AI Tutor (Theory of Computation)**:\n\n**DFA vs NFA**:\n- **DFA (Deterministic Finite Automata)**: For every state and input symbol, there is **exactly one** transition.\n- **NFA (Non-deterministic Finite Automata)**: Can have multiple or zero transitions for an input, including $\\epsilon$ (null) transitions. Both have equal language recognition power!`;
    } 
    else {
      reply = `🤖 **Apex AI Tutor**:\n\nGreat question, ${studentName || 'Student'}! Regarding *"_${question}_"*:\n\nFor 5th Semester CSE, remember to focus on core principles:\n- Review **Data Structures** (Trees, Graphs, Sorting)\n- Master **DBMS** SQL Queries & Normalization\n- Practice **OS** Semaphores & CPU Scheduling\n\nNeed specific code examples or theoretical concepts? Ask me anytime!`;
    }

    res.json({
      success: true,
      reply: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
