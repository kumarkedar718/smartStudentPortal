// Smart Student Portal Client Application Logic
// Apex Institute of Technology & Science - CSE Department

const API_BASE = '/api';

// Application State
let currentUser = null; // { id, name, role, studentId, teacherId, rollNumber, teacherCode, department }
let currentView = 'dashboard';

// DOM Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('ssp_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showAppScreen();
    } catch (e) {
      localStorage.removeItem('ssp_user');
    }
  }
});

// Role Switcher on Login Page
function switchRole(role) {
  document.getElementById('loginRole').value = role;
  const btnStudent = document.getElementById('tabStudent');
  const btnTeacher = document.getElementById('tabTeacher');
  const labelUser = document.getElementById('usernameLabel');
  const inputUser = document.getElementById('usernameInput');

  if (role === 'student') {
    btnStudent.classList.add('active');
    btnTeacher.classList.remove('active');
    labelUser.innerHTML = '<i class="fa-solid fa-user"></i> Username / Roll Number';
    inputUser.placeholder = 'e.g. student1 or STU101';
  } else {
    btnTeacher.classList.add('active');
    btnStudent.classList.remove('active');
    labelUser.innerHTML = '<i class="fa-solid fa-user-tie"></i> Username / Teacher Code';
    inputUser.placeholder = 'e.g. teacher1 or TCH201';
  }
}

// Select Demo Account from Dropdown
function selectDemoAccountFromDropdown() {
  const val = document.getElementById('demoAccountSelect').value;
  const [username, role] = val.split('|');
  switchRole(role);
  document.getElementById('usernameInput').value = username;
  document.getElementById('passwordInput').value = 'password';
}

// Handle Login Form Submission
async function handleLogin(e) {
  e.preventDefault();
  const role = document.getElementById('loginRole').value;
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  const msgBox = document.getElementById('loginMessage');
  const btnLogin = document.getElementById('btnLogin');

  msgBox.className = 'auth-message';
  msgBox.innerHTML = '';
  btnLogin.disabled = true;
  btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('ssp_user', JSON.stringify(currentUser));
      msgBox.className = 'auth-message success';
      msgBox.innerHTML = 'Login successful! Entering Apex Smart Portal...';

      setTimeout(() => {
        showAppScreen();
        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Smart Portal';
      }, 400);

    } else {
      msgBox.className = 'auth-message error';
      msgBox.innerHTML = data.message || 'Login failed.';
      btnLogin.disabled = false;
      btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Smart Portal';
    }
  } catch (err) {
    msgBox.className = 'auth-message error';
    msgBox.innerHTML = 'Could not connect to backend server. Make sure node server is running.';
    btnLogin.disabled = false;
    btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Smart Portal';
  }
}

// Show Portal Main App Screen
function showAppScreen() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'flex';

  // Set Profile Information
  document.getElementById('sidebarUserName').innerText = currentUser.name;
  document.getElementById('topUserName').innerText = currentUser.name;
  document.getElementById('sidebarRoleBadge').innerText = currentUser.role.toUpperCase();
  document.getElementById('topUserRole').innerText = currentUser.role.toUpperCase();
  document.getElementById('sidebarAvatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`;

  if (currentUser.role === 'student') {
    document.getElementById('sidebarUserSub').innerText = `Roll: ${currentUser.rollNumber || 'STU101'}`;
    document.getElementById('teachersMenuText').innerText = 'Subject Faculty';
    document.getElementById('teachersCardTitle').innerHTML = '<i class="fa-solid fa-user-tie"></i> Dedicated Subject Faculty Members';
    document.getElementById('directoryBadge').innerText = '6 Subject Professors';

    // Show student-only sidebar items & elements
    document.querySelectorAll('.student-only').forEach(el => el.style.display = '');
    document.querySelectorAll('.teacher-only').forEach(el => el.style.display = 'none');
  } else {
    document.getElementById('sidebarUserSub').innerText = `Code: ${currentUser.teacherCode || 'TCH201'}`;
    document.getElementById('teachersMenuText').innerText = 'Student Roster';
    document.getElementById('teachersCardTitle').innerHTML = '<i class="fa-solid fa-user-graduate"></i> B.Tech CSE Class Directory';
    document.getElementById('directoryBadge').innerText = '20 Enrolled Students';

    // Show teacher-only sidebar items & elements
    document.querySelectorAll('.student-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.teacher-only').forEach(el => el.style.display = '');
  }

  switchView('dashboard');
}

