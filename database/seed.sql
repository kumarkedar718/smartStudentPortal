-- Smart Student Portal Database Seed Data (MySQL)
-- Realistic College Data: 20 Students, 6 Faculty Members, 6 Core Subjects
-- 3 Classes Per Day Schedule (Monday to Saturday)

USE smart_student_portal;

-- Delete old seed data for fresh re-population
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE attendance;
TRUNCATE TABLE timetable;
TRUNCATE TABLE marks;
TRUNCATE TABLE fees;
TRUNCATE TABLE notes;
TRUNCATE TABLE courses;
TRUNCATE TABLE students;
TRUNCATE TABLE teachers;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS (6 Teachers + 20 Students)
INSERT INTO users (id, username, password, role, name, email) VALUES
-- 6 Faculty Members
(1, 'teacher1', 'password', 'teacher', 'Dr. Alok Verma', 'alok.verma@apexcollege.edu.in'),
(2, 'teacher2', 'password', 'teacher', 'Prof. Sunita Rao', 'sunita.rao@apexcollege.edu.in'),
(3, 'teacher3', 'password', 'teacher', 'Dr. Rajesh Kumar', 'rajesh.kumar@apexcollege.edu.in'),
(4, 'teacher4', 'password', 'teacher', 'Prof. Ananya Mishra', 'ananya.mishra@apexcollege.edu.in'),
(5, 'teacher5', 'password', 'teacher', 'Dr. Vikram Singh', 'vikram.singh@apexcollege.edu.in'),
(6, 'teacher6', 'password', 'teacher', 'Prof. Neha Gupta', 'neha.gupta@apexcollege.edu.in'),

-- 20 Students
(7, 'student1', 'password', 'student', 'Rahul Sharma', 'rahul.sharma2022@apexcollege.edu.in'),
(8, 'student2', 'password', 'student', 'Priya Patel', 'priya.patel2022@apexcollege.edu.in'),
(9, 'student3', 'password', 'student', 'Amit Verma', 'amit.verma2022@apexcollege.edu.in'),
(10, 'student4', 'password', 'student', 'Sneha Gupta', 'sneha.gupta2022@apexcollege.edu.in'),
(11, 'student5', 'password', 'student', 'Rohan Singh', 'rohan.singh2022@apexcollege.edu.in'),
(12, 'student6', 'password', 'student', 'Pooja Mishra', 'pooja.mishra2022@apexcollege.edu.in'),
(13, 'student7', 'password', 'student', 'Vikas Kumar', 'vikas.kumar2022@apexcollege.edu.in'),
(14, 'student8', 'password', 'student', 'Anjali Yadav', 'anjali.yadav2022@apexcollege.edu.in'),
(15, 'student9', 'password', 'student', 'Aditya Roy', 'aditya.roy2022@apexcollege.edu.in'),
(16, 'student10', 'password', 'student', 'Kavya Joshi', 'kavya.joshi2022@apexcollege.edu.in'),
(17, 'student11', 'password', 'student', 'Manish Pandey', 'manish.pandey2022@apexcollege.edu.in'),
(18, 'student12', 'password', 'student', 'Ritu Sharma', 'ritu.sharma2022@apexcollege.edu.in'),
(19, 'student13', 'password', 'student', 'Deepak Raj', 'deepak.raj2022@apexcollege.edu.in'),
(20, 'student14', 'password', 'student', 'Shweta Choudhary', 'shweta.c2022@apexcollege.edu.in'),
(21, 'student15', 'password', 'student', 'Vivek Saxena', 'vivek.saxena2022@apexcollege.edu.in'),
(22, 'student16', 'password', 'student', 'Neha Srivastava', 'neha.s2022@apexcollege.edu.in'),
(23, 'student17', 'password', 'student', 'Kunal Mehta', 'kunal.mehta2022@apexcollege.edu.in'),
(24, 'student18', 'password', 'student', 'Divya Agarwal', 'divya.a2022@apexcollege.edu.in'),
(25, 'student19', 'password', 'student', 'Saurabh Tiwari', 'saurabh.t2022@apexcollege.edu.in'),
(26, 'student20', 'password', 'student', 'Isha Kapoor', 'isha.kapoor2022@apexcollege.edu.in');


-- 2. TEACHERS TABLE (6 Dedicated Subject Teachers)
INSERT INTO teachers (id, user_id, teacher_code, department, phone, office_hours) VALUES
(1, 1, 'TCH201', 'Computer Science & Engineering', '+91 98765 11001', 'Mon-Fri 02:00 PM - 04:00 PM'),
(2, 2, 'TCH202', 'Software Engineering Dept', '+91 98765 11002', 'Tue-Thu 11:00 AM - 01:00 PM'),
(3, 3, 'TCH203', 'Systems & Architecture Dept', '+91 98765 11003', 'Mon-Wed 03:00 PM - 05:00 PM'),
(4, 4, 'TCH204', 'Database & Data Mining Dept', '+91 98765 11004', 'Wed-Fri 10:00 AM - 12:00 PM'),
(5, 5, 'TCH205', 'Networking & Security Dept', '+91 98765 11005', 'Tue-Fri 02:00 PM - 04:00 PM'),
(6, 6, 'TCH206', 'Theoretical Computer Science', '+91 98765 11006', 'Mon-Thu 12:00 PM - 02:00 PM');


