const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite');

// Create users table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `);

  // Ensure superadmin exists
  db.get(`SELECT * FROM users WHERE role = 'superadmin' LIMIT 1`, async (err, row) => {
    if (err) {
      console.error('Error checking superadmin:', err);
      return;
    }

    if (!row) {
      const superUsername = process.env.ADMIN_USERNAME || 'admin';
      const superPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hash = await bcrypt.hash(superPassword, 10);

      db.run(
        `INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)`,
        [superUsername, hash, 'superadmin'],
        (err) => {
          if (err) {
            console.error('Error inserting superadmin:', err);
          } else {
            console.log(`✅ Superadmin account created: ${superUsername} / ${superPassword}`);
          }
        }
      );
    }
  });
});

module.exports = db;
