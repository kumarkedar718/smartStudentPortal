const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../database/smart_student_portal.db');
const db = new sqlite3.Database(dbPath);

console.log('====================================================');
console.log('📊 SMART STUDENT PORTAL - DATABASE INSPECTION REPORT');
console.log('====================================================');
console.log('📁 Database File Location:', dbPath);
console.log('');

db.serialize(() => {
  const tables = ['users', 'teachers', 'students', 'courses', 'timetable', 'attendance', 'assignments', 'submissions', 'fees', 'marks', 'notes'];

  tables.forEach(tableName => {
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
      if (!err && row) {
        console.log(`📌 Table [${tableName.toUpperCase()}]: ${row.count} records stored`);
      }
    });
  });

  setTimeout(() => {
    console.log('\n--- Sample Student Record (STU101) ---');
    db.get(`SELECT u.name, s.roll_number, s.department, s.semester FROM users u JOIN students s ON u.id = s.user_id LIMIT 1`, (err, row) => {
      if (row) console.log('👤 Student:', row);
      console.log('====================================================');
      db.close();
    });
  }, 300);
});
