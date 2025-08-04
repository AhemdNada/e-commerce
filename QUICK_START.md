# Quick Start Guide - Admin Management System

## 🚀 Get Started in 5 Minutes

### 1. Database Setup
```bash
# Option A: Fresh installation
mysql -u root -p < e-commerce.sql

# Option B: Add to existing database
mysql -u root -p < admin_migration.sql
```

### 2. Start the Server
```bash
cd backend
npm install
npm start
```

### 3. Access the System
- **Frontend**: http://localhost:7000
- **Admin Panel**: http://localhost:7000/admin.html
- **Login Page**: http://localhost:7000/login.html

### 4. Default Admin Login
- **Email**: admin@ausar.com
- **Password**: password
- **Role**: Super Administrator

## 🔐 First Time Setup

### 1. Login as Super Admin
1. Go to http://localhost:7000/login.html
2. Enter admin credentials (system will automatically detect admin login)
3. You'll be redirected to admin panel

### 2. Change Default Password
1. Click "My Profile" in sidebar
2. Enter current password: `password`
3. Enter new password
4. Save changes

### 3. Create Additional Admins
1. Click "Admin Management" in sidebar
2. Click "Add Admin" button
3. Fill in admin details
4. Choose role (Admin or Super Admin)

## 📋 Key Features

### Super Admin Capabilities
- ✅ Create/Delete/Manage all admins
- ✅ Access all system features
- ✅ Manage own profile
- ✅ View admin activity

### Regular Admin Capabilities
- ✅ Access all system features
- ✅ Manage own profile
- ❌ Cannot manage other admins

### Security Features
- 🔒 JWT token authentication
- 🔒 Password hashing (bcrypt)
- 🔒 Role-based access control
- 🔒 Automatic session validation

## 🛠️ Troubleshooting

### Login Issues
```bash
# Check if server is running
curl http://localhost:7000/api/admins/me

# Check database connection
mysql -u root -p -e "USE ecommerce_admin; SELECT * FROM admins;"
```

### Permission Issues
- Ensure you're logged in as Super Admin for admin management
- Check browser console for error messages
- Verify API endpoints are accessible

### File Upload Issues
```bash
# Check upload directory permissions
ls -la backend/uploads/
chmod 755 backend/uploads/
```

## 📁 Important Files

```
backend/routes/admins.js          # Admin API endpoints
backend/middleware/auth.js        # Authentication middleware
frontend/js/admin.js              # Admin panel functionality
frontend/js/login.js              # Login functionality
frontend/admin.html               # Admin dashboard
```

## 🔧 Configuration

### Environment Variables (config.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_admin
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
```

### API Base URL
The system automatically configures API endpoints. If you need to change:
```bash
node build-config.js development  # or production/staging
```

## 🎯 Next Steps

1. **Secure Your Installation**
   - Change default admin password
   - Update JWT secret
   - Configure HTTPS for production

2. **Create Admin Accounts**
   - Add team members as admins
   - Assign appropriate roles
   - Set up profile photos

3. **Customize the System**
   - Modify admin permissions
   - Add custom admin fields
   - Integrate with existing systems

## 📞 Support

- Check browser console for errors
- Review API response messages
- Verify database connectivity
- Check file permissions

---

**Ready to go!** 🎉 Your admin management system is now fully functional. 