# UTC Website & Admin Panel

Content management system for the Universal Technology (UTC) website. It serves the public marketing site and provides an authenticated admin panel for managing courses, services, contact information, media files, and user accounts.

- Public site: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`
- Health check: `http://localhost:3000/api/health`

## Features

**Public website**

- Responsive single-page site with dark/light mode
- Course catalog and service showcase, loaded from the API with JSON fallback
- Contact section populated from managed contact data
- Visit analytics tracking

**Admin panel**

- Dashboard with content statistics and traffic charts
- Course management: create, edit, delete, outline and image management
- Service management: full CRUD with multi-image support
- Contact management: company details, phone numbers, social links
- Media library: image upload, URL copying, deletion with confirmation
- User management with role-based access (admin/user)

**Authentication and security**

- JWT authentication with expiring tokens
- Account lockout after repeated failed login attempts
- Email OTP verification for admin account changes
- Per-endpoint rate limiting
- Server-side input validation and script-tag sanitization
- Image-only uploads with configurable size limits

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Backend  | Node.js, Express 4                                      |
| Database | SQLite (`sqlite3`), plus JSON files in `data/`          |
| Auth     | `jsonwebtoken`, `bcryptjs`, `express-rate-limit`        |
| Uploads  | `multer`                                                |
| Mail     | `nodemailer` (SMTP, OTP delivery)                       |
| Frontend | Vanilla JavaScript (ES modules), Tailwind CSS 4         |
| Charts   | Chart.js (admin dashboard, CDN)                         |

Content data (courses, services, contact, analytics) is stored as JSON files in `data/` and read/written directly by the API. User accounts and OTP codes live in SQLite (`database.db`, created automatically on first boot).

## Prerequisites

