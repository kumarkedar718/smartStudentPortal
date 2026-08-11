# 🎓 Smart Student Portal - Full Stack Web Application

A full-stack Academic Management Portal built for **Apex Institute of Technology & Science** (Department of Computer Science & Engineering).

## 🚀 Key Features

### 👨‍🎓 Student Portal
- **Academic Dashboard**: Enrolled courses count, pending assignments, overall attendance %, and fee balance status.
- **Weekly Class Timetable**: 3 classes per day schedule displaying lecture time slots, subject codes, classrooms, and subject professors.
- **Subject Faculty Directory**: Dedicated professor profile, office hours, and contact details.
- **Attendance Tracker**: Subject-wise attendance percentage with progress bars and daily date logs.
- **Assignments Center**: View pending/submitted assignments, submit solutions/GitHub repo links, and check faculty feedback.
- **Fee Receipts & Breakdown**: Tuition fee breakdown, paid amount, due balance, and official receipt status.
- **Academic Results & Transcript**: Mid-semester examination marks and CGPA scorecard.
- **Study Materials & Notes**: Unit-wise lecture notes and reference handbooks.

### 👨‍🏫 Faculty Portal
- **Faculty Dashboard**: Assigned course details, registered students count, and pending submissions to grade.
- **Interactive Student Attendance Marker**: Select subject & date $\rightarrow$ view student roster $\rightarrow$ mark Present/Absent $\rightarrow$ save directly to database.
- **Assignment Manager**: Post new course assignments with title, guidelines, due date, and total marks.
- **Submissions & Grading**: View student submissions, review submitted text/links, assign marks, and provide feedback.
- **Student Roster**: Browse 20 enrolled CSE students with roll numbers and email addresses.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla Glassmorphism Design System), JavaScript (ES6+), Font Awesome 6.
- **Backend**: Node.js, Express.js REST API.
- **Database**: MySQL Server (with embedded SQLite fallback for local plug-and-play execution).

---

## 💻 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/smartStudentPortal.git
   cd smartStudentPortal
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:5000`

---

## 🔑 Demo Credentials

- **Student Login**: Username: `student1` | Password: `password` (or select any student STU101 to STU120)
- **Faculty Login**: Username: `teacher1` | Password: `password` (or select any teacher TCH201 to TCH206)

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
