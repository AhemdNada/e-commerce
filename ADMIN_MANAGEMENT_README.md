# Advanced Admin Management & Access Control System

## Overview

This system provides comprehensive admin management with role-based access control, secure authentication, and profile management capabilities.

## Features

### 🔐 Authentication & Access Control
- **Smart Login System**: Single login form that automatically detects admin or user accounts
- **JWT Token Authentication**: Secure token-based authentication
- **Role-Based Access**: Super Admin and Admin roles with different permissions
- **Automatic Redirects**: Unauthorized access redirects to login page
- **Session Management**: Secure token storage and validation

### 👥 Admin Management (Super Admin Only)
- **Create New Admins**: Add admins with name, email, password, and role
- **Admin List View**: View all admins with status, role, and last login
- **Activate/Deactivate**: Toggle admin account status
- **Delete Admins**: Remove admin accounts (with safety checks)
- **Role Management**: Assign Super Admin or Admin roles

### 👤 Profile Management
- **Personal Information**: Update name and email
- **Password Change**: Secure password updates with current password verification
- **Profile Photo**: Upload and manage profile pictures
- **Real-time Updates**: Changes reflect immediately in UI

### 🛡️ Security Features
- **Password Hashing**: Bcrypt encryption for all passwords
- **Input Validation**: Comprehensive form validation
- **CSRF Protection**: Token-based request validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

## Database Schema

### Admins Table
```sql
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255) DEFAULT NULL,
    role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/admins/login` - Admin login
- `GET /api/admins/me` - Get current admin profile
- `POST /api/admins/logout` - Admin logout

### Admin Management (Super Admin Only)
- `GET /api/admins` - Get all admins
- `POST /api/admins` - Create new admin
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin

### Profile Management
- `PUT /api/admins/profile` - Update own profile

## Default Admin Account

The system comes with a default Super Admin account:

- **Email**: admin@ausar.com
- **Password**: password
- **Role**: Super Administrator

⚠️ **Important**: Change the default password immediately after first login!

## Installation & Setup

### 1. Database Setup
```bash
# Import the updated database schema
mysql -u root -p < e-commerce.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup
```bash
# Generate config file
node build-config.js development

# Serve frontend files
# The backend already serves static files from frontend directory
```

### 4. Environment Configuration
Update `config.env` with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Usage Guide

### Admin Login
1. Navigate to `http://localhost:7000/login.html`
2. Enter admin credentials (system automatically detects admin accounts)
3. Upon successful login, you'll be redirected to `admin.html`

### Managing Admins (Super Admin Only)
1. Login as Super Admin
2. Navigate to "Admin Management" in sidebar
3. Use "Add Admin" button to create new admin accounts
4. Use action buttons to activate/deactivate or delete admins

### Profile Management
1. Login as any admin
2. Navigate to "My Profile" in sidebar
3. Update personal information, password, or profile photo
4. Changes are saved immediately

### Access Control
- **Super Admin**: Full access to all features including admin management
- **Admin**: Access to all features except admin management
- **Unauthorized**: Automatic redirect to login page

## Security Considerations

### Password Requirements
- Minimum 6 characters (configurable)
- Bcrypt hashing with configurable rounds
- Current password verification for changes

### Token Security
- JWT tokens with configurable expiration
- Secure storage in localStorage
- Automatic token validation on each request

### Database Security
- Parameterized queries prevent SQL injection
- Unique email constraints
- Foreign key constraints for data integrity

## File Structure

```
backend/
├── routes/
│   └── admins.js          # Admin management routes
├── middleware/
│   └── auth.js            # Updated authentication middleware
└── uploads/               # Profile photos storage

frontend/
├── admin.html             # Updated admin dashboard
├── login.html             # Updated login page
├── js/
│   ├── admin.js           # Updated admin functionality
│   ├── login.js           # Updated login functionality
│   └── config.js          # API configuration
└── css/
    └── login.css          # Updated login styles
```

## Error Handling

The system includes comprehensive error handling:

- **Authentication Errors**: Clear messages for invalid credentials
- **Permission Errors**: Access denied messages for unauthorized actions
- **Validation Errors**: Form validation with specific error messages
- **Network Errors**: Graceful handling of API connection issues

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Check database connection
   - Verify admin account exists and is active
   - Check JWT secret configuration

2. **Admin Management Not Visible**
   - Ensure you're logged in as Super Admin
   - Check browser console for errors
   - Verify API endpoints are accessible

3. **Profile Updates Fail**
   - Check file upload permissions
   - Verify current password is correct
   - Check database connection

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in `config.env`

## API Response Format

All API responses follow this format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}, // Optional data payload
  "error": "Error details" // Only on failure
}
```

## Future Enhancements

- [ ] Two-factor authentication
- [ ] Password reset functionality
- [ ] Admin activity logging
- [ ] Bulk admin operations
- [ ] Advanced role permissions
- [ ] API rate limiting

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database connectivity
3. Review API response messages
4. Check file permissions for uploads

---

**Note**: This system is designed for production use but should be properly configured with secure credentials and HTTPS in production environments. 