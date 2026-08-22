const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = 'sqlite';
let mysqlPool = null;
let sqliteDb = null;

// Unified query wrapper
async function query(sql, params = []) {
  if (dbType === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      let normalizedSql = sql.trim();
      const isSelect = normalizedSql.toUpperCase().startsWith('SELECT');

      if (isSelect) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ insertId: this.lastID, affectedRows: this.changes });
        });
      }
    });
  }
}

function initSQLiteFallback() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '../../database/smart_student_portal.db');

  console.log('⚡ Initializing SQLite Fallback database for GIET at:', dbPath);

  sqliteDb = new sqlite3.Database(dbPath, async (err) => {
    if (err) {
      console.error('❌ Could not initialize SQLite database:', err.message);
      return;
    }
    console.log('✅ Connected to SQLite database.');

    sqliteDb.serialize(() => {
      sqliteDb.run(`DROP TABLE IF EXISTS submissions`);
      sqliteDb.run(`DROP TABLE IF EXISTS assignments`);
      sqliteDb.run(`DROP TABLE IF EXISTS attendance`);
      sqliteDb.run(`DROP TABLE IF EXISTS timetable`);
      sqliteDb.run(`DROP TABLE IF EXISTS marks`);
      sqliteDb.run(`DROP TABLE IF EXISTS fees`);
      sqliteDb.run(`DROP TABLE IF EXISTS notes`);
      sqliteDb.run(`DROP TABLE IF EXISTS courses`);
      sqliteDb.run(`DROP TABLE IF EXISTS students`);
      sqliteDb.run(`DROP TABLE IF EXISTS teachers`);
      sqliteDb.run(`DROP TABLE IF EXISTS users`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        teacher_code TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        phone TEXT,
        office_hours TEXT
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        roll_number TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        semester INTEGER NOT NULL,
        batch TEXT NOT NULL,
        phone TEXT
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_code TEXT UNIQUE NOT NULL,
        course_name TEXT NOT NULL,
        credits INTEGER NOT NULL,
        teacher_id INTEGER
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        day_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        room_no TEXT NOT NULL
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        UNIQUE(student_id, course_id, date)
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        total_marks INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        submission_text TEXT,
        submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Pending',
        marks_obtained INTEGER DEFAULT NULL,
        feedback TEXT,
        UNIQUE(assignment_id, student_id)
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        fee_type TEXT NOT NULL,
        total_amount REAL NOT NULL,
        paid_amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        exam_type TEXT NOT NULL,
        marks_obtained INTEGER NOT NULL,
        max_marks INTEGER DEFAULT 100,
        grade TEXT
      )`);

      sqliteDb.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        file_url TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      console.log('🌱 Seeding GIET College Data (20 Students, 6 Teachers, 6 Subjects)...');
      
      // Users
      sqliteDb.run(`INSERT INTO users (id, username, password, role, name, email) VALUES
        (1, 'teacher1', 'password', 'teacher', 'Dr. Alok Verma', 'alok.verma@giet.edu.in'),
        (2, 'teacher2', 'password', 'teacher', 'Prof. Sunita Rao', 'sunita.rao@giet.edu.in'),
        (3, 'teacher3', 'password', 'teacher', 'Dr. Rajesh Kumar', 'rajesh.kumar@giet.edu.in'),
        (4, 'teacher4', 'password', 'teacher', 'Prof. Ananya Mishra', 'ananya.mishra@giet.edu.in'),
        (5, 'teacher5', 'password', 'teacher', 'Dr. Vikram Singh', 'vikram.singh@giet.edu.in'),
        (6, 'teacher6', 'password', 'teacher', 'Prof. Neha Gupta', 'neha.gupta@giet.edu.in'),
        (7, 'student1', 'password', 'student', 'Rahul Sharma', 'rahul.sharma2022@giet.edu.in'),
        (8, 'student2', 'password', 'student', 'Priya Patel', 'priya.patel2022@giet.edu.in'),
        (9, 'student3', 'password', 'student', 'Amit Verma', 'amit.verma2022@giet.edu.in'),
        (10, 'student4', 'password', 'student', 'Sneha Gupta', 'sneha.gupta2022@giet.edu.in'),
        (11, 'student5', 'password', 'student', 'Rohan Singh', 'rohan.singh2022@giet.edu.in'),
        (12, 'student6', 'password', 'student', 'Pooja Mishra', 'pooja.mishra2022@giet.edu.in'),
        (13, 'student7', 'password', 'student', 'Vikas Kumar', 'vikas.kumar2022@giet.edu.in'),
        (14, 'student8', 'password', 'student', 'Anjali Yadav', 'anjali.yadav2022@giet.edu.in'),
        (15, 'student9', 'password', 'student', 'Aditya Roy', 'aditya.roy2022@giet.edu.in'),
        (16, 'student10', 'password', 'student', 'Kavya Joshi', 'kavya.joshi2022@giet.edu.in'),
        (17, 'student11', 'password', 'student', 'Manish Pandey', 'manish.pandey2022@giet.edu.in'),
        (18, 'student12', 'password', 'student', 'Ritu Sharma', 'ritu.sharma2022@giet.edu.in'),
        (19, 'student13', 'password', 'student', 'Deepak Raj', 'deepak.raj2022@giet.edu.in'),
        (20, 'student14', 'password', 'student', 'Shweta Choudhary', 'shweta.c2022@giet.edu.in'),
        (21, 'student15', 'password', 'student', 'Vivek Saxena', 'vivek.saxena2022@giet.edu.in'),
        (22, 'student16', 'password', 'student', 'Neha Srivastava', 'neha.s2022@giet.edu.in'),
        (23, 'student17', 'password', 'student', 'Kunal Mehta', 'kunal.mehta2022@giet.edu.in'),
        (24, 'student18', 'password', 'student', 'Divya Agarwal', 'divya.a2022@giet.edu.in'),
        (25, 'student19', 'password', 'student', 'Saurabh Tiwari', 'saurabh.t2022@giet.edu.in'),
        (26, 'student20', 'password', 'student', 'Isha Kapoor', 'isha.kapoor2022@giet.edu.in')`);

      // Teachers
      sqliteDb.run(`INSERT INTO teachers (id, user_id, teacher_code, department, phone, office_hours) VALUES
        (1, 1, 'TCH201', 'Computer Science & Engineering', '+91 98765 11001', 'Mon-Fri 02:00 PM - 04:00 PM'),
        (2, 2, 'TCH202', 'Software Engineering Dept', '+91 98765 11002', 'Tue-Thu 11:00 AM - 01:00 PM'),
        (3, 3, 'TCH203', 'Systems & Architecture Dept', '+91 98765 11003', 'Mon-Wed 03:00 PM - 05:00 PM'),
        (4, 4, 'TCH204', 'Database & Data Mining Dept', '+91 98765 11004', 'Wed-Fri 10:00 AM - 12:00 PM'),
        (5, 5, 'TCH205', 'Networking & Security Dept', '+91 98765 11005', 'Tue-Fri 02:00 PM - 04:00 PM'),
        (6, 6, 'TCH206', 'Theoretical Computer Science', '+91 98765 11006', 'Mon-Thu 12:00 PM - 02:00 PM')`);

      // Students
      sqliteDb.run(`INSERT INTO students (id, user_id, roll_number, department, semester, batch, phone) VALUES
        (1, 7, 'GIET2022CSE101', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00001'),
        (2, 8, 'GIET2022CSE102', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00002'),
        (3, 9, 'GIET2022CSE103', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00003'),
        (4, 10, 'GIET2022CSE104', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00004'),
        (5, 11, 'GIET2022CSE105', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00005'),
        (6, 12, 'GIET2022CSE106', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00006'),
        (7, 13, 'GIET2022CSE107', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00007'),
        (8, 14, 'GIET2022CSE108', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00008'),
        (9, 15, 'GIET2022CSE109', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00009'),
        (10, 16, 'GIET2022CSE110', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00010'),
        (11, 17, 'GIET2022CSE111', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00011'),
        (12, 18, 'GIET2022CSE112', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00012'),
        (13, 19, 'GIET2022CSE113', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00013'),
        (14, 20, 'GIET2022CSE114', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00014'),
        (15, 21, 'GIET2022CSE115', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00015'),
        (16, 22, 'GIET2022CSE116', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00016'),
        (17, 23, 'GIET2022CSE117', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00017'),
        (18, 24, 'GIET2022CSE118', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00018'),
        (19, 25, 'GIET2022CSE119', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00019'),
        (20, 26, 'GIET2022CSE120', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00020')`);

      // Courses
      sqliteDb.run(`INSERT INTO courses (id, course_code, course_name, credits, teacher_id) VALUES
        (1, 'CS501', 'Data Structures & Algorithms', 4, 1),
        (2, 'CS502', 'Software Engineering & Agile', 3, 2),
        (3, 'CS503', 'Operating Systems & Kernel Concepts', 4, 3),
        (4, 'CS504', 'Database Management Systems (DBMS)', 4, 4),
        (5, 'CS505', 'Computer Networks & Security', 4, 5),
        (6, 'CS506', 'Theory of Computation (Automata)', 3, 6)`);

      // Timetable
      sqliteDb.run(`INSERT INTO timetable (id, course_id, day_of_week, start_time, end_time, room_no) VALUES
        (1, 1, 'Monday', '09:30 AM', '10:30 AM', 'Lab 301'),
        (2, 2, 'Monday', '10:45 AM', '11:45 AM', 'Room 204'),
        (3, 3, 'Monday', '01:30 PM', '02:30 PM', 'Room 201'),
        (4, 4, 'Tuesday', '09:30 AM', '10:30 AM', 'Lab 102'),
        (5, 5, 'Tuesday', '10:45 AM', '11:45 AM', 'Room 305'),
        (6, 6, 'Tuesday', '01:30 PM', '02:30 PM', 'Room 202'),
        (7, 1, 'Wednesday', '09:30 AM', '10:30 AM', 'Lab 301'),
        (8, 3, 'Wednesday', '10:45 AM', '11:45 AM', 'Room 201'),
        (9, 4, 'Wednesday', '01:30 PM', '02:30 PM', 'Lab 102'),
        (10, 2, 'Thursday', '09:30 AM', '10:30 AM', 'Room 204'),
        (11, 5, 'Thursday', '10:45 AM', '11:45 AM', 'Lab 305'),
        (12, 6, 'Thursday', '01:30 PM', '02:30 PM', 'Room 202'),
        (13, 1, 'Friday', '09:30 AM', '10:30 AM', 'Room 301'),
        (14, 4, 'Friday', '10:45 AM', '11:45 AM', 'Room 102'),
        (15, 2, 'Friday', '01:30 PM', '02:30 PM', 'Room 204'),
        (16, 3, 'Saturday', '09:30 AM', '10:30 AM', 'Lab 201'),
        (17, 5, 'Saturday', '10:45 AM', '11:45 AM', 'Lab 305'),
        (18, 6, 'Saturday', '01:30 PM', '02:30 PM', 'Room 202')`);

      // Attendance
      sqliteDb.run(`INSERT INTO attendance (student_id, course_id, date, status) VALUES
        (1, 1, '2026-08-01', 'Present'),
        (1, 1, '2026-08-04', 'Present'),
        (1, 1, '2026-08-08', 'Present'),
        (1, 1, '2026-08-11', 'Present'),
        (1, 2, '2026-08-02', 'Present'),
        (1, 2, '2026-08-05', 'Present'),
        (1, 2, '2026-08-12', 'Present'),
        (1, 3, '2026-08-03', 'Present'),
        (1, 3, '2026-08-07', 'Absent'),
        (1, 3, '2026-08-14', 'Present'),
        (1, 4, '2026-08-06', 'Present'),
        (1, 4, '2026-08-13', 'Present'),
        (1, 5, '2026-08-09', 'Present'),
        (1, 5, '2026-08-15', 'Present'),
        (1, 6, '2026-08-10', 'Present'),
        (1, 6, '2026-08-16', 'Present'),
        (2, 1, '2026-08-01', 'Present'),
        (2, 1, '2026-08-04', 'Absent'),
        (2, 2, '2026-08-02', 'Present'),
        (2, 3, '2026-08-03', 'Present')`);

      // Assignments
      sqliteDb.run(`INSERT INTO assignments (id, course_id, teacher_id, title, description, due_date, total_marks) VALUES
        (1, 1, 1, 'Binary Search Tree & Graph Traversals', 'Implement BST insertion, deletion, BFS & DFS graph algorithms in Java/C++.', '2026-08-18', 50),
        (2, 2, 2, 'SRS Document & UML Use Case Diagrams', 'Draft a professional Software Requirement Specification (SRS) for an E-learning portal.', '2026-08-20', 100),
        (3, 3, 3, 'Process Synchronization & Semaphores', 'Solve Producer-Consumer & Readers-Writers problem using C POSIX threads and semaphores.', '2026-08-25', 50),
        (4, 4, 4, 'SQL Schema Normalization (3NF & BCNF)', 'Design normalized relational schema and write complex JOIN queries for hospital database.', '2026-08-28', 100),
        (5, 5, 5, 'TCP/IP Packet Sniffing & Subnetting Lab', 'Perform Wireshark packet capture analysis and calculate Classless Inter-Domain Routing (CIDR) subnets.', '2026-08-30', 50),
        (6, 6, 6, 'DFA & NFA State Minimization Assignment', 'Construct Minimal DFA for given regular expressions and convert NFA with epsilon transitions.', '2026-09-02', 50)`);

      // Submissions for All 6 Teachers
      sqliteDb.run(`INSERT INTO submissions (id, assignment_id, student_id, submission_text, status, marks_obtained, feedback) VALUES
        (1, 1, 1, 'GitHub Repo: https://github.com/rahulsharma/bst-project. Contains Java BST insertion & level order BFS code.', 'Graded', 48, 'Outstanding work! Very clean Java code structure.'),
        (2, 1, 2, 'Priya Patel BST Assignment submission with C++ tree traversal source code.', 'Pending', NULL, NULL),
        (3, 1, 3, 'Amit Verma DSA Assignment 1 submitted. Includes BFS & DFS graph algorithms.', 'Pending', NULL, NULL),
        (4, 2, 1, 'Submitted SRS document PDF version 1.2 with IEEE standard template and Use Case diagrams.', 'Pending', NULL, NULL),
        (5, 2, 4, 'Sneha Gupta Software Engg Assignment submission link: https://drive.google.com/file/d/srs-doc', 'Pending', NULL, NULL),
        (6, 3, 1, 'POSIX Threads Producer-Consumer solution code using semaphores in C.', 'Pending', NULL, NULL),
        (7, 3, 5, 'Rohan Singh OS Assignment submission: Producer Consumer & Reader Writer solution.', 'Pending', NULL, NULL),
        (8, 4, 1, 'SQL queries file uploaded with ER diagram and 3NF normalization justification.', 'Graded', 92, 'Excellent DB schema design.'),
        (9, 4, 2, 'Priya Patel DBMS Assignment 4 - Hospital Management Database normalization queries.', 'Pending', NULL, NULL),
        (10, 5, 1, 'Wireshark packet capture analysis PDF report with CIDR subnetting calculations.', 'Pending', NULL, NULL),
        (11, 5, 3, 'Computer Networks Assignment 5 submission by Amit Verma.', 'Pending', NULL, NULL),
        (12, 6, 1, 'Minimal DFA state transition table and NFA with epsilon transition conversion.', 'Pending', NULL, NULL),
        (13, 6, 4, 'Automata Theory Assignment 6 submission by Sneha Gupta.', 'Pending', NULL, NULL)`);

      // Fees
      sqliteDb.run(`INSERT INTO fees (id, student_id, fee_type, total_amount, paid_amount, due_date, status) VALUES
        (1, 1, '5th Semester Tuition Fee', 45000.00, 45000.00, '2026-07-15', 'Paid'),
        (2, 1, 'Computer Lab & High-Speed Internet Charge', 8000.00, 8000.00, '2026-08-10', 'Paid'),
        (3, 1, 'Central Library & Book Bank Fee', 3500.00, 3500.00, '2026-08-15', 'Paid'),
        (4, 1, 'Semester End Examination & Evaluation Fee', 2500.00, 0.00, '2026-09-15', 'Pending')`);

      // Marks
      sqliteDb.run(`INSERT INTO marks (id, student_id, course_id, exam_type, marks_obtained, max_marks, grade) VALUES
        (1, 1, 1, 'Mid-Semester Exam', 45, 50, 'O'),
        (2, 1, 2, 'Mid-Semester Exam', 42, 50, 'A+'),
        (3, 1, 3, 'Mid-Semester Exam', 46, 50, 'O'),
        (4, 1, 4, 'Mid-Semester Exam', 48, 50, 'O'),
        (5, 1, 5, 'Mid-Semester Exam', 40, 50, 'A+'),
        (6, 1, 6, 'Mid-Semester Exam', 38, 50, 'A')`);

      // Notes (Clean SQL strings)
      const note1 = "MODULE 1: BINARY SEARCH TREES (BST)\n\nA Binary Search Tree is a node-based binary tree data structure with key ordering properties:\n- The left subtree of a node contains only nodes with keys lesser than the node's key.\n- The right subtree of a node contains only nodes with keys greater than the node's key.\n- Both left & right subtrees must also be binary search trees.\n\nTIME COMPLEXITIES:\n- Search: Average O(log n), Worst O(n)\n- Insertion: Average O(log n), Worst O(n)\n- Deletion: Average O(log n), Worst O(n)\n\nCODE EXAMPLE (C++ BST Insertion):\nstruct Node {\n  int key;\n  Node *left, *right;\n  Node(int val) : key(val), left(NULL), right(NULL) {}\n};\n\nNode* insert(Node* node, int key) {\n  if (node == NULL) return new Node(key);\n  if (key < node->key) node->left = insert(node->left, key);\n  else if (key > node->key) node->right = insert(node->right, key);\n  return node;\n}\n\nMODULE 2: GRAPH TRAVERSALS (BFS & DFS)\n- Breadth First Search (BFS): Uses Queue data structure. Level by level traversal.\n- Depth First Search (DFS): Uses Stack data structure (or Recursion). Deep branch exploration.";

      const note2 = "UNIT 1: SOFTWARE DEVELOPMENT LIFECYCLE (SDLC)\n\nSDLC is a structured process used by engineering teams to design, develop, and test high quality software.\n\nSTAGES OF SDLC:\n1. Requirement Analysis & SRS Generation\n2. System Design (UML Architecture, ER Diagrams)\n3. Implementation / Coding\n4. Testing (Unit, Integration, System, Acceptance)\n5. Deployment & Maintenance\n\nUNIT 2: AGILE SCRUM METHODOLOGY\nAgile is an iterative development approach where cross-functional teams work in short Sprints (2-4 weeks).\n\nKEY SCRUM ROLES:\n- Product Owner: Defines User Stories and manages Product Backlog.\n- Scrum Master: Facilitates sprint ceremonies and removes team blockers.\n- Development Team: Delivers working software increment each sprint.";

      const note3 = "UNIT 2: OPERATING SYSTEM CPU SCHEDULING\n\nCPU Scheduling is the process of deciding which process in the ready queue gets the CPU allocation.\n\nSCHEDULING ALGORITHMS:\n1. FCFS (First-Come, First-Served): Non-preemptive. Suffers from Convoy Effect.\n2. SJF (Shortest Job First): Optimal average waiting time.\n3. Round Robin (RR): Preemptive using fixed Time Quantum (t).\n4. Priority Scheduling: Can cause Starvation (solved using Aging mechanism).\n\nUNIT 3: VIRTUAL MEMORY & PAGING\n- Virtual Memory: Technique allowing execution of processes not completely in main memory.\n- Page Table: Maps Virtual Pages to Physical Frame numbers in RAM.\n- Page Fault: Occurs when a referenced page is not present in RAM.";

      const note4 = "UNIT 4: RELATIONAL DATABASE NORMALIZATION & INDEXING\n\nDATABASE NORMAL FORMS:\n- 1NF: Atomic values in attributes, no repeating groups.\n- 2NF: In 1NF + No Partial Dependency.\n- 3NF: In 2NF + No Transitive Dependency.\n- BCNF (Boyce-Codd): Strict 3NF where for X -> Y, X must be a Super Key.\n\nSQL JOINS CHEAT SHEET:\n- INNER JOIN: Returns records with matching values in both tables.\n- LEFT JOIN: Returns all records from left table and matched from right.\n- RIGHT JOIN: Returns all records from right table and matched from left.\n- FULL OUTER JOIN: Returns all records when there is a match in either table.";

      const note5 = "UNIT 3: COMPUTER NETWORKING PROTOCOLS\n\nOSI 7-LAYER REFERENCE MODEL:\n7. Application Layer (HTTP, FTP, DNS, SMTP)\n6. Presentation Layer (SSL/TLS Encryption, Data Compression)\n5. Session Layer (Session establishment & sync)\n4. Transport Layer (TCP, UDP - Port addressing)\n3. Network Layer (IP Routing, ICMP, Router operations)\n2. Data Link Layer (Ethernet MAC addressing, Switches)\n1. Physical Layer (Bits, Copper cables, Fiber optics)\n\nTCP 3-WAY HANDSHAKE:\n1. Client -> Server: SYN (Seq = x)\n2. Server -> Client: SYN-ACK (Seq = y, Ack = x + 1)\n3. Client -> Server: ACK (Ack = y + 1)";

      const note6 = "UNIT 1: FORMAL LANGUAGES & AUTOMATA THEORY (TOC)\n\nFINITE AUTOMATA:\n- DFA (Deterministic Finite Automata): Exactly 1 transition for each state and input symbol.\n- NFA (Nondeterministic Finite Automata): Can have 0, 1, or multiple transitions per symbol, plus epsilon (null) transitions.\n\nREGULAR EXPRESSIONS (RE):\nOperations: Union (+), Concatenation (.), Kleene Star (*).\n\nPUMPING LEMMA FOR REGULAR LANGUAGES:\nUsed to prove a language is NON-REGULAR by contradiction!";

      sqliteDb.run(`INSERT INTO notes (id, course_id, teacher_id, title, content) VALUES
        (1, 1, 1, 'DSA Unit-3: Trees & Graphs Master Notes', ?),
        (2, 2, 2, 'Software Engg: Agile Scrum & SDLC Lifecycle', ?),
        (3, 3, 3, 'OS Unit-2: CPU Scheduling & Virtual Memory', ?),
        (4, 4, 4, 'DBMS Unit-4: SQL Joins & B+ Tree Indexing', ?),
        (5, 5, 5, 'Computer Networks: OSI Layer & TCP Handshake', ?),
        (6, 6, 6, 'TOC Unit-1: Automata Theory & Pumping Lemma', ?)`,
        [note1, note2, note3, note4, note5, note6]
      );

      console.log('✅ SQLite Database Seed for GIET Completed Successfully!');
    });
  });
}

async function initDb() {
  const mysql = require('mysql2/promise');
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'smart_student_portal';

  try {
    const connection = await mysql.createConnection({ host, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await connection.end();

    mysqlPool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await mysqlPool.execute('SELECT 1');
    dbType = 'mysql';
    console.log('✅ Connected to MySQL Database successfully!');
  } catch (err) {
    console.warn(`⚠️ MySQL connection failed (${err.message}). Falling back to SQLite local database...`);
    dbType = 'sqlite';
    initSQLiteFallback();
  }
}

initDb();

module.exports = {
  query,
  getDbType: () => dbType
};
