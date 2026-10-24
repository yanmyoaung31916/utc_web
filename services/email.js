const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || 'smtp.gmail.com',
	port: parseInt(process.env.SMTP_PORT || '465', 10),
	secure: String(process.env.SMTP_SECURE || 'true') === 'true',
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

async function sendMail({ to, subject, html }) {
	const fromEmail = process.env.FROM_EMAIL || 'ymyo44277@gmail.com';
	const fromName = process.env.FROM_NAME || 'Universal Technology';
	await transporter.sendMail({
		from: `${fromName} <${fromEmail}>`,
		to,
		subject,
		html,
	});
}

function otpEmailTemplate(code) {
	return `
		<div style="font-family: Arial, Helvetica, sans-serif; background-color: #f5f7fa; padding: 32px; max-width: 520px; margin: auto; border-radius: 8px; border: 1px solid #e0e6ed; color: #111;">
			<h2 style="font-size: 20px; font-weight: 600; color: #111827; text-align: center; margin-bottom: 20px;">
				Universal Technology Admin Verification Code
			</h2>
			<p style="font-size: 15px; color: #374151; text-align: center; margin-bottom: 24px;">
				Please use the code below to complete your verification process:
			</p>
			<div style="background-color: #ffffff; border: 1px solid #d1d5db; font-size: 24px; letter-spacing: 6px; font-weight: bold; padding: 16px; text-align: center; border-radius: 6px; color: #111827; margin-bottom: 24px;">
				${code}
			</div>
			<p style="font-size: 14px; color: #4b5563; text-align: center; margin-bottom: 8px;">
				This code will expire in <strong>10 minutes</strong>.
			</p>
			<p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 16px;">
				If you did not request this code, you can safely ignore this email.
			</p>		
		</div>

	`;
}

module.exports = { sendMail, otpEmailTemplate };


