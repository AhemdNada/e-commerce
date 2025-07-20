# Dynamic Product Details Page

## Overview
The `viewdetails.html` page is now fully dynamic and displays product details fetched from the database. It automatically loads product information based on the product ID passed in the URL.

## How to Use

### URL Format
```
viewdetails.html?id=PRODUCT_ID
```

### Examples
- `viewdetails.html?id=1` - Shows details for product with ID 1
- `viewdetails.html?id=15` - Shows details for product with ID 15

## Features

### Dynamic Content Loading
- **Product Name**: Automatically displays the product name from the database
- **Product Description**: Shows the product description
- **Pricing**: Displays regular price and discount price (if available) with percentage off
- **Product Images**: Shows all available images for the product with thumbnail gallery
- **Color Selection**: Dynamic color buttons based on available colors for the product
- **Size Selection**: Dynamic size buttons based on available sizes and stock
- **Breadcrumb Navigation**: Shows category and product name in breadcrumb

### Interactive Features
- **Image Gallery**: Click thumbnails to change main image
- **Color Selection**: Click colors to see different product images
- **Size Selection**: Select available sizes with stock indicators
- **Quantity Control**: Increase/decrease quantity with +/- buttons
- **Add to Cart**: Add selected product to cart with size, color, and quantity
- **Stock Validation**: Prevents adding items when out of stock

### Responsive Design
- Works on mobile, tablet, and desktop
- Adaptive image gallery
- Responsive layout for all screen sizes

## Database Integration

### Required Database Tables
- `products` - Main product information
- `categories` - Product categories
- `product_sizes` - Available sizes and stock
- `colors` - Available colors
- `product_colors` - Product-color relationships
- `color_images` - Images for each color variant

### API Endpoints Used
- `GET /api/products/:id` - Fetch single product with all details

## Error Handling
- Shows loading states while fetching data
- Displays error messages if product not found
- Graceful fallbacks for missing images or data
- Network error handling

## Cart Integration
- Products added to localStorage cart
- Cart icon updates with item count
- Prevents duplicate items (updates quantity instead)

## Browser Compatibility
- Modern browsers with ES6+ support
- LocalStorage for cart functionality
- Fetch API for data loading

## Development Notes
- API Base URL: `http://localhost:7000/api`
- Images served from `/uploads/` directory
- All product data fetched dynamically from database
- No hardcoded product information 