// Handle Logout
function handleLogout() {
  localStorage.removeItem('ssp_user');
  currentUser = null;
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('loginMessage').innerHTML = '';
}

// View Switcher
function switchView(viewName) {
  currentView = viewName;

  // Active Menu Highlight
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle View Containers
  document.querySelectorAll('.portal-view').forEach(view => {
    view.classList.remove('active');
  });

  const activeViewEl = document.getElementById(`view${capitalize(viewName)}`);
  if (activeViewEl) {
    activeViewEl.classList.add('active');
  }

  // Update Header Titles
  updateHeaderTitle(viewName);

  // Load Data for Specific View
  loadViewData(viewName);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateHeaderTitle(viewName) {
  const titles = {
    dashboard: { title: 'Academic Dashboard', sub: 'Apex Institute of Technology • Computer Science Dept' },
    timetable: { title: 'Weekly Class Timetable', sub: 'Lectures and Practical Labs Schedule (Semester 5)' },
    teachers: { title: currentUser.role === 'student' ? 'Dedicated Subject Professors' : 'B.Tech CSE Student Roster', sub: 'Faculty & Student academic directory' },
    attendance: { title: 'Attendance Management', sub: 'Lecture presence and subject-wise logs' },
    assignments: { title: 'Subject Assignments & Projects', sub: 'Track coursework due dates and grade submissions' },
    fees: { title: 'Fee Payment & Receipts', sub: 'Semester tuition fees breakdown and transaction status' },
    marks: { title: 'Examination Performance', sub: 'Mid-Semester Examination marksheet & SGPA transcript' },
    notes: { title: 'Study Notes & Materials', sub: 'Course reference handbooks & lecture cheat sheets' }
  };

  const info = titles[viewName] || { title: 'Portal View', sub: '' };
  document.getElementById('headerTitle').innerText = info.title;
  document.getElementById('headerSubtitle').innerText = info.sub;
}

// Load Data for Views
function loadViewData(viewName) {
  switch (viewName) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'timetable':
      loadTimetableData();
      break;
    case 'teachers':
      loadTeachersOrStudentsData();
      break;
    case 'attendance':
      loadAttendanceData();
      break;
    case 'assignments':
      loadAssignmentsData();
      break;
    case 'fees':
      loadFeesData();
      break;
    case 'marks':
      loadMarksData();
      break;
    case 'notes':
      loadNotesData();
      break;
  }
}


/* ==================== 1. DASHBOARD DATA ==================== */
async function loadDashboardData() {
  const statContainer = document.getElementById('statCardsContainer');
  const coursesContainer = document.getElementById('coursesListContainer');
  const scheduleContainer = document.getElementById('todayScheduleContainer');

  statContainer.innerHTML = '<div class="spinner"></div>';
  coursesContainer.innerHTML = '<div class="spinner"></div>';
  scheduleContainer.innerHTML = '<div class="spinner"></div>';

  if (currentUser.role === 'student') {
    try {
      const res = await fetch(`${API_BASE}/student/dashboard/${currentUser.studentId || 1}`);
      const result = await res.json();
      const stats = result.data;

      statContainer.innerHTML = `
        <div class="stat-card card-blue">
          <div class="stat-val">${stats.enrolledCourses}</div>
          <div class="stat-title">Enrolled Subjects</div>
          <i class="fa-solid fa-book stat-icon"></i>
        </div>
        <div class="stat-card card-orange">
          <div class="stat-val">${stats.pendingAssignments}</div>
          <div class="stat-title">Pending Assignments</div>
          <i class="fa-solid fa-file-signature stat-icon"></i>
        </div>
        <div class="stat-card card-green">
          <div class="stat-val">${stats.attendanceRate}</div>
          <div class="stat-title">Attendance Rate</div>
          <i class="fa-solid fa-user-check stat-icon"></i>
        </div>
        <div class="stat-card card-purple">
          <div class="stat-val">${stats.feeStatus}</div>
          <div class="stat-title">Fee Status</div>
          <i class="fa-solid fa-wallet stat-icon"></i>
        </div>
      `;

      // Load Enrolled Courses
      const attRes = await fetch(`${API_BASE}/student/attendance/${currentUser.studentId || 1}`);
      const attData = await attRes.json();
      
      let coursesHtml = '';
      if (attData.summary && attData.summary.length > 0) {
        attData.summary.forEach(c => {
          const total = c.total_lectures || 0;
          const present = c.present_count || 0;
          const pct = total > 0 ? Math.round((present / total) * 100) : 100;
          coursesHtml += `
            <div class="course-item">
              <div class="course-info">
                <h4>${c.course_name} (${c.course_code})</h4>
                <p>Lectures Attended: ${present}/${total}</p>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${pct}%"></div>
                </div>
              </div>
              <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="switchView('attendance')">View Logs</button>
            </div>
          `;
        });
      }
      coursesContainer.innerHTML = coursesHtml || '<p style="color:var(--text-muted)">No active courses found.</p>';

      // Schedule Highlights
      const ttRes = await fetch(`${API_BASE}/student/timetable/${currentUser.studentId || 1}`);
      const ttData = await ttRes.json();
      let ttHtml = '';
      if (ttData.data && ttData.data.length > 0) {
        ttData.data.forEach(item => {
          ttHtml += `
            <div class="course-item">
              <div class="course-info">
                <h4>${item.course_name}</h4>
                <p><i class="fa-regular fa-clock"></i> <strong>${item.day_of_week}</strong> • ${item.start_time} - ${item.end_time} (${item.teacher_name})</p>
              </div>
              <span class="badge badge-info">${item.room_no}</span>
            </div>
          `;
        });
      }
      scheduleContainer.innerHTML = ttHtml || '<p style="color:var(--text-muted)">No scheduled classes found.</p>';

    } catch (err) {
      console.error(err);
    }
  } else {
    // Teacher Dashboard
    try {
      const res = await fetch(`${API_BASE}/teacher/dashboard/${currentUser.teacherId || 1}`);
      const result = await res.json();
      const stats = result.data;

      statContainer.innerHTML = `
        <div class="stat-card card-blue">
          <div class="stat-val">${stats.assignedCoursesCount}</div>
          <div class="stat-title">Assigned Course</div>
          <i class="fa-solid fa-chalkboard-user stat-icon"></i>
        </div>
        <div class="stat-card card-green">
          <div class="stat-val">${stats.totalStudentsCount}</div>
          <div class="stat-title">Registered Students</div>
          <i class="fa-solid fa-user-graduate stat-icon"></i>
        </div>
        <div class="stat-card card-orange">
          <div class="stat-val">${stats.pendingGradingCount}</div>
          <div class="stat-title">Submissions to Grade</div>
          <i class="fa-solid fa-list-check stat-icon"></i>
        </div>
      `;

      let coursesHtml = '';
      if (stats.courses && stats.courses.length > 0) {
        stats.courses.forEach(c => {
          coursesHtml += `
            <div class="course-item">
              <div class="course-info">
                <h4>${c.course_name} (${c.course_code})</h4>
                <p>Credits: ${c.credits} | Total CSE Batch Students: ${stats.totalStudentsCount}</p>
              </div>
              <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="switchView('attendance')">Mark Attendance</button>
            </div>
          `;
        });
      }
      coursesContainer.innerHTML = coursesHtml || '<p style="color:var(--text-muted)">No assigned courses.</p>';

      scheduleContainer.innerHTML = `
        <div class="course-item">
          <div class="course-info">
            <h4>${stats.courses[0] ? stats.courses[0].course_name : 'Subject Lecture'}</h4>
            <p>Weekly Schedule • Room 301 / Lab 102</p>
          </div>
          <span class="badge badge-success">Active Faculty</span>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  }
}


/* ==================== 2. CLASS TIMETABLE DATA ==================== */
async function loadTimetableData() {
  const tbody = document.querySelector('#timetableTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><div class="spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/student/timetable/${currentUser.studentId || 1}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      tbody.innerHTML = result.data.map(item => `
        <tr>
          <td><strong style="color:var(--primary);">${item.day_of_week}</strong></td>
          <td><i class="fa-regular fa-clock"></i> ${item.start_time} - ${item.end_time}</td>
          <td><strong>${item.course_name}</strong></td>
          <td><span class="badge badge-info">${item.course_code}</span></td>
          <td>${item.room_no}</td>
          <td><i class="fa-solid fa-user-tie" style="color:var(--primary); font-size:12px;"></i> ${item.teacher_name || 'Prof. Faculty'}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No timetable records found.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger)">Failed to load timetable.</td></tr>';
  }
}


/* ==================== 3. TEACHERS / STUDENTS DATA ==================== */
async function loadTeachersOrStudentsData() {
  const container = document.getElementById('teachersGridContainer');
  container.innerHTML = '<div class="spinner"></div>';

  if (currentUser.role === 'student') {
    try {
      const res = await fetch(`${API_BASE}/student/teachers/${currentUser.studentId || 1}`);
      const result = await res.json();

      if (result.data && result.data.length > 0) {
        container.innerHTML = result.data.map(t => `
          <div class="teacher-card">
            <div style="display:flex; align-items:center; gap:14px;">
              <div class="teacher-avatar"><i class="fa-solid fa-user-tie"></i></div>
              <div>
                <h4 style="font-size:15px; font-weight:700;">${t.name}</h4>
                <span class="badge badge-info">${t.teacher_code}</span>
              </div>
            </div>
            <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-building-columns"></i> ${t.department}</p>
            <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-envelope"></i> ${t.email}</p>
            <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${t.phone || 'N/A'}</p>
            <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-clock"></i> ${t.office_hours || 'Mon-Fri 2-4 PM'}</p>
            <p style="font-size:13px; font-weight:700; color:var(--primary); margin-top:4px;">
              <i class="fa-solid fa-book-open"></i> ${t.courses || 'Subject Professor'}
            </p>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<p>No teachers found.</p>';
      }
    } catch (err) {
      container.innerHTML = '<p style="color:var(--danger)">Error loading teachers.</p>';
    }
  } else {
    // Teacher viewing 20 students directory
    try {
      const res = await fetch(`${API_BASE}/teacher/students`);
      const result = await res.json();

      if (result.data && result.data.length > 0) {
        container.innerHTML = result.data.map(s => `
          <div class="teacher-card">
            <div style="display:flex; align-items:center; gap:14px;">
              <div class="teacher-avatar" style="background:#e0e7ff; color:var(--primary);"><i class="fa-solid fa-user-graduate"></i></div>
              <div>
                <h4 style="font-size:15px; font-weight:700;">${s.name}</h4>
                <span class="badge badge-success">${s.roll_number}</span>
              </div>
            </div>
            <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-envelope"></i> ${s.email}</p>
            <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-graduation-cap"></i> ${s.department} (Sem ${s.semester})</p>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<p>No students found.</p>';
      }
    } catch (err) {
      container.innerHTML = '<p style="color:var(--danger)">Error loading students.</p>';
    }
  }
}


/* ==================== 4. ATTENDANCE DATA ==================== */
async function loadAttendanceData() {
  const summaryContainer = document.getElementById('attendanceSummaryContainer');
  const logsTbody = document.querySelector('#attendanceLogsTable tbody');

  logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center"><div class="spinner"></div></td></tr>';

  if (currentUser.role === 'student') {
    try {
      const res = await fetch(`${API_BASE}/student/attendance/${currentUser.studentId || 1}`);
      const result = await res.json();

      // Render Subject Breakdown
      if (result.summary && result.summary.length > 0) {
        summaryContainer.innerHTML = result.summary.map(s => {
          const total = s.total_lectures || 0;
          const present = s.present_count || 0;
          const pct = total > 0 ? Math.round((present / total) * 100) : 100;
          const badgeClass = pct >= 75 ? 'badge-success' : 'badge-danger';
          return `
            <div class="teacher-card">
              <h4 style="font-size:15px; font-weight:700;">${s.course_name} (${s.course_code})</h4>
              <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 0;">
                <span class="badge ${badgeClass}">${pct}% Attended</span>
                <span style="font-size:12px; color:var(--text-muted);">${present} / ${total} Lectures</span>
              </div>
              <div class="progress-bar" style="width:100%;">
                <div class="progress-fill" style="width:${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Logs
      if (result.logs && result.logs.length > 0) {
        logsTbody.innerHTML = result.logs.map(l => `
          <tr>
            <td>${l.date}</td>
            <td><span class="badge badge-info">${l.course_code}</span></td>
            <td>${l.course_name}</td>
            <td><span class="badge ${l.status === 'Present' ? 'badge-success' : 'badge-danger'}">${l.status}</span></td>
          </tr>
        `).join('');
      } else {
        logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No attendance logs available.</td></tr>';
      }

    } catch (err) {
      logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--danger)">Error loading attendance.</td></tr>';
    }
  } else {
    // Teacher Attendance Portal
    document.getElementById('teacherAttendanceControls').style.display = 'block';
    
    // Set default date to today
    if (!document.getElementById('attendanceDateInput').value) {
      document.getElementById('attendanceDateInput').value = new Date().toISOString().split('T')[0];
    }

    // Populate Course Select
    try {
      const cRes = await fetch(`${API_BASE}/teacher/courses/${currentUser.teacherId || 1}`);
      const cData = await cRes.json();
      const select = document.getElementById('attendanceCourseSelect');
      select.innerHTML = '<option value="">-- Select Subject Course --</option>' + 
        cData.data.map(c => `<option value="${c.id}">${c.course_name} (${c.course_code})</option>`).join('');

      // Load empty roster message
      document.getElementById('attendanceRosterContainer').innerHTML = '<p style="color:var(--text-muted)">Select a course and click "Load Roster" to mark attendance for all 20 students.</p>';
      logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Attendance logs available upon filtering.</td></tr>';
    } catch (err) {
      console.error(err);
    }
  }
}

// Teacher Roster Loader for Attendance
async function loadStudentRosterForAttendance() {
  const courseId = document.getElementById('attendanceCourseSelect').value;
  const date = document.getElementById('attendanceDateInput').value;
  const container = document.getElementById('attendanceRosterContainer');

  if (!courseId) {
    alert('Please select a course.');
    return;
  }

  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch(`${API_BASE}/teacher/students?courseId=${courseId}&date=${date}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      let html = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      result.data.forEach(s => {
        const isPresent = s.today_status === 'Present' || !s.today_status;
        html += `
          <tr>
            <td><strong>${s.roll_number}</strong></td>
            <td>${s.name}</td>
            <td>
              <label style="margin-right:15px; cursor:pointer;">
                <input type="radio" name="att_${s.student_id}" value="Present" ${isPresent ? 'checked' : ''} /> Present
              </label>
              <label style="cursor:pointer; color:var(--danger);">
                <input type="radio" name="att_${s.student_id}" value="Absent" ${!isPresent ? 'checked' : ''} /> Absent
              </label>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
        <div style="margin-top:15px; text-align:right;">
          <button class="btn-primary" onclick="saveAttendanceAction(${courseId}, '${date}')">
            <i class="fa-solid fa-floppy-disk"></i> Save Attendance
          </button>
        </div>
      `;
      container.innerHTML = html;
    } else {
      container.innerHTML = '<p>No students enrolled.</p>';
    }
  } catch (err) {
    container.innerHTML = '<p style="color:var(--danger)">Failed to load roster.</p>';
  }
}

// Save Attendance Action
async function saveAttendanceAction(courseId, date) {
  const radioInputs = document.querySelectorAll('#attendanceRosterContainer input[type="radio"]:checked');
  const records = [];

  radioInputs.forEach(input => {
    const studentId = input.name.replace('att_', '');
    records.push({
      student_id: parseInt(studentId),
      status: input.value
    });
  });

  try {
    const res = await fetch(`${API_BASE}/teacher/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, date, records })
    });
    const data = await res.json();
    if (data.success) {
      alert('Attendance saved successfully for all students!');
    } else {
      alert('Failed: ' + data.message);
    }
  } catch (err) {
    alert('Error saving attendance: ' + err.message);
  }
}


/* ==================== 5. ASSIGNMENTS DATA ==================== */
async function loadAssignmentsData() {
  const container = document.getElementById('assignmentsContainer');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch(`${API_BASE}/student/assignments/${currentUser.studentId || 1}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      container.innerHTML = result.data.map(a => {
        const isStudent = currentUser.role === 'student';
        const isSubmitted = a.submission_id !== null;
        const isGraded = a.submission_status === 'Graded';

        let statusBadge = '<span class="badge badge-warning">Pending Submission</span>';
        if (isSubmitted) {
          statusBadge = isGraded 
            ? `<span class="badge badge-success">Graded: ${a.marks_obtained}/${a.total_marks}</span>`
            : '<span class="badge badge-info">Submitted (Pending Grade)</span>';
        }

        return `
          <div class="teacher-card" style="margin-bottom:15px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <h4 style="font-size:16px; font-weight:700;">${a.title}</h4>
                <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">
                  Subject: <strong>${a.course_name} (${a.course_code})</strong> • Faculty: ${a.teacher_name || 'Prof. Faculty'}
                </p>
              </div>
              <div>${statusBadge}</div>
            </div>

            <p style="font-size:13px; margin:10px 0; color:var(--text-main); line-height:1.5;">${a.description || 'No detailed instructions provided.'}</p>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:10px;">
              <span style="font-size:12px; color:var(--danger); font-weight:700;">
                <i class="fa-regular fa-clock"></i> Due Date: ${a.due_date}
              </span>
              ${isStudent ? `
                <button class="btn-primary" style="padding:6px 14px; font-size:12px;" onclick="openSubmitModal(${a.id}, '${escapeHtml(a.title)}')">
                  ${isSubmitted ? 'Resubmit Solution' : 'Submit Solution'}
                </button>
              ` : ''}
            </div>

            ${a.feedback ? `
              <div style="background:#f0fdf4; padding:10px; border-radius:8px; margin-top:10px; font-size:13px; color:#166534;">
                <strong><i class="fa-solid fa-comment-dots"></i> Faculty Feedback:</strong> ${a.feedback}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p>No assignments found.</p>';
    }

    if (currentUser.role === 'teacher') {
      loadTeacherSubmissionsData();
    }

  } catch (err) {
    container.innerHTML = '<p style="color:var(--danger)">Error loading assignments.</p>';
  }
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'");
}

// Teacher Submissions Table
async function loadTeacherSubmissionsData() {
  const tbody = document.querySelector('#teacherSubmissionsTable tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center"><div class="spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/teacher/submissions/${currentUser.teacherId || 1}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      tbody.innerHTML = result.data.map(sub => `
        <tr>
          <td><strong>${sub.student_name}</strong></td>
          <td>${sub.roll_number}</td>
          <td>${sub.assignment_title}</td>
          <td>${new Date(sub.submission_date).toLocaleDateString()}</td>
          <td><span class="badge ${sub.status === 'Graded' ? 'badge-success' : 'badge-warning'}">${sub.status}</span></td>
          <td>${sub.marks_obtained !== null ? `${sub.marks_obtained}/${sub.total_marks}` : '-'}</td>
          <td>
            <button class="btn-primary" style="padding:4px 10px; font-size:12px;" onclick="openGradeModal(${sub.id}, '${escapeHtml(sub.submission_text || '')}', ${sub.marks_obtained || ''}, '${escapeHtml(sub.feedback || '')}')">
              <i class="fa-solid fa-pen-to-square"></i> Grade
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No student submissions yet.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger)">Error loading submissions.</td></tr>';
  }
}


/* ==================== 6. FEES DATA ==================== */
async function loadFeesData() {
  const tbody = document.querySelector('#feesTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><div class="spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/student/fees/${currentUser.studentId || 1}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      tbody.innerHTML = result.data.map(f => {
        const remaining = Number(f.total_amount) - Number(f.paid_amount);
        let badge = 'badge-success';
        if (f.status === 'Partial') badge = 'badge-warning';
        if (f.status === 'Pending') badge = 'badge-danger';

        return `
          <tr>
            <td><strong>${f.fee_type}</strong></td>
            <td>₹${Number(f.total_amount).toLocaleString('en-IN')}</td>
            <td>₹${Number(f.paid_amount).toLocaleString('en-IN')}</td>
            <td style="color:${remaining > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:700;">₹${remaining.toLocaleString('en-IN')}</td>
            <td>${f.due_date}</td>
            <td><span class="badge ${badge}">${f.status}</span></td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No fee records found.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger)">Error loading fees.</td></tr>';
  }
}


/* ==================== 7. MARKS / RESULTS DATA ==================== */
async function loadMarksData() {
  const tbody = document.querySelector('#marksTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><div class="spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/student/marks/${currentUser.studentId || 1}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      tbody.innerHTML = result.data.map(m => `
        <tr>
          <td><span class="badge badge-info">${m.course_code}</span></td>
          <td><strong>${m.course_name}</strong></td>
          <td>${m.exam_type}</td>
          <td><strong>${m.marks_obtained}</strong></td>
          <td>${m.max_marks}</td>
          <td><span class="badge badge-success" style="font-size:13px;">${m.grade}</span></td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No examination results published yet.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger)">Error loading marks.</td></tr>';
  }
}


/* ==================== 8. NOTES & MATERIALS DATA ==================== */
async function loadNotesData() {
  const container = document.getElementById('notesGridContainer');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch(`${API_BASE}/student/notes`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      container.innerHTML = result.data.map(n => `
        <div class="note-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-info">${n.course_name}</span>
            <span style="font-size:11px; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${new Date(n.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
          <h4 style="font-size:15px; font-weight:700; color:var(--text-main);">${n.title}</h4>
          <p style="font-size:12px; color:var(--text-muted); line-height:1.4;">${n.content || 'Study notes reference document.'}</p>
          <div style="margin-top:10px;">
            <button class="btn-primary" style="padding:6px 12px; font-size:12px; width:100%;" onclick="alert('Viewing Subject Notes: ${escapeHtml(n.title)}')">
              <i class="fa-solid fa-file-arrow-down"></i> Open / Read Handbook
            </button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p>No study notes available.</p>';
    }
  } catch (err) {
    container.innerHTML = '<p style="color:var(--danger)">Error loading notes.</p>';
  }
}


/* ==================== MODAL HANDLERS ==================== */

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Student Submit Assignment Modal
function openSubmitModal(assignId, title) {
  document.getElementById('submitAssignId').value = assignId;
  document.getElementById('modalAssignTitle').innerText = `Submit: ${title}`;
  document.getElementById('submissionTextInput').value = '';
  document.getElementById('submitAssignmentModal').style.display = 'flex';
}

async function submitAssignmentAction() {
  const assignId = document.getElementById('submitAssignId').value;
  const text = document.getElementById('submissionTextInput').value.trim();

  if (!text) {
    alert('Please enter your submission text or link.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/student/assignments/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: assignId,
        student_id: currentUser.studentId || 1,
        submission_text: text
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Assignment submitted successfully!');
      closeModal('submitAssignmentModal');
      loadAssignmentsData();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Failed to submit: ' + err.message);
  }
}

// Teacher Create Assignment Modal
async function openCreateAssignmentModal() {
  const select = document.getElementById('createAssignCourse');
  try {
    const res = await fetch(`${API_BASE}/teacher/courses/${currentUser.teacherId || 1}`);
    const result = await res.json();
    select.innerHTML = result.data.map(c => `<option value="${c.id}">${c.course_name} (${c.course_code})</option>`).join('');
    document.getElementById('createAssignTitle').value = '';
    document.getElementById('createAssignDesc').value = '';
    document.getElementById('createAssignDueDate').value = '';
    document.getElementById('createAssignmentModal').style.display = 'flex';
  } catch (err) {
    alert('Could not fetch courses.');
  }
}

async function createAssignmentAction() {
  const course_id = document.getElementById('createAssignCourse').value;
  const title = document.getElementById('createAssignTitle').value.trim();
  const description = document.getElementById('createAssignDesc').value.trim();
  const due_date = document.getElementById('createAssignDueDate').value;
  const total_marks = document.getElementById('createAssignMarks').value;

  if (!title || !due_date) {
    alert('Please fill assignment title and due date.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/teacher/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id,
        teacher_id: currentUser.teacherId || 1,
        title,
        description,
        due_date,
        total_marks
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Assignment posted successfully!');
      closeModal('createAssignmentModal');
      loadAssignmentsData();
    } else {
      alert('Failed: ' + data.message);
    }
  } catch (err) {
    alert('Error creating assignment: ' + err.message);
  }
}

// Teacher Grade Modal
function openGradeModal(submissionId, subText, currentMarks, currentFeedback) {
  document.getElementById('gradeSubmissionId').value = submissionId;
  document.getElementById('gradeSubmissionPreview').innerText = subText || 'No text submitted.';
  document.getElementById('gradeMarksInput').value = currentMarks || '';
  document.getElementById('gradeFeedbackInput').value = currentFeedback || '';
  document.getElementById('gradeSubmissionModal').style.display = 'flex';
}

async function saveGradeAction() {
  const submission_id = document.getElementById('gradeSubmissionId').value;
  const marks_obtained = document.getElementById('gradeMarksInput').value;
  const feedback = document.getElementById('gradeFeedbackInput').value.trim();

  if (marks_obtained === '') {
    alert('Please enter marks.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/teacher/submissions/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id,
        marks_obtained: parseInt(marks_obtained),
        feedback
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Grade saved successfully!');
      closeModal('gradeSubmissionModal');
      loadAssignmentsData();
    } else {
      alert('Failed: ' + data.message);
    }
  } catch (err) {
    alert('Error grading submission: ' + err.message);
  }
}
