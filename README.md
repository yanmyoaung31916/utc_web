# UTC Admin Panel

A comprehensive admin panel for managing UTC IT Solution website content with a beautiful, modern interface.

## Features

### 🔐 **Authentication**

- JWT-based secure authentication
- Protected admin routes
- Session management with localStorage

### 📊 **Dashboard**

- Overview statistics (courses, services, media files)
- Quick action buttons
- Real-time data updates

### 🎓 **Course Management**

- Create, edit, and delete courses
- Course outlines management
- Image upload and management
- Course level categorization

### ⚙️ **Service Management**

- Full CRUD operations for services
- Multiple image support per service
- Service descriptions and outlines
- Professional service presentation

### 📞 **Contact Management**

- Update company information
- Manage phone numbers and addresses
- Social media links management
- Real-time contact info updates

### 🖼️ **Media Library**

- Upload multiple images
- Image preview and management
- Copy image URLs to clipboard
- File deletion with confirmation

### 🎨 **Beautiful UI**

- Modern Tailwind CSS design
- Responsive mobile-first layout
- Dark/light mode support
- Smooth animations and transitions
- Toast notifications
- Modal dialogs

## Technology Stack

### Backend

- **Node.js** with Express.js
- **JWT** for authentication
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet** for security
- **CORS** for cross-origin requests
- **Rate Limiting** for API protection

### Frontend

- **Vanilla JavaScript** (ES6+)
- **Tailwind CSS** for styling
- **Font Awesome** for icons
- **Fetch API** for HTTP requests
- **LocalStorage** for token management

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Admin Credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
FROM_EMAIL=
FROM_NAME=Universal Technology
SMTP_USER=
SMTP_PASS=
FROM_NAME=UTC Website

```

### 3. Start the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

### 4. Access the Application

- **Main Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health Check**: http://localhost:3000/api/health

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production!

## API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

### Courses Management

- `GET /api/admin/courses` - Get all courses
- `GET /api/admin/courses/:id` - Get single course
- `POST /api/admin/courses` - Create new course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course

### Services Management

- `GET /api/admin/services` - Get all services
- `GET /api/admin/services/:id` - Get single service
- `POST /api/admin/services` - Create new service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

### Contact Management

- `GET /api/admin/contact` - Get contact info
- `PUT /api/admin/contact` - Update contact info

### File Upload

- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/upload/files` - List all files
- `DELETE /api/upload/:filename` - Delete file

## File Structure

```
UTC/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── env.example               # Environment variables template
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── admin.js             # Admin CRUD operations
│   └── upload.js            # File upload handling
├── public/
│   ├── admin.html           # Admin panel interface
│   └── admin.js             # Admin panel JavaScript
├── uploads/                 # Uploaded files directory
├── index.html               # Main website
├── courses.json             # Courses data
├── services.json            # Services data
└── contact.json             # Contact information
```

## Usage Guide

### 1. Login to Admin Panel

- Navigate to `/admin`
- Use your admin credentials
- Access the dashboard

### 2. Manage Courses

- Click "Courses" in the sidebar
- Add new courses with titles, levels, and outlines
- Upload course images
- Edit or delete existing courses

### 3. Manage Services

- Click "Services" in the sidebar
- Add services with descriptions and multiple images
- Include service outlines
- Update or remove services

### 4. Update Contact Information

- Click "Contact Info" in the sidebar
- Update company details, phone numbers, and social media links
- Changes reflect immediately on the main website

### 5. Media Management

- Click "Media Library" in the sidebar
- Upload multiple images at once
- Copy image URLs for use in courses/services
- Delete unused files

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side validation for all inputs
- **File Type Validation**: Only image files allowed
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: Security headers and protection

## Development

### Adding New Features

1. **Backend**: Add routes in `/routes/` directory
2. **Frontend**: Extend the `AdminPanel` class in `admin.js`
3. **UI**: Add new sections in `admin.html`

### API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "error": "Error message",
  "details": { ... }
}
```

## Deployment

### Production Checklist

1. ✅ Change default admin credentials
2. ✅ Set strong JWT secret
3. ✅ Configure proper CORS origins
4. ✅ Set NODE_ENV=production
5. ✅ Configure file upload limits
6. ✅ Set up proper logging
7. ✅ Configure reverse proxy (nginx)
8. ✅ Set up SSL certificates
9. ✅ Configure backup strategy

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-secure-jwt-secret-key
ADMIN_USERNAME=your-secure-username
ADMIN_PASSWORD=your-secure-password
```

## Troubleshooting

### Common Issues

1. **Login fails**: Check admin credentials in `.env`
2. **File upload fails**: Check file size limits and upload directory permissions
3. **API calls fail**: Verify JWT token and server status
4. **Images not loading**: Check upload directory and file permissions

### Logs

Check server logs for detailed error information:

```bash
npm run dev  # Development with detailed logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:

- Email: info@utcitsolution.com
- Website: http://localhost:3000

---

**UTC IT Solution** - Empowering technology education and services in Mandalay, Myanmar.
