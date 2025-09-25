const bcrypt = require('bcryptjs');
const db = require('../db/db');

const User = {
  async create(userData) {
    const { username, password, role = 'user', email, firstName, lastName } = userData;
    const hash = await bcrypt.hash(password, 12);
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, passwordHash, role, email, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)`,
        [username, hash, role, email, firstName, lastName],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, username, role, email, firstName, lastName });
        }
      );
    });
  },

  async findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ? AND isActive = 1`, [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ? AND isActive = 1`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, username, role, email, firstName, lastName, isActive, createdAt, lastLogin FROM users WHERE isActive = 1 ORDER BY createdAt DESC`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  async update(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(id);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        values,
        function(err) {
          if (err) return reject(err);
          resolve({ id, changes: this.changes });
        }
      );
    });
  },

  async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [hash, id],
        function(err) {
          if (err) return reject(err);
          resolve({ id, changes: this.changes });
        }
      );
    });
  },

  async delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [id],
        function(err) {
          if (err) return reject(err);
          resolve({ id, changes: this.changes });
        }
      );
    });
  },

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.passwordHash);
  },

  async updateLoginAttempts(username, attempts, lockUntil = null) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET loginAttempts = ?, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE username = ?`,
        [attempts, lockUntil, username],
        function(err) {
          if (err) return reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  },

  async nowMyanmarSql(){
    const MS_OFFSET = (6 * 60 + 30) * 60 * 1000;
    const d = new Date(Date.now() + MS_OFFSET);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  },

  async updateLastLogin(username) {
    const now = await this.nowMyanmarSql();
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET lastLogin = ?, loginAttempts = 0, lockedUntil = NULL, updatedAt = ? WHERE username = ?`,
        [now, now, username],
        function(err) {
          if (err) return reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  },

  async isAccountLocked(user) {
    if (!user.lockedUntil) return false;
    return new Date() < new Date(user.lockedUntil);
  },

  async checkEmailExists(email, excludeId = null) {
    return new Promise((resolve, reject) => {
      let query = `SELECT id FROM users WHERE email = ? COLLATE NOCASE`;
      let params = [email.trim()];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(!!row); 
      });
    });
  },
  
  async checkUsernameExists(username, excludeId = null) {
    return new Promise((resolve, reject) => {
      let query = `SELECT id FROM users WHERE username = ? AND isActive = 1`;
      let params = [username];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }
};

module.exports = User;
