-- E-commerce Admin Panel Database Schema
DROP DATABASE IF EXISTS ecommerce_admin;

-- Create database
CREATE DATABASE IF NOT EXISTS ecommerce_admin;
USE ecommerce_admin;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2) DEFAULT NULL,
    gender ENUM('Men', 'Women', 'Unisex') NOT NULL,
    category_id INT NOT NULL,
    size_type ENUM('numeric', 'string') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Product sizes table
CREATE TABLE IF NOT EXISTS product_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size_value VARCHAR(50) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Colors table
CREATE TABLE IF NOT EXISTS colors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    hex_code VARCHAR(7) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product colors table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_colors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    color_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_color (product_id, color_id)
);


CREATE TABLE IF NOT EXISTS color_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    color_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE
);

-- Payment Methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT 0,
    phone_number VARCHAR(20) DEFAULT NULL,
    visa_card VARCHAR(30) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed payment methods
INSERT INTO payment_methods (method_name, enabled) VALUES
('vodafone_cash', 0),
('instapay', 0),
('cash_on_delivery', 1);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(30) NOT NULL,
    uploaded_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);


select*from categories;
select*from products;
select*from product_sizes;
select*from colors;
select*from color_images;
SELECT * FROM users;

INSERT INTO categories (name) VALUES
('T-Shirts'),
('Jeans'),
('Jackets'),
('Shoes'),
('Accessories');
INSERT INTO colors (name, hex_code) VALUES
('Red', '#FF0000'),
('Blue', '#0000FF'),
('Green', '#00FF00'),
('Black', '#000000'),
('White', '#FFFFFF'),
('Yellow', '#FFFF00'),
('Gray', '#808080'),
('Pink', '#FFC0CB');
INSERT INTO products (name, description, price, discount_price, gender, category_id, size_type) VALUES
('Classic Red T-Shirt', 'A classic red T-Shirt made of 100% cotton.', 19.99, NULL, 'Men', 1, 'string'),
('Women Blue Jeans', 'Skinny fit blue jeans for women.', 49.99, 39.99, 'Women', 2, 'numeric'),
('Unisex Black Jacket', 'Lightweight black jacket for all seasons.', 79.99, 69.99, 'Unisex', 3, 'string'),
('Men Running Shoes', 'Comfortable running shoes.', 59.99, NULL, 'Men', 4, 'numeric'),
('Leather Belt', 'Premium leather belt.', 25.99, NULL, 'Men', 5, 'string'),

('Graphic T-Shirt', 'Trendy printed T-Shirt.', 22.50, 17.50, 'Women', 1, 'string'),
('Ripped Jeans', 'Stylish ripped jeans.', 55.00, NULL, 'Men', 2, 'numeric'),
('Denim Jacket', 'Classic denim jacket.', 85.00, 75.00, 'Women', 3, 'string'),
('Sneakers', 'Casual sneakers.', 45.00, NULL, 'Unisex', 4, 'numeric'),
('Beanie Hat', 'Warm beanie hat.', 15.00, NULL, 'Unisex', 5, 'string'),

('Polo Shirt', 'Smart polo shirt.', 30.00, 25.00, 'Men', 1, 'string'),
('High Waist Jeans', 'High waist jeans.', 60.00, 50.00, 'Women', 2, 'numeric'),
('Leather Jacket', 'Genuine leather jacket.', 150.00, 120.00, 'Men', 3, 'string'),
('Running Sneakers', 'Professional running sneakers.', 95.00, 85.00, 'Unisex', 4, 'numeric'),
('Wrist Watch', 'Elegant wrist watch.', 120.00, NULL, 'Men', 5, 'string'),

('V-Neck T-Shirt', 'Soft v-neck T-Shirt.', 18.00, NULL, 'Women', 1, 'string'),
('Baggy Jeans', 'Comfort fit baggy jeans.', 58.00, 48.00, 'Men', 2, 'numeric'),
('Windbreaker', 'Windbreaker jacket.', 70.00, 60.00, 'Unisex', 3, 'string'),
('Basketball Shoes', 'High performance basketball shoes.', 110.00, 95.00, 'Men', 4, 'numeric'),
('Leather Wallet', 'Handcrafted leather wallet.', 35.00, NULL, 'Unisex', 5, 'string');
INSERT INTO product_colors (product_id, color_id) VALUES
(1, 1), (1, 4),
(2, 2),
(3, 4),
(4, 4), (4, 5),
(5, 4),

(6, 1), (6, 8),
(7, 2),
(8, 4),
(9, 5),
(10, 7),

(11, 3),
(12, 2),
(13, 4),
(14, 1),
(15, 7),