-- 3. STUDENTS TABLE (20 CSE Semester 5 Students)
INSERT INTO students (id, user_id, roll_number, department, semester, batch, phone) VALUES
(1, 7, 'STU101', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00001'),
(2, 8, 'STU102', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00002'),
(3, 9, 'STU103', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00003'),
(4, 10, 'STU104', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00004'),
(5, 11, 'STU105', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00005'),
(6, 12, 'STU106', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00006'),
(7, 13, 'STU107', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00007'),
(8, 14, 'STU108', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00008'),
(9, 15, 'STU109', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00009'),
(10, 16, 'STU110', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00010'),
(11, 17, 'STU111', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00011'),
(12, 18, 'STU112', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00012'),
(13, 19, 'STU113', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00013'),
(14, 20, 'STU114', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00014'),
(15, 21, 'STU115', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00015'),
(16, 22, 'STU116', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00016'),
(17, 23, 'STU117', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00017'),
(18, 24, 'STU118', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00018'),
(19, 25, 'STU119', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00019'),
(20, 26, 'STU120', 'Computer Science & Engg', 5, '2022-2026', '+91 91234 00020');


-- 4. COURSES TABLE (6 Subjects with dedicated Teachers)
INSERT INTO courses (id, course_code, course_name, credits, teacher_id) VALUES
(1, 'CS501', 'Data Structures & Algorithms', 4, 1),
(2, 'CS502', 'Software Engineering & Agile', 3, 2),
(3, 'CS503', 'Operating Systems & Kernel Concepts', 4, 3),
(4, 'CS504', 'Database Management Systems (DBMS)', 4, 4),
(5, 'CS505', 'Computer Networks & Security', 4, 5),
(6, 'CS506', 'Theory of Computation (Automata)', 3, 6);


-- 5. TIMETABLE TABLE (Exact 3 Classes Per Day, Monday to Saturday)
INSERT INTO timetable (id, course_id, day_of_week, start_time, end_time, room_no) VALUES
-- MONDAY (3 Classes)
(1, 1, 'Monday', '09:30 AM', '10:30 AM', 'Lab 301'),
(2, 2, 'Monday', '10:45 AM', '11:45 AM', 'Room 204'),
(3, 3, 'Monday', '01:30 PM', '02:30 PM', 'Room 201'),

-- TUESDAY (3 Classes)
(4, 4, 'Tuesday', '09:30 AM', '10:30 AM', 'Lab 102'),
(5, 5, 'Tuesday', '10:45 AM', '11:45 AM', 'Room 305'),
(6, 6, 'Tuesday', '01:30 PM', '02:30 PM', 'Room 202'),

-- WEDNESDAY (3 Classes)
(7, 1, 'Wednesday', '09:30 AM', '10:30 AM', 'Lab 301'),
(8, 3, 'Wednesday', '10:45 AM', '11:45 AM', 'Room 201'),
(9, 4, 'Wednesday', '01:30 PM', '02:30 PM', 'Lab 102'),

-- THURSDAY (3 Classes)
(10, 2, 'Thursday', '09:30 AM', '10:30 AM', 'Room 204'),
(11, 5, 'Thursday', '10:45 AM', '11:45 AM', 'Lab 305'),
(12, 6, 'Thursday', '01:30 PM', '02:30 PM', 'Room 202'),

-- FRIDAY (3 Classes)
(13, 1, 'Friday', '09:30 AM', '10:30 AM', 'Room 301'),
(14, 4, 'Friday', '10:45 AM', '11:45 AM', 'Room 102'),
(15, 2, 'Friday', '01:30 PM', '02:30 PM', 'Room 204'),

-- SATURDAY (3 Classes)
(16, 3, 'Saturday', '09:30 AM', '10:30 AM', 'Lab 201'),
(17, 5, 'Saturday', '10:45 AM', '11:45 AM', 'Lab 305'),
(18, 6, 'Saturday', '01:30 PM', '02:30 PM', 'Room 202');


-- 6. ATTENDANCE TABLE
INSERT INTO attendance (student_id, course_id, date, status) VALUES
(1, 1, '2026-08-01', 'Present'),
(1, 1, '2026-08-04', 'Present'),
(1, 1, '2026-08-08', 'Present'),
(1, 2, '2026-08-02', 'Present'),
(1, 2, '2026-08-05', 'Present'),
(1, 3, '2026-08-03', 'Present'),
(1, 3, '2026-08-07', 'Absent'),
(1, 4, '2026-08-06', 'Present'),
(1, 5, '2026-08-09', 'Present'),
(1, 6, '2026-08-10', 'Present'),

(2, 1, '2026-08-01', 'Present'),
(2, 1, '2026-08-04', 'Absent'),
(2, 2, '2026-08-02', 'Present'),
(2, 3, '2026-08-03', 'Present');


-- 7. ASSIGNMENTS TABLE (Created by Teachers)
INSERT INTO assignments (id, course_id, teacher_id, title, description, due_date, total_marks) VALUES
(1, 1, 1, 'Binary Search Tree & Graph Traversals', 'Implement BST insertion, deletion, BFS & DFS graph algorithms in Java/C++.', '2026-08-18', 50),
(2, 2, 2, 'SRS Document & UML Use Case Diagrams', 'Draft a professional Software Requirement Specification (SRS) for an E-learning portal.', '2026-08-20', 100),
(3, 3, 3, 'Process Synchronization & Semaphores', 'Solve Producer-Consumer & Readers-Writers problem using C POSIX threads and semaphores.', '2026-08-25', 50),
(4, 4, 4, 'SQL Schema Normalization (3NF & BCNF)', 'Design normalized relational schema and write complex JOIN queries for hospital database.', '2026-08-28', 100),
(5, 5, 5, 'TCP/IP Packet Sniffing & Subnetting Lab', 'Perform Wireshark packet capture analysis and calculate Classless Inter-Domain Routing (CIDR) subnets.', '2026-08-30', 50),
(6, 6, 6, 'DFA & NFA State Minimization Assignment', 'Construct Minimal DFA for given regular expressions and convert NFA with epsilon transitions.', '2026-09-02', 50);


-- 8. SUBMISSIONS TABLE
INSERT INTO submissions (id, assignment_id, student_id, submission_text, status, marks_obtained, feedback) VALUES
(1, 1, 1, 'GitHub Repository Link: https://github.com/rahulsharma/bst-traversals-project. Includes unit tests for BST deletion.', 'Graded', 48, 'Outstanding work! Very clean code structure and comprehensive test cases.'),
(2, 2, 1, 'Submitted SRS document PDF version 1.2 with complete IEEE standard template and Use Case diagrams.', 'Pending', NULL, NULL),
(3, 4, 1, 'SQL queries file uploaded with ER diagram and 3NF normalization justification.', 'Graded', 92, 'Excellent DB schema design.');


-- 9. FEES TABLE
INSERT INTO fees (id, student_id, fee_type, total_amount, paid_amount, due_date, status) VALUES
(1, 1, '5th Semester Tuition Fee', 45000.00, 45000.00, '2026-07-15', 'Paid'),
(2, 1, 'Computer Lab & High-Speed Internet Fee', 8000.00, 8000.00, '2026-08-10', 'Paid'),
(3, 1, 'Central Library & Book Bank Fee', 3500.00, 3500.00, '2026-08-15', 'Paid'),
(4, 1, 'Semester End Examination Fee', 2500.00, 0.00, '2026-09-15', 'Pending');


-- 10. MARKS / RESULTS TABLE
INSERT INTO marks (id, student_id, course_id, exam_type, marks_obtained, max_marks, grade) VALUES
(1, 1, 1, 'Mid-Semester Exam', 45, 50, 'O'),
(2, 1, 2, 'Mid-Semester Exam', 42, 50, 'A+'),
(3, 1, 3, 'Mid-Semester Exam', 46, 50, 'O'),
(4, 1, 4, 'Mid-Semester Exam', 48, 50, 'O'),
(5, 1, 5, 'Mid-Semester Exam', 40, 50, 'A+'),
(6, 1, 6, 'Mid-Semester Exam', 38, 50, 'A');


-- 11. NOTES & STUDY MATERIALS TABLE
INSERT INTO notes (id, course_id, teacher_id, title, content) VALUES
(1, 1, 1, 'DSA Unit-3: Trees & Graphs Master Notes', 'Complete reference guide covering AVL Trees, Red-Black Trees, Dijkstra Algorithm, and Graph TopoSort.'),
(2, 2, 2, 'Software Engg: Agile Scrum & SDLC Lifecycle', 'Detailed handbook explaining Scrum Sprints, User Stories, Product Backlog, and CI/CD pipelines.'),
(3, 3, 3, 'OS Unit-2: CPU Scheduling & Virtual Memory', 'Notes on Round Robin, Priority Scheduling, Page Fault Algorithms, and Thrashing.'),
(4, 4, 4, 'DBMS Unit-4: SQL Joins & B+ Tree Indexing', 'Cheat sheet on Inner/Outer Joins, Relational Algebra operators, and Database Indexing.'),
(5, 5, 5, 'Computer Networks: OSI Layer & TCP Handshake', 'Comprehensive explanation of 3-Way Handshake, Sliding Window Protocol, and Subnetting tricks.'),
(6, 6, 6, 'TOC Unit-1: Automata Theory & Pumping Lemma', 'Proof strategies for Non-Regular Languages using Pumping Lemma and Regular Expression conversion.');
