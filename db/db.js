const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db');

// Create users table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      email TEXT UNIQUE,
      firstName TEXT,
      lastName TEXT,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME,
      loginAttempts INTEGER DEFAULT 0,
      lockedUntil DATETIME
    )
  `);

  // OTP codes table for admin-sensitive actions
  db.run(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      actionType TEXT NOT NULL, -- create_admin | update_admin | update_admin_password
      payload TEXT NOT NULL, -- JSON string of data needed to perform action
      expiresAt DATETIME NOT NULL,
      consumed INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure admin exists
  db.get(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`, async (err, row) => {
    if (err) {
      console.error('Error checking admin:', err);
      return;
    }

    if (!row) {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminEmail = process.env.ADMIN_EMAIL || 'yanmyoaung31916@gmail.com';
      const hash = await bcrypt.hash(adminPassword, 12);

      db.run(
        `INSERT INTO users (username, passwordHash, role, email, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)`,
        [adminUsername, hash, 'admin', adminEmail, 'System', 'Administrator'],
        (err) => {
          if (err) {
            console.error('Error inserting admin:', err);
          } else {
            console.log(`✅ Admin account created: ${adminUsername} / ${adminPassword}`);
          }
        }
      );
    }
  });
});

module.exports = db;