(16, 8),
(17, 2),
(18, 4),
(19, 1),
(20, 7);
INSERT INTO product_sizes (product_id, size_value, stock_quantity) VALUES
(1, 'M', 20),
(1, 'L', 15),
(2, '32', 10),
(2, '34', 8),
(3, 'S', 12),
(3, 'M', 7),
(4, '42', 14),
(4, '43', 10),
(5, 'One Size', 25),

(6, 'S', 18),
(7, '30', 5),
(8, 'M', 10),
(9, '40', 12),
(10, 'One Size', 30),

(11, 'M', 20),
(12, '36', 6),
(13, 'L', 8),
(14, '41', 15),
(15, 'One Size', 22),

(16, 'S', 10),
(17, '34', 7),
(18, 'M', 5),
(19, '42', 9),
(20, 'One Size', 12);





INSERT INTO products (name, description, price, discount_price, gender, category_id, size_type) VALUES
('Leather Wallet', 'Compact leather wallet for cards and cash.', 35.00, NULL, 'Men', 5, 'string'),
('Silk Scarf', 'Elegant silk scarf for women.', 25.00, 20.00, 'Women', 5, 'string'),
('Unisex Sunglasses', 'Polarized unisex sunglasses.', 50.00, 40.00, 'Unisex', 5, 'string'),
('Cap', 'Adjustable baseball cap.', 15.00, NULL, 'Men', 5, 'string'),
('Ladies Handbag', 'Stylish handbag for everyday use.', 80.00, 70.00, 'Women', 5, 'string'),

('Unisex Backpack', 'Durable unisex backpack.', 60.00, 50.00, 'Unisex', 5, 'string'),
('Tie', 'Formal tie for men.', 18.00, NULL, 'Men', 5, 'string'),
('Beanie', 'Warm knitted beanie.', 12.00, NULL, 'Unisex', 5, 'string'),
('Leather Gloves', 'Genuine leather gloves.', 30.00, 25.00, 'Men', 5, 'string'),
('Wool Hat', 'Cozy wool hat for women.', 22.00, NULL, 'Women', 5, 'string'),

('Laptop Sleeve', 'Protective laptop sleeve.', 28.00, NULL, 'Unisex', 5, 'string'),
('Keychain', 'Metal keychain with logo.', 8.00, NULL, 'Unisex', 5, 'string'),
('Watch Strap', 'Replacement watch strap.', 15.00, NULL, 'Men', 5, 'string'),
('Makeup Bag', 'Compact makeup bag.', 20.00, NULL, 'Women', 5, 'string'),
('Travel Pillow', 'Comfortable travel pillow.', 25.00, 20.00, 'Unisex', 5, 'string'),

('Bracelet', 'Fashion bracelet.', 12.00, NULL, 'Women', 5, 'string'),
('Unisex Socks', 'Pack of unisex socks.', 10.00, NULL, 'Unisex', 5, 'string'),
('Wallet Chain', 'Metal wallet chain.', 14.00, NULL, 'Men', 5, 'string'),
('Ear Warmer', 'Soft ear warmer headband.', 10.00, NULL, 'Women', 5, 'string'),
('Reusable Bag', 'Eco-friendly reusable shopping bag.', 5.00, NULL, 'Unisex', 5, 'string');



INSERT INTO product_colors (product_id, color_id) VALUES
(21, 4),  -- Leather Wallet: Black
(22, 8),  -- Silk Scarf: Pink
(23, 4),  -- Sunglasses: Black
(24, 7),  -- Cap: Gray
(25, 8),  -- Handbag: Pink
(26, 4),  -- Backpack: Black
(27, 7),  -- Tie: Gray
(28, 7),  -- Beanie: Gray
(29, 4),  -- Leather Gloves: Black
(30, 7),  -- Wool Hat: Gray
(31, 4),  -- Laptop Sleeve: Black
(32, 7),  -- Keychain: Gray
(33, 4),  -- Watch Strap: Black
(34, 8),  -- Makeup Bag: Pink
(35, 7),  -- Travel Pillow: Gray
(36, 8),  -- Bracelet: Pink
(37, 7),  -- Socks: Gray
(38, 4),  -- Wallet Chain: Black
(39, 8),  -- Ear Warmer: Pink
(40, 7);  -- Reusable Bag: Gray



INSERT INTO product_sizes (product_id, size_value, stock_quantity) VALUES
(21, 'One Size', 25),
(22, 'One Size', 15),
(23, 'One Size', 20),
(24, 'One Size', 30),
(25, 'One Size', 10),
(26, 'One Size', 12),
(27, 'One Size', 18),
(28, 'One Size', 22),
(29, 'One Size', 8),
(30, 'One Size', 14),
(31, '13 inch', 20),
(32, 'One Size', 50),
(33, '22mm', 15),
(34, 'One Size', 17),
(35, 'One Size', 25),
(36, 'One Size', 20),
(37, 'One Size', 60),
(38, 'One Size', 10),
(39, 'One Size', 13),
(40, 'One Size', 40);

