- Node.js 18 or later
- npm
- An SMTP account (required only for admin OTP verification emails)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the environment:

   ```bash
   cp .env.example .env
   ```

   On Windows, copy `.env.example` to `.env` manually. See [Configuration](#configuration) for the full variable list.

3. Build the stylesheet (optional — a compiled `output.css` is already committed):

   ```bash
   npm run build
   ```

4. Start the server:

   ```bash
   npm run dev    # development (auto-reload via nodemon)
   npm start      # production
   ```

5. Open `http://localhost:3000` for the site or `http://localhost:3000/admin` for the admin panel. Default credentials are `admin` / `admin123` (change them in production).

## Configuration

| Variable         | Required | Default         | Description                                              |
| ---------------- | -------- | --------------- | -------------------------------------------------------- |
| `PORT`           | No       | `3000`          | HTTP port                                                |
| `NODE_ENV`       | No       | `development`   | `development` or `production` (affects CORS policy)      |
| `JWT_SECRET`     | Yes      | —               | Signing key for tokens (also salts analytics hashing)    |
| `JWT_EXPIRES_IN` | No       | `24h`           | Token lifetime                                           |
| `ADMIN_USERNAME` | No       | `admin`         | Seed admin username (used only when no admin exists)     |
| `ADMIN_PASSWORD` | No       | `admin123`      | Seed admin password                                      |
| `ADMIN_EMAIL`    | No       | —               | Receives admin OTP codes; falls back to a default address |
| `MAX_FILE_SIZE`  | No       | `5242880`       | Upload limit in bytes (5 MB)                             |
| `UPLOAD_PATH`    | No       | `./uploads`     | Upload directory (created automatically)                 |
| `SMTP_HOST`      | For OTP  | `smtp.gmail.com`| SMTP host                                                |
| `SMTP_PORT`      | For OTP  | `465`           | SMTP port                                                |
| `SMTP_SECURE`    | For OTP  | `true`          | Use TLS                                                  |
| `SMTP_USER`      | For OTP  | —               | SMTP username                                            |
| `SMTP_PASS`      | For OTP  | —               | SMTP password (app password for Gmail)                   |
| `FROM_EMAIL`     | For OTP  | —               | Sender address                                           |
| `FROM_NAME`      | No       | —               | Sender display name                                      |

## API Reference

All admin routes except the public `GET` endpoints on `/api/admin` require an `Authorization: Bearer <token>` header.

**Auth**

| Method | Endpoint            | Auth | Description              |
| ------ | ------------------- | ---- | ------------------------ |
| POST   | `/api/auth/login`   | No   | Log in, returns JWT      |
| GET    | `/api/auth/verify`  | Yes  | Validate current token   |
| POST   | `/api/auth/logout`  | No   | Stateless logout         |

**Courses / services / contact** (`/api/admin`)

Standard CRUD: `GET /<resource>`, `GET /<resource>/:id`, `POST /<resource>`, `PUT /<resource>/:id`, `DELETE /<resource>/:id`, plus `GET /contact` and `PUT /contact`. `GET` requests are public; writes require admin authentication. Note that course IDs are strings and service IDs are numbers.

**Uploads** (`/api/upload`, all authenticated)

| Method | Endpoint                   | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| POST   | `/api/upload/single`       | Upload one image (form field `image`)    |
| POST   | `/api/upload/multiple`     | Upload up to 5 images (field `images`)   |
| GET    | `/api/upload/files`        | List uploaded files                      |
| DELETE | `/api/upload/:filename`    | Delete a file                            |

**Users** (`/api/users`, admin role required)

CRUD on `/api/users` and `/api/users/:id`, password change via `PUT /api/users/:id/password`, self-service profile at `/api/users/profile/me`. Creating or modifying an admin account (or an admin password) is a two-step flow: the request returns HTTP 202 with an `otpId`, a 6-digit code is emailed to `ADMIN_EMAIL`, and the operation completes via `POST /api/users/verify/:action` with `{ otpId, code }`. User deletion is a soft delete (`isActive = 0`); users cannot delete their own account.

**Analytics**

| Method | Endpoint              | Auth  | Description                    |
| ------ | --------------------- | ----- | ------------------------------ |
| POST   | `/api/analytics/visit`| No    | Record a page visit            |
| GET    | `/api/analytics`      | Yes   | Totals, today, last 7 days     |

Error responses use the shape `{ "error": "..." }` (validation errors: `{ "errors": [...] }`).

## Project Structure

```
UTC/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── database.db               # SQLite database (auto-created)
├── db/
│   └── db.js                # SQLite schema + admin seed
├── models/
│   └── user.js              # User data-access methods
├── services/
│   ├── email.js             # SMTP mailer (OTP mails)
│   └── otp.js               # OTP create/verify/consume
├── middleware/
│   └── auth.js              # JWT auth, roles, rate limits
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── admin.js             # Courses/services/contact CRUD
│   ├── upload.js            # File upload handling
│   └── users.js             # User management + OTP verify
├── src/
│   └── input.css            # Tailwind source
├── public/
│   ├── admin.html           # Admin panel interface
│   ├── index.html           # Main website
│   ├── css/                 # output.css + page styles
│   ├── js/admin/            # Admin panel ES modules
│   ├── js/site/             # Public site ES modules
│   └── images/              # logo.png, founder.jpg
├── data/                    # courses/services/contact/analytics JSON
└── uploads/                 # Uploaded files directory
```

## Development

- Backend: add routes under `routes/` and wire them in `server.js`.
- Admin frontend: feature logic lives in `public/js/admin/`; `admin.js` holds the `AdminPanel` orchestrator. List rendering uses `templates.js` with `data-action` delegation.
- Public site: feature modules live in `public/js/site/` and are composed in `main.js`.
- Styles: edit `src/input.css` (Tailwind 4) and rebuild with `npm run build` (`npm run build:css:min` for minified production output).

## Testing

Run the API test suite with:

```bash
npm test
```

This runs 36 tests in about 5 seconds using Node's built-in test runner — no extra test dependencies. What is covered:

| Area      | Covered                                                        |
| --------- | -------------------------------------------------------------- |
| Auth      | Health check, login success/failure, token verify, logout      |
| Courses   | Public listing, validation, full create/read/update/delete     |
| Services  | Public listing, validation, full create/read/update/delete     |
| Contact   | Public read, auth enforcement, update persistence              |
| Uploads   | Auth enforcement, image-type rejection, upload/list/delete     |
| Users     | Create, duplicate rejection, password rules, OTP admin flow, wrong-code rejection, self-delete protection, delete |
| Analytics | Visit recording, auth enforcement, totals                      |

How the harness keeps your data safe:

- The suite boots the real server on port **3101** against a **throwaway database** (fresh admin seed), never your live one.
- Outgoing mail is stubbed in-memory, so the OTP flows are tested end-to-end **without SMTP**.
- Your live `database.db` and `data/*.json` are backed up before the run and restored afterwards (leftover backups from a crashed run are recovered automatically on the next run). Uploads created by tests are removed.
- The runner performs only one login per run to stay under the login rate limiter.

Run a subset while developing:

```bash
npm test -- users     # only suites matching "users"
```

Requires Node 22 or later (uses `--test-force-exit` so the process terminates after the run).

## Deployment Checklist

1. Change the default admin credentials (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).
2. Set a strong `JWT_SECRET` and review `JWT_EXPIRES_IN`.
3. Set `NODE_ENV=production` so the production CORS allowlist applies.
4. Configure a real SMTP sender and `ADMIN_EMAIL`.
5. Review `MAX_FILE_SIZE` and ensure the `uploads/` directory is persistent and backed up.
6. Build minified CSS (`npm run build:css:min`).
7. Terminate TLS and proxy via a reverse proxy (e.g. nginx); keep Node bound to localhost.
8. Back up `database.db`, `data/`, and `uploads/` on a schedule.

## Troubleshooting

| Symptom             | Likely cause and fix                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| Login fails         | Wrong credentials in `.env`; after 5 failures the account locks for 30 minutes   |
| Login rate-limited  | `/api/auth/login` allows 5 attempts per 15 minutes per IP                         |
| Upload fails        | File exceeds `MAX_FILE_SIZE`, is not an image, or `uploads/` is not writable     |
| OTP never arrives   | Missing or incorrect SMTP settings; check server logs for mailer errors          |
| Images not loading  | Missing files in `uploads/` or wrong `UPLOAD_PATH`                                |
| API returns 401/403 | Missing, expired, or insufficient-role JWT; re-login to obtain a fresh token      |

Run with `npm run dev` to see detailed server logs while diagnosing.

## Support

- Email: info@utcitsolution.com
- Website: http://localhost:3000 (development)

## License

Proprietary — owned by UTC IT Solution. All rights reserved. See `LICENSE` for details. This software is not free to use or distribute without prior written permission.

---

Universal Technology IT Solution — technology education and services, Mandalay, Myanmar.
