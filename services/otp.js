const db = require('../db/db');

function generateOtpCode() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

function getExpiryDate(minutes = 10) {
	return new Date(Date.now() + minutes * 60 * 1000)
		.toISOString()
		.replace('T', ' ')
		.slice(0, 19);
}

async function createOtp({ email, actionType, payload }) {
	const code = generateOtpCode();
	const expiresAt = getExpiryDate(10);
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO otp_codes (email, code, actionType, payload, expiresAt) VALUES (?, ?, ?, ?, ?)`,
			[email, code, actionType, JSON.stringify(payload), expiresAt],
			function (err) {
				if (err) return reject(err);
				resolve({ id: this.lastID, code, email, actionType, expiresAt });
			}
		);
	});
}

async function findValidOtp(id, code) {
	return new Promise((resolve, reject) => {
		db.get(
			`SELECT * FROM otp_codes WHERE id = ? AND code = ? AND consumed = 0 AND expiresAt > datetime('now')`,
			[id, code],
			(err, row) => {
				if (err) return reject(err);
				resolve(row);
			}
		);
	});
}

async function consumeOtp(id) {
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE otp_codes SET consumed = 1 WHERE id = ?`,
			[id],
			function (err) {
				if (err) return reject(err);
				resolve(this.changes > 0);
			}
		);
	});
}

module.exports = { createOtp, findValidOtp, consumeOtp };


