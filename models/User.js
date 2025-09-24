const bcrypt = require('bcryptjs');
const db = require('../db/db');

const User = {
  async create(username, password) {
    const hash = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, passwordHash) VALUES (?, ?)`,
        [username, hash],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, username });
        }
      );
    });
  },

  async findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.passwordHash);
  }
};

module.exports = User;
