-- Admin Management Migration Script
-- Run this script to add admin management to existing e-commerce database

USE ecommerce_admin;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
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

-- Insert default super admin (password: 'password')
INSERT INTO admins (name, email, password_hash, role) VALUES 
('Super Admin', 'admin@ausar.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin')
ON DUPLICATE KEY UPDATE name = name;

-- Verify the table was created
SELECT 'Admins table created successfully!' as status;
SELECT COUNT(*) as admin_count FROM admins; 