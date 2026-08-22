// Smart Student Portal Client Application Logic
// Gandhi Institute for Education and Technology (GIET) - CSE Department

const API_BASE = '/api';

// Application State
let currentUser = null; // { id, name, role, studentId, teacherId, rollNumber, teacherCode, department }
let currentView = 'dashboard';
let globalNotesCache = [];
let doughnutChartInstance = null;
let barChartInstance = null;

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

  // Load saved Gemini API Key if available
  const savedApiKey = localStorage.getItem('ssp_gemini_api_key');
  if (savedApiKey) {
    const keyInput = document.getElementById('userApiKeyInput');
    if (keyInput) keyInput.value = savedApiKey;
  }
});

// Switch Question Bank Tabs in Gemini AI View
function switchQbTab(subject) {
  const tabs = ['os', 'dsa', 'se', 'dbms', 'cn', 'toc'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tabQb${capitalizeWord(t)}`);
    const pane = document.getElementById(`qbCategory${capitalizeWord(t)}`);
    if (t === subject) {
      if (tabBtn) tabBtn.classList.add('active');
      if (pane) pane.style.display = 'block';
    } else {
      if (tabBtn) tabBtn.classList.remove('active');
      if (pane) pane.style.display = 'none';
    }
  });
}

function capitalizeWord(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Save User Gemini API Key
function saveUserApiKey() {
  const keyInput = document.getElementById('userApiKeyInput');
  const key = keyInput ? keyInput.value.trim() : '';
  if (key) {
    localStorage.setItem('ssp_gemini_api_key', key);
    alert('Google Gemini API Key saved successfully! Live 100% Google AI responses active.');
  } else {
    localStorage.removeItem('ssp_gemini_api_key');
    alert('Gemini API Key removed.');
  }
}

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
    inputUser.placeholder = 'e.g. student1 or GIET2022CSE101';
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
      msgBox.innerHTML = 'Login successful! Entering GIET Student Portal...';

      setTimeout(() => {
        showAppScreen();
        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Student Portal';
      }, 400);

    } else {
      msgBox.className = 'auth-message error';
      msgBox.innerHTML = data.message || 'Login failed.';
      btnLogin.disabled = false;
      btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Student Portal';
    }
  } catch (err) {
    msgBox.className = 'auth-message error';
    msgBox.innerHTML = 'Could not connect to backend server. Make sure node server is running.';
    btnLogin.disabled = false;
    btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Student Portal';
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
    document.getElementById('sidebarUserSub').innerText = `Roll: ${currentUser.rollNumber || 'GIET2022CSE101'}`;
    document.getElementById('teachersMenuText').innerText = 'Subject Faculty';
    document.getElementById('teachersCardTitle').innerHTML = '<i class="fa-solid fa-user-tie"></i> Dedicated Subject Faculty Members';
    document.getElementById('directoryBadge').innerText = '6 Subject Professors';

    // Show student-only sidebar items & elements
    document.querySelectorAll('.student-only').forEach(el => el.style.display = '');
    document.querySelectorAll('.teacher-only').forEach(el => el.style.display = 'none');
  } else {
    document.getElementById('sidebarUserSub').innerText = `Code: ${currentUser.teacherCode || 'TCH201'}`;
    document.getElementById('teachersMenuText').innerText = 'Student Roster';
    document.getElementById('teachersCardTitle').innerHTML = '<i class="fa-solid fa-user-graduate"></i> GIET CSE Class Directory';
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
  if (str === 'ai-assistant') return 'Ai-assistant';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateHeaderTitle(viewName) {
  const titles = {
    dashboard: { title: 'Academic Dashboard Overview', sub: 'Gandhi Institute for Education and Technology • CSE Department' },
    timetable: { title: 'Weekly Class Timetable', sub: 'Lectures and Practical Labs Schedule (Semester 5)' },
    teachers: { title: currentUser.role === 'student' ? 'Dedicated Subject Professors' : 'GIET CSE Student Directory', sub: 'Faculty & Student academic directory' },
    attendance: { title: '3D Interactive Attendance Analytics', sub: 'Graphical visual gauge, subject comparison charts & logs' },
    assignments: { title: 'Coursework & Projects', sub: 'Track due dates, submit solutions, and view grades' },
    fees: { title: 'Semester Fees & Official Receipts', sub: 'Tuition fee breakdown and transaction history' },
    marks: { title: 'Academic Performance & Marksheet', sub: 'Mid-Semester Examination marksheet & SGPA transcript' },
    notes: { title: 'Study Notes & Handbooks', sub: 'Course reference handbooks & unit cheat sheets' },
    'ai-assistant': { title: 'Official Google Gemini 1.5 Flash AI', sub: 'Ask ANY question on Data Structures, Software Engg, OS, DBMS, Networks, Automata' }
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


/* ==================== 1. DASHBOARD DATA & INTERACTIVE CARDS ==================== */
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

      // Clickable Stat Cards
      statContainer.innerHTML = `
        <div class="stat-card card-blue" onclick="onClickStatCard('courses')" title="Click to view Enrolled Subjects Detail">
          <div class="stat-val">${stats.enrolledCourses}</div>
          <div class="stat-title">Enrolled Subjects <i class="fa-solid fa-arrow-right" style="font-size:10px;"></i></div>
          <i class="fa-solid fa-book stat-icon"></i>
        </div>
        <div class="stat-card card-orange" onclick="onClickStatCard('assignments')" title="Click to view Pending Assignments">
          <div class="stat-val">${stats.pendingAssignments}</div>
          <div class="stat-title">Pending Assignments <i class="fa-solid fa-arrow-right" style="font-size:10px;"></i></div>
          <i class="fa-solid fa-file-signature stat-icon"></i>
        </div>
        <div class="stat-card card-green" onclick="onClickStatCard('attendance')" title="Click to view Attendance Analytics">
          <div class="stat-val">${stats.attendanceRate}</div>
          <div class="stat-title">Attendance Rate <i class="fa-solid fa-arrow-right" style="font-size:10px;"></i></div>
          <i class="fa-solid fa-user-check stat-icon"></i>
        </div>
        <div class="stat-card card-purple" onclick="onClickStatCard('fees')" title="Click to view Fees & Payments">
          <div class="stat-val">${stats.feeStatus}</div>
          <div class="stat-title">Fee Balance <i class="fa-solid fa-arrow-right" style="font-size:10px;"></i></div>
          <i class="fa-solid fa-wallet stat-icon"></i>
        </div>
      `;

      // Load Enrolled Courses Progress
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
        ttData.data.slice(0, 6).forEach(item => {
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
                <p>Credits: ${c.credits} | Total GIET CSE Students: ${stats.totalStudentsCount}</p>
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

// Click Action for Interactive Stat Cards
async function onClickStatCard(type) {
  if (type === 'courses') {
    const modal = document.getElementById('enrolledSubjectsModal');
    const body = document.getElementById('enrolledSubjectsBody');
    body.innerHTML = '<div class="spinner"></div>';
    modal.style.display = 'flex';

    try {
      const res = await fetch(`${API_BASE}/student/teachers/${currentUser.studentId || 1}`);
      const result = await res.json();
      
      let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
      if (result.data) {
        result.data.forEach(t => {
          html += `
            <div class="course-item">
              <div>
                <h4 style="font-size:15px; font-weight:700;">${t.courses || 'Subject Course'}</h4>
                <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-user-tie"></i> Faculty: <strong>${t.name}</strong> (${t.teacher_code})</p>
                <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-clock"></i> Office Hours: ${t.office_hours || 'Mon-Fri 2-4 PM'}</p>
              </div>
              <span class="badge badge-info">4 Credits</span>
            </div>
          `;
        });
      }
      html += '</div>';
      body.innerHTML = html;
    } catch (e) {
      body.innerHTML = '<p style="color:var(--danger)">Failed to load enrolled subjects.</p>';
    }
  } else {
    switchView(type);
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


/* ==================== 4. ATTENDANCE DATA & INTERACTIVE 3D CHARTS ==================== */
async function loadAttendanceData() {
  const summaryContainer = document.getElementById('attendanceSummaryContainer');
  const logsTbody = document.querySelector('#attendanceLogsTable tbody');

  logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center"><div class="spinner"></div></td></tr>';

  if (currentUser.role === 'student') {
    try {
      const res = await fetch(`${API_BASE}/student/attendance/${currentUser.studentId || 1}`);
      const result = await res.json();

      if (result.summary && result.summary.length > 0) {
        renderAttendanceCharts(result.summary);

        summaryContainer.innerHTML = result.summary.map(s => {
          const total = s.total_lectures || 0;
          const present = s.present_count || 0;
          const pct = total > 0 ? Math.round((present / total) * 100) : 100;
          const badgeClass = pct >= 75 ? 'badge-success' : 'badge-danger';
          const fillGradient = pct >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #f59e0b)';

          return `
            <div class="teacher-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="font-size:15px; font-weight:700;">${s.course_name} (${s.course_code})</h4>
                <span class="badge ${badgeClass}">${pct}% Attended</span>
              </div>

              <div style="margin: 12px 0;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-bottom:4px;">
                  <span>Present: <strong>${present}</strong></span>
                  <span>Absent: <strong>${s.absent_count || 0}</strong></span>
                  <span>Total: <strong>${total}</strong></span>
                </div>
                <div class="progress-bar" style="width:100%; height:12px; border-radius:10px;">
                  <div class="progress-fill" style="width:${pct}%; background:${fillGradient};"></div>
                </div>
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
    
    if (!document.getElementById('attendanceDateInput').value) {
      document.getElementById('attendanceDateInput').value = new Date().toISOString().split('T')[0];
    }

    try {
      const cRes = await fetch(`${API_BASE}/teacher/courses/${currentUser.teacherId || 1}`);
      const cData = await cRes.json();
      const select = document.getElementById('attendanceCourseSelect');
      select.innerHTML = '<option value="">-- Select Subject Course --</option>' + 
        cData.data.map(c => `<option value="${c.id}">${c.course_name} (${c.course_code})</option>`).join('');

      document.getElementById('attendanceRosterContainer').innerHTML = '<p style="color:var(--text-muted)">Select a course and click "Load Roster" to mark attendance for GIET students.</p>';
      logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Attendance logs available upon filtering.</td></tr>';
    } catch (err) {
      console.error(err);
    }
  }
}

// Render Interactive Chart.js Visualizations (3D Doughnut & 3D Bar Graph)
function renderAttendanceCharts(summaryData) {
  if (typeof Chart === 'undefined') return;

  let totalPresent = 0, totalAbsent = 0;
  const labels = [];
  const percentages = [];
  const barColors = [];

  summaryData.forEach(item => {
    const total = item.total_lectures || 0;
    const present = item.present_count || 0;
    const absent = item.absent_count || 0;
    const pct = total > 0 ? Math.round((present / total) * 100) : 100;

    totalPresent += present;
    totalAbsent += absent;
    labels.push(item.course_code || item.course_name);
    percentages.push(pct);
    barColors.push(pct >= 75 ? '#10b981' : '#ef4444');
  });

  const doughnutCtx = document.getElementById('attendanceDoughnutChart');
  if (doughnutCtx) {
    if (doughnutChartInstance) doughnutChartInstance.destroy();
    doughnutChartInstance = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Lectures Attended (Present)', 'Missed Lectures (Absent)'],
        datasets: [{
          data: [totalPresent, totalAbsent],
          backgroundColor: ['#10b981', '#ef4444'],
          hoverBackgroundColor: ['#059669', '#dc2626'],
          borderWidth: 3,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' } } },
          tooltip: { cornerRadius: 8, padding: 10 }
        },
        cutout: '70%'
      }
    });
  }

  const barCtx = document.getElementById('attendanceBarChart');
  if (barCtx) {
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Subject Attendance (%)',
          data: percentages,
          backgroundColor: barColors,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: value => value + '%' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => `Attendance: ${context.raw}% (${context.raw >= 75 ? 'Safe ✅' : 'Warning ⚠️'})`
            }
          }
        }
      }
    });
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
      alert('Attendance saved successfully for GIET students!');
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


/* ==================== 6. ENHANCED FEES & PAYMENTS DATA ==================== */
async function loadFeesData() {
  const tbody = document.querySelector('#feesTable tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center"><div class="spinner"></div></td></tr>';

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
            <td>
              <button class="btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="openFeeReceiptModal()">
                <i class="fa-solid fa-receipt"></i> Receipt
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No fee records found.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger)">Error loading fees.</td></tr>';
  }
}

// Open Official GIET Fee Receipt Modal
function openFeeReceiptModal() {
  const modal = document.getElementById('feeReceiptModal');
  const body = document.getElementById('feeReceiptBody');
  modal.style.display = 'flex';

  const roll = currentUser ? currentUser.rollNumber || 'GIET2022CSE101' : 'GIET2022CSE101';
  const name = currentUser ? currentUser.name : 'Rahul Sharma';

  body.innerHTML = `
    <div style="border:1.5px dashed var(--primary); padding:20px; border-radius:12px; background:#fafafa;">
      <div style="text-align:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:12px;">
        <h3 style="font-size:18px; font-weight:800; color:var(--primary);">Gandhi Institute for Education and Technology</h3>
        <p style="font-size:12px; color:var(--text-muted);">B.Tech Computer Science & Engineering • Semester 5</p>
        <span class="badge badge-success" style="margin-top:6px;">RECEIPT NO: GIET-FEE-2026-9821</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px; margin-bottom:15px;">
        <div><strong>Student Name:</strong> ${name}</div>
        <div><strong>Roll Number:</strong> ${roll}</div>
        <div><strong>Payment Date:</strong> 15th August 2026</div>
        <div><strong>Payment Mode:</strong> Online UPI / Net Banking</div>
      </div>

      <table class="data-table" style="font-size:12px;">
        <thead>
          <tr><th>Fee Particulars</th><th>Amount Paid</th></tr>
        </thead>
        <tbody>
          <tr><td>5th Sem Tuition Fee</td><td>₹45,000.00</td></tr>
          <tr><td>Computer Lab & Internet Charges</td><td>₹8,000.00</td></tr>
          <tr><td>Central Library & Book Bank Fee</td><td>₹3,500.00</td></tr>
          <tr style="font-weight:800; background:#f1f5f9;"><td>TOTAL PAID AMOUNT</td><td>₹56,500.00</td></tr>
        </tbody>
      </table>

      <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:flex-end; font-size:11px; color:var(--text-muted);">
        <div>Computer Generated Official Document • No Signature Required</div>
        <div style="text-align:center; border-top:1px solid #ccc; padding-top:4px; width:120px;">
          Accounts Officer<br/>GIET College
        </div>
      </div>
    </div>
  `;
}


/* ==================== 7. ENHANCED ACADEMIC RESULTS / MARKS DATA ==================== */
async function loadMarksData() {
  const tbody = document.querySelector('#marksTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><div class="spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/student/marks/${currentUser.studentId || 1}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      tbody.innerHTML = result.data.map(m => {
        const internal = Math.round(m.marks_obtained * 0.4);
        const midSem = m.marks_obtained;
        const total = internal + midSem;

        return `
          <tr>
            <td><span class="badge badge-info">${m.course_code}</span></td>
            <td><strong>${m.course_name}</strong></td>
            <td>${internal} / 20</td>
            <td>${midSem} / 30</td>
            <td><strong>${total} / 50</strong></td>
            <td><span class="badge badge-success" style="font-size:13px;">${m.grade}</span></td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No examination results published yet.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger)">Error loading marks.</td></tr>';
  }
}


/* ==================== 8. ENHANCED NOTES & READER MODAL ==================== */
async function loadNotesData() {
  const container = document.getElementById('notesGridContainer');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch(`${API_BASE}/student/notes`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
      globalNotesCache = result.data;
      container.innerHTML = result.data.map(n => `
        <div class="note-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-info">${n.course_name} (${n.course_code || 'CS501'})</span>
            <span style="font-size:11px; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${new Date(n.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
          <h4 style="font-size:15px; font-weight:700; color:var(--text-main);">${n.title}</h4>
          <p style="font-size:12px; color:var(--text-muted); line-height:1.4;">${(n.content || '').substring(0, 110)}...</p>
          <div style="margin-top:10px;">
            <button class="btn-primary" style="padding:8px 14px; font-size:12px; width:100%;" onclick="readNoteAction(${n.id})">
              <i class="fa-solid fa-book-open-reader"></i> Open & Read Full Handbook
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

// Open Full Study Note Reader Modal
function readNoteAction(noteId) {
  const note = globalNotesCache.find(n => n.id === noteId);
  const modal = document.getElementById('readNoteModal');
  const title = document.getElementById('noteModalTitle');
  const sub = document.getElementById('noteModalSub');
  const body = document.getElementById('noteModalBodyContent');

  if (note) {
    title.innerText = note.title;
    sub.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${note.course_name} • Faculty: <strong>${note.teacher_name || 'Prof. Faculty'}</strong>`;
    body.innerHTML = escapeHtmlText(note.content || 'Full study content reference handbook.');
    modal.style.display = 'flex';
  } else {
    alert('Could not find note details.');
  }
}


/* ==================== 9. OFFICIAL GOOGLE GEMINI 1.5 FLASH REST API CHAT ==================== */
function fillAiPrompt(text) {
  document.getElementById('aiQuestionInput').value = text;
}

function fillAndSendAiPrompt(text) {
  const input = document.getElementById('aiQuestionInput');
  if (input) {
    input.value = text;
    const form = document.getElementById('aiChatForm');
    if (form) {
      const event = new Event('submit', { cancelable: true, bubbles: true });
      form.dispatchEvent(event);
    }
  }
}

async function handleSendAiMessage(e) {
  e.preventDefault();
  const input = document.getElementById('aiQuestionInput');
  const question = input.value.trim();
  const btnSend = document.getElementById('btnSendAi');
  const chatWindow = document.getElementById('chatMessagesWindow');
  const keyInput = document.getElementById('userApiKeyInput');
  const userApiKey = keyInput ? keyInput.value.trim() : localStorage.getItem('ssp_gemini_api_key') || '';

  if (!question) return;

  // Render User Message Bubble
  const userBubbleHtml = `
    <div class="chat-msg user-msg">
      <div class="msg-avatar"><i class="fa-solid fa-user-graduate"></i></div>
      <div class="msg-content">
        <p>${escapeHtmlText(question)}</p>
      </div>
    </div>
  `;
  chatWindow.insertAdjacentHTML('beforeend', userBubbleHtml);
  input.value = '';
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Show Typing Indicator
  btnSend.disabled = true;
  btnSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gemini Thinking...';

  try {
    const res = await fetch(`${API_BASE}/student/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        studentName: currentUser ? currentUser.name : 'Student',
        userApiKey: userApiKey
      })
    });

    const data = await res.json();
    btnSend.disabled = false;
    btnSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Ask Gemini';

    if (data.success) {
      // Render Gemini AI Message Bubble
      const formattedReply = formatMarkdownSimple(data.reply);
      const isLiveBadge = data.isLiveGeminiApi 
        ? '<span style="font-size:10px; background:#dcfce7; color:#15803d; font-weight:800; padding:2px 6px; border-radius:4px; margin-left:6px;"><i class="fa-solid fa-bolt"></i> Live Google Gemini API</span>'
        : '';

      const aiBubbleHtml = `
        <div class="chat-msg ai-msg">
          <div class="msg-avatar" style="background:linear-gradient(135deg, #0284c7, #38bdf8);"><i class="fa-solid fa-sparkles"></i></div>
          <div class="msg-content">
            <div>${formattedReply}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span style="font-size:10px; color:var(--text-muted);">${data.timestamp}</span>
              ${isLiveBadge}
            </div>
          </div>
        </div>
      `;
      chatWindow.insertAdjacentHTML('beforeend', aiBubbleHtml);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    } else {
      alert('Gemini AI Chat error: ' + data.message);
    }
  } catch (err) {
    btnSend.disabled = false;
    btnSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Ask Gemini';
    alert('Failed to reach Gemini AI Tutor server.');
  }
}

function escapeHtmlText(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdownSimple(text) {
  let formatted = escapeHtmlText(text);
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background:#1e293b; color:#f8fafc; padding:12px; border-radius:8px; font-family:monospace; font-size:12px; margin:8px 0; overflow-x:auto;"><code>$2</code></pre>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}


/* ==================== MODAL HANDLERS & OVERLAY CLICK ==================== */

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function closeModalOnOverlayClick(event, modalId) {
  if (event.target.id === modalId) {
    closeModal(modalId);
  }
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
