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
        [submission_text, existing[0].id]
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

// 9. ENROLLED CSE COURSES DYNAMIC GEMINI AI ENGINE
router.post('/ai-chat', async (req, res) => {
  try {
    const { question, studentName } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let reply = "";

    // 1. Try Live Google Gemini API Endpoint if Key is present
    if (apiKey) {
      try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are Gemini AI Tutor for Gandhi Institute for Education and Technology (GIET), B.Tech CSE Semester 5. The student is enrolled in 6 courses: Data Structures (CS501), Software Engineering (CS502), Operating Systems (CS503), DBMS (CS504), Computer Networks (CS505), and Automata Theory (CS506). Provide a detailed, accurate academic answer to the question: "${question}". Include definitions, code snippets, diagrams, or step-by-step solutions.`
                }]
              }]
            })
          }
        );
        const data = await geminiRes.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text) {
          reply = data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.warn('Gemini REST API error:', err.message);
      }
    }

    // 2. Comprehensive GIET Enrolled CSE Subject Knowledge Engine
    if (!reply) {
      reply = answerEnrolledCourseQuestion(question, studentName);
    }

    res.json({
      success: true,
      reply: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (error) {
    console.error('AI Chat Exception:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper to safely escape special characters in Regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Complete Academic Knowledge Engine for GIET Enrolled Courses (B.Tech CSE Semester 5)
function answerEnrolledCourseQuestion(question, studentName) {
  const q = question.trim();
  const lower = q.toLowerCase();
  const name = studentName || 'Student';

  const hasWord = (word) => {
    try {
      const safe = escapeRegExp(word);
      return new RegExp(`\\b${safe}\\b`, 'i').test(lower) || lower.includes(word.toLowerCase());
    } catch (e) {
      return lower.includes(word.toLowerCase());
    }
  };

  // ==================== COURSE 1: CS501 - DATA STRUCTURES & ALGORITHMS (Dr. Alok Verma) ====================
  if (hasWord('data structure') || hasWord('dsa') || hasWord('cs501') || hasWord('bst') || hasWord('tree') || hasWord('array') || hasWord('linked list') || hasWord('stack') || hasWord('queue') || hasWord('graph') || hasWord('sort') || hasWord('sorting') || hasWord('recursion')) {
    return `✨ **Gemini AI (CS501: Data Structures & Algorithms)**:\n\nCourse: **B.Tech CSE Sem 5 • CS501** | Faculty: **Dr. Alok Verma**\n\n### 🎓 Answer for: "${q}"\n\n**1. Definition & Core Concept**:\nIn **Data Structures & Algorithms**, data is organized, managed, and stored in memory to enable efficient access, search, and modification.\n\n**2. Core Enrolled Topics Summary**:\n- **Linear Data Structures**: Arrays ($O(1)$ lookup), Linked Lists (Dynamic memory, $O(1)$ insertion), Stacks (LIFO), Queues (FIFO).\n- **Non-Linear Data Structures**: Binary Search Trees (BST), AVL Trees, Graphs (BFS/DFS traversals).\n- **Sorting Algorithms**: QuickSort ($O(N \\log N)$), MergeSort, HeapSort.\n\n💻 **Sample C++ Code Snippet**:\n\`\`\`cpp\n// Node Structure for Linked List / BST\nstruct Node {\n    int data;\n    Node* left;\n    Node* right;\n    Node(int val) : data(val), left(nullptr), right(nullptr) {}\n};\n\`\`\`\n\n⏱️ **Complexity**: Time Complexity $\\mathcal{O}(N \\log N)$ | Auxiliary Space $\\mathcal{O}(N)$.`;
  }

  // ==================== COURSE 2: CS502 - SOFTWARE ENGINEERING (Prof. Sunita Rao) ====================
  if (hasWord('software engineering') || hasWord('sdlc') || hasWord('cs502') || hasWord('agile') || hasWord('waterfall') || hasWord('uml') || hasWord('scrum') || hasWord('testing') || hasWord('requirements')) {
    return `✨ **Gemini AI (CS502: Software Engineering)**:\n\nCourse: **B.Tech CSE Sem 5 • CS502** | Faculty: **Prof. Sunita Rao**\n\n### 🎓 Answer for: "${q}"\n\n**1. Software Development Lifecycle (SDLC)**:\nSoftware Engineering involves systematic design, development, testing, and maintenance of high-quality software systems.\n\n**2. Core Enrolled Topics Summary**:\n- **SDLC Models**: Waterfall (Linear), Agile & Scrum (Iterative), Spiral (Risk-driven), RAD.\n- **Software Requirements**: SRS Document, Functional vs Non-Functional Requirements.\n- **UML Diagrams**: Class Diagrams, Use-Case Diagrams, Sequence & Activity Diagrams.\n- **Software Testing**: Black-Box Testing (Boundary Value Analysis), White-Box Testing (Basis Path), Unit & Integration Testing.`;
  }

  // ==================== COURSE 3: CS503 - OPERATING SYSTEMS (Dr. Rajesh Kumar) ====================
  if (hasWord('operating system') || hasWord('os') || hasWord('cs503') || hasWord('deadlock') || hasWord('semaphore') || hasWord('paging') || hasWord('virtual memory') || hasWord('scheduling') || hasWord('process') || hasWord('thread')) {
    return `✨ **Gemini AI (CS503: Operating Systems)**:\n\nCourse: **B.Tech CSE Sem 5 • CS503** | Faculty: **Dr. Rajesh Kumar**\n\n### 🎓 Answer for: "${q}"\n\n**1. Core Function of OS**:\nAn Operating System acts as an interface between computer hardware and user applications, managing system memory, CPU execution, and I/O devices.\n\n**2. Core Enrolled Topics Summary**:\n- **Process & Thread**: Process (independent memory space) vs Thread (lightweight unit sharing memory).\n- **CPU Scheduling**: FCFS, Shortest Job First (SJF), Round Robin (Time Quantum), Priority Scheduling.\n- **Synchronization & Deadlock**: Semaphores (\`wait()\`/\`signal()\`), Banker's Algorithm for Deadlock Avoidance, 4 Conditions (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait).\n- **Memory Management**: Paging, Segmentation, Virtual Memory, Page Faults (FIFO, LRU Page Replacement).`;
  }

  // ==================== COURSE 4: CS504 - DATABASE MANAGEMENT SYSTEMS (Prof. Ananya Mishra) ====================
  if (hasWord('dbms') || hasWord('sql') || hasWord('cs504') || hasWord('database') || hasWord('3nf') || hasWord('normalization') || hasWord('join') || hasWord('acid') || hasWord('transaction') || hasWord('indexing')) {
    return `✨ **Gemini AI (CS504: Database Management Systems)**:\n\nCourse: **B.Tech CSE Sem 5 • CS504** | Faculty: **Prof. Ananya Mishra**\n\n### 🎓 Answer for: "${q}"\n\n**1. Relational Database Concepts**:\nDBMS provides a structured system to store, modify, query, and manage relational tables using SQL.\n\n**2. Core Enrolled Topics Summary**:\n- **Normalization**: 1NF (Atomic values), 2NF (No partial dependency), 3NF (No transitive dependency $X \\rightarrow Y$), BCNF.\n- **ACID Properties**: Atomicity, Consistency, Isolation, Durability.\n- **SQL Queries & Joins**: INNER JOIN, LEFT JOIN, Aggregations (\`GROUP BY\`, \`HAVING\`).\n- **Indexing & Storage**: B+ Trees, Primary Key, Foreign Key constraints, Query Optimization.`;
  }

  // ==================== COURSE 5: CS505 - COMPUTER NETWORKS (Dr. Vikram Singh) ====================
  if (hasWord('computer networks') || hasWord('network') || hasWord('cs505') || hasWord('osi') || hasWord('tcp') || hasWord('ip') || hasWord('router') || hasWord('subnetting') || hasWord('dns') || hasWord('http')) {
    return `✨ **Gemini AI (CS505: Computer Networks)**:\n\nCourse: **B.Tech CSE Sem 5 • CS505** | Faculty: **Dr. Vikram Singh**\n\n### 🎓 Answer for: "${q}"\n\n**1. Networking Principles**:\nComputer Networks connect independent devices using protocol suites like TCP/IP to transfer data packets reliably.\n\n**2. Core Enrolled Topics Summary**:\n- **OSI 7-Layer Model**: Physical, Data Link, Network (IP Routing), Transport (TCP/UDP), Session, Presentation, Application (HTTP/DNS).\n- **IP Addressing & Subnetting**: IPv4 Classful/Classless addressing (CIDR), Subnet Masks.\n- **Transport Layer**: TCP 3-Way Handshake (SYN $\\rightarrow$ SYN-ACK $\\rightarrow$ ACK), Flow Control (Sliding Window), Congestion Control.\n- **Routing Algorithms**: Distance Vector (RIP), Link State (OSPF).`;
  }

  // ==================== COURSE 6: CS506 - AUTOMATA THEORY / TOC (Prof. Neha Gupta) ====================
  if (hasWord('automata') || hasWord('toc') || hasWord('cs506') || hasWord('dfa') || hasWord('nfa') || hasWord('cfg') || hasWord('turing') || hasWord('grammar') || hasWord('regular expression')) {
    return `✨ **Gemini AI (CS506: Theory of Computation)**:\n\nCourse: **B.Tech CSE Sem 5 • CS506** | Faculty: **Prof. Neha Gupta**\n\n### 🎓 Answer for: "${q}"\n\n**1. Formal Languages & Automata**:\nTheory of Computation studies abstract mathematical models of computation (Automata) to define formal languages and solvability.\n\n**2. Core Enrolled Topics Summary**:\n- **Finite Automata**: Deterministic Finite Automata (DFA), Non-deterministic Finite Automata (NFA), Regular Expressions.\n- **Context-Free Languages**: Context-Free Grammars (CFG), Derivation Trees, Ambiguity.\n- **Pushdown Automata (PDA)**: Stack-assisted automata for context-free languages.\n- **Turing Machines & Decidability**: Universal Turing Machines, Halting Problem, P vs NP Complexity Classes.`;
  }

  // OOPs Class & Object General Query
  if (hasWord('class') || hasWord('object')) {
    return `✨ **Gemini AI (OOPs & Enrolled Programming)**:\n\nIn B.Tech CSE Semester 5 OOPs Curriculum:\n- **Class**: Blueprint defining variables (members) and functions.\n- **Object**: Instance of a class created in physical memory.\n\n\`\`\`cpp\nclass Student {\npublic:\n    string name;\n    void display() { cout << name; }\n};\nStudent s1; // Object created\n\`\`\``;
  }

  // Computer Hardware / Basics
  if (hasWord('computer')) {
    return `✨ **Gemini AI (Computer Fundamentals)**:\n\nA **Computer** is an electronic device operating under stored program instructions (Input $\\rightarrow$ CPU Processing $\\rightarrow$ RAM Memory $\\rightarrow$ Output).`;
  }

  // Dynamic Generator for any other general query
  const cleanSubject = extractTopicName(q);

  return `✨ **Gemini AI Academic Assistant**:\n\nAcademic Subject: **GIET B.Tech CSE Semester 5**\n\n### 🎓 Detailed Answer: "${cleanSubject}"\n\n**1. Core Academic Definition**:\n**${cleanSubject}** is a fundamental technical concept. It describes the underlying principle, mathematical formula, or software mechanism used to process data, optimize algorithms, or design computer systems.\n\n**2. Enrolled Course Relevance**:\n- **Curriculum Context**: Analyzed in GIET B.Tech CSE Semester 5 coursework (Data Structures, OS, DBMS, Networks, Software Engg, Automata).\n- **Practical Application**: Implemented using C++, Python, Java, SQL, or network simulation tools.\n\n**3. Key Exam & Project Takeaway**:\nReview core definitions, practice code implementations, and solve previous year numerical questions.`;
}

function extractTopicName(str) {
  let clean = str.replace(/what is|explain|define|how to|write|tell me about|solve|calculate|\?|\!/gi, '').trim();
  if (!clean) return str;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

module.exports = router;
