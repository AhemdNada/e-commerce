# Deployment Guide

This guide explains how to deploy the e-commerce application with proper environment configuration.

## Environment Variables

The application uses environment variables for configuration. All sensitive values have been moved to the `config.env` file.

### Backend Environment Variables

The backend uses the following environment variables:

```env
# Server Configuration
PORT=7000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce_admin
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h

# API Configuration
API_BASE_URL=http://localhost:7000/api
FRONTEND_URL=http://localhost:7000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:7000

# Security Configuration
BCRYPT_ROUNDS=10
```

### Frontend Configuration

The frontend configuration is automatically generated from environment variables using the build script.

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Configure environment:**
   - Copy `config.env.example` to `config.env`
   - Update the values in `config.env` for your development environment

3. **Build frontend configuration:**
   ```bash
   npm run build:dev
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## Production Deployment

### 1. Environment Configuration

Create a production `config.env` file with appropriate values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=your-production-db-name
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-very-long-and-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# API Configuration
API_BASE_URL=https://api.yourapp.com/api
FRONTEND_URL=https://yourapp.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=https://yourapp.com

# Security Configuration
BCRYPT_ROUNDS=12
```

### 2. Build Frontend Configuration

```bash
npm run build:prod
```

This will generate the frontend `config.js` file with production URLs.

### 3. Database Setup

1. Create the production database
2. Import the database schema from `e-commerce.sql`
3. Ensure the database user has proper permissions

### 4. File Uploads

Ensure the `uploads` directory exists and has proper write permissions:

```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

### 5. Security Considerations

- **JWT Secret**: Use a strong, randomly generated secret
- **Database Password**: Use a strong password
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configure CORS to only allow your domain
- **File Uploads**: Consider using a CDN for file storage in production

## Deployment Options

### Option 1: Traditional Server

1. Upload files to your server
2. Install Node.js and MySQL
3. Configure environment variables
4. Run the build script
5. Start the application with PM2 or similar process manager

### Option 2: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:prod

EXPOSE 3000

CMD ["npm", "start"]
```

### Option 3: Cloud Platforms

#### Heroku
1. Set environment variables in Heroku dashboard
2. Deploy using Git
3. Configure buildpacks for Node.js

#### Vercel/Netlify
1. Configure environment variables
2. Deploy frontend and backend separately
3. Update CORS settings

## Environment-Specific Configurations

### Development
```bash
npm run build:dev
```

### Staging
```bash
npm run build:staging
```

### Production
```bash
npm run build:prod
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `CORS_ORIGIN` matches your frontend URL
2. **Database Connection**: Verify database credentials and network access
3. **File Uploads**: Check directory permissions and `MAX_FILE_SIZE` setting
4. **JWT Issues**: Ensure `JWT_SECRET` is set and consistent

### Logs

Check application logs for errors:
```bash
# If using PM2
pm2 logs

# If using Docker
docker logs <container-name>

# Direct Node.js
node server.js
```

## Security Checklist

- [ ] JWT secret is strong and unique
- [ ] Database password is secure
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] File upload limits are set
- [ ] Environment variables are not committed to Git
- [ ] Database user has minimal required permissions
- [ ] Regular security updates are applied 