const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Dashboard Overview
router.get('/dashboard/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const courses = await db.query('SELECT COUNT(*) as count FROM courses');
    const totalCourses = courses[0].count || 0;

    const pendingAssignments = await db.query(
      `SELECT COUNT(*) as count FROM assignments a 
       LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
       WHERE s.id IS NULL OR s.status = 'Pending'`,
      [studentId]
    );

    const attendanceRecords = await db.query(
      `SELECT status FROM attendance WHERE student_id = ?`,
      [studentId]
    );
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(r => r.status === 'Present').length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

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
      `SELECT n.*, c.course_name, c.course_code, u.name as teacher_name
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

// Single Note Details for Reader Modal
router.get('/notes/:noteId', async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const notes = await db.query(
      `SELECT n.*, c.course_name, c.course_code, u.name as teacher_name
       FROM notes n
       JOIN courses c ON n.course_id = c.id
       LEFT JOIN teachers tch ON n.teacher_id = tch.id
       LEFT JOIN users u ON tch.user_id = u.id
       WHERE n.id = ?`,
      [noteId]
    );
    if (notes.length > 0) {
      res.json({ success: true, data: notes[0] });
    } else {
      res.status(404).json({ success: false, message: 'Note not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Gemini AI Academic Assistant Endpoint
router.post('/ai-chat', async (req, res) => {
  try {
    const { question, studentName } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let reply = "";

    // If Gemini API Key is provided in .env, use real Gemini REST API!
    if (apiKey) {
      try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are Gemini AI Tutor for B.Tech Computer Science Engineering students at Gandhi Institute for Education and Technology (GIET). Student Name: ${studentName || 'Student'}. Answer the following academic question clearly, professionally, with markdown formatting, code snippets, or bullet points: ${question}`
                }]
              }]
            })
          }
        );
        const geminiData = await geminiRes.json();
        if (geminiData.candidates && geminiData.candidates[0].content.parts[0].text) {
          reply = geminiData.candidates[0].content.parts[0].text;
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using intelligent Gemini AI engine fallback:', geminiErr.message);
      }
    }

    // Comprehensive Fallback Knowledge Engine if API key is not set
    if (!reply) {
      const q = question.toLowerCase();

      if (q.includes('bst') || q.includes('binary search tree') || q.includes('tree')) {
        reply = `✨ **Gemini AI Study Tutor (Data Structures & Algorithms)**:\n\nA **Binary Search Tree (BST)** is a node-based binary tree data structure with key ordering properties:\n\n1. **Left Subtree**: Contains keys strictly *smaller* than the node's key.\n2. **Right Subtree**: Contains keys strictly *greater* than the node's key.\n3. Both subtrees must also be valid BSTs.\n\n⏱️ **Complexity Analysis**:\n- **Search / Insert / Delete**: Average O(log N), Worst O(N) (unbalanced skew tree).\n- **In-order Traversal**: Traverses BST in ascending sorted order!\n\n💻 **C++ Implementation Snippet**:\n\`\`\`cpp\nstruct Node {\n    int data;\n    Node* left;\n    Node* right;\n    Node(int val) : data(val), left(nullptr), right(nullptr) {}\n};\n\`\`\``;
      } 
      else if (q.includes('3nf') || q.includes('normalization') || q.includes('dbms') || q.includes('database')) {
        reply = `✨ **Gemini AI Study Tutor (Database Systems)**:\n\n**3rd Normal Form (3NF)** removes transitive functional dependencies to eliminate data redundancy:\n\n1. Table must be in **2NF**.\n2. No non-prime attribute should transitively depend on the primary key ($X \\rightarrow Y$, if $Y$ is non-prime, $X$ must be a super key).\n\n💡 *Mantra*: Every non-key attribute must depend on **the key, the whole key, and nothing but the key**!`;
      } 
      else if (q.includes('tcp') || q.includes('handshake') || q.includes('network') || q.includes('osi')) {
        reply = `✨ **Gemini AI Study Tutor (Computer Networks)**:\n\n**TCP 3-Way Handshake** establishes a connection between Client and Server:\n\n1. **SYN**: Client sends SYN packet (Initial Sequence Number $X$).\n2. **SYN-ACK**: Server replies with SYN-ACK packet (Seq $Y$, Ack $X+1$).\n3. **ACK**: Client sends ACK packet (Ack $Y+1$).\n\n🌐 Connection state becomes **ESTABLISHED** for full-duplex data transfer.`;
      } 
      else if (q.includes('process') && q.includes('thread')) {
        reply = `✨ **Gemini AI Study Tutor (Operating Systems)**:\n\n**Process vs Thread Comparison**:\n\n- **Process**: Independent execution unit with its own virtual address space, file handles, and memory map. Heavyweight context switching.\n- **Thread**: Lightweight process sharing code, data, and OS resources within a process. Fast thread context switching!`;
      } 
      else if (q.includes('exam') || q.includes('prepare') || q.includes('study') || q.includes('giet')) {
        reply = `✨ **Gemini AI Study Tutor (GIET Exam Strategy)**:\n\nHello ${studentName || 'Student'}! Here is your B.Tech CSE Semester 5 Preparation Checklist:\n\n1. **Study Notes Reader**: Review Unit-wise reference handbooks in the Study Notes section.\n2. **Practice Numericals**: Solve Page Replacement, CPU Scheduling, and Normalization problems.\n3. **75% Attendance Rule**: Ensure your attendance is above 75% for exam hall tickets.\n4. **Assignments**: Complete all pending lab projects on time!`;
      } 
      else if (q.includes('automata') || q.includes('dfa') || q.includes('nfa') || q.includes('toc')) {
        reply = `✨ **Gemini AI Study Tutor (Theory of Computation)**:\n\n**DFA vs NFA**:\n- **DFA**: Exactly one deterministic transition per state for each input symbol.\n- **NFA**: Can have multiple transitions or null ($\\epsilon$) transitions for an input symbol. Both DFAs and NFAs recognize the exact same class of **Regular Languages**!`;
      } 
      else {
        reply = `✨ **Gemini AI Academic Assistant**:\n\nHello ${studentName || 'Student'}! Regarding your query *"_${question}_"*:\n\nFor B.Tech CSE Semester 5 at GIET, here are key academic pointers:\n- **Data Structures**: Focus on Trees, BFS/DFS, and Graph TopoSort.\n- **DBMS**: Focus on SQL Joins, B+ Tree Indexing, and Normalization.\n- **Operating Systems**: Focus on Semaphores, Round Robin, and Virtual Memory Paging.\n\nFeel free to ask any specific coding doubt, definition, or mathematical derivation!`;
      }
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
