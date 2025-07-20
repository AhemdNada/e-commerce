# E-commerce Admin Panel

A modern e-commerce admin panel with dynamic category management and responsive frontend.

## Features

### Admin Panel
- **Categories Management**: Add, edit, and delete product categories
- **Products Management**: Add products with multiple sizes, colors, and images
- **Colors Management**: Manage product colors with hex codes
- **Real-time Updates**: Navbar automatically updates when categories are modified

### Frontend
- **Dynamic Navigation**: Collection dropdown automatically loads categories from database
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Category Filtering**: Filter products by category from URL parameters
- **Search & Filter**: Advanced product filtering and search functionality

## Project Structure

```
e-commerc-abdalla/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── categories.js
│   │   ├── colors.js
│   │   └── products.js
│   ├── uploads/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   │   └── index.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── navbar.js
│   │   └── index.js
│   ├── images/
│   ├── admin.html
│   ├── index.html
│   ├── categories.html
│   ├── about.html
│   └── contact.html
└── e-commerce.sql
```

## Database Schema

### Categories Table
- `id` (Primary Key)
- `name` (Unique)
- `created_at`
- `updated_at`

### Products Table
- `id` (Primary Key)
- `name`
- `description`
- `price`
- `discount_price`
- `gender` (Male/Female/Unisex)
- `category_id` (Foreign Key)
- `size_type` (numeric/string)
- `created_at`
- `updated_at`

### Colors Table
- `id` (Primary Key)
- `name` (Unique)
- `hex_code`
- `created_at`

## Setup Instructions

### 1. Database Setup
1. Create a MySQL database
2. Import the `e-commerce.sql` file
3. Update database connection in `backend/config/database.js`

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

The server will run on `http://localhost:7000`

### 3. Frontend Setup
The frontend is static HTML/CSS/JS. Simply open any HTML file in a browser or serve them using a local server.

## API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Colors
- `GET /api/colors` - Get all colors
- `POST /api/colors` - Create new color
- `DELETE /api/colors/:id` - Delete color

## Dynamic Navbar Feature

The navbar automatically updates when categories are added, edited, or deleted:

1. **Real-time Updates**: When admin adds/edits/deletes a category, the navbar updates immediately
2. **Automatic Polling**: Navbar refreshes every 30 seconds to catch external changes
3. **Focus Detection**: Updates when user returns to the browser tab
4. **Error Handling**: Gracefully handles server unavailability

### How it works:
- `navbar.js` loads categories from API on page load
- `admin.js` calls navbar update functions after category operations
- Categories are displayed in both desktop and mobile dropdown menus
- Links point to `categories.html?category=CategoryName`

## Usage

### Admin Panel
1. Navigate to `http://localhost:7000/admin`
2. Add categories, products, and colors
3. Upload product images
4. Manage inventory

### Frontend
1. Open any frontend page (index.html, categories.html, etc.)
2. Click on "Collection" in the navbar
3. Select a category to filter products
4. Use search and filter options

## Technologies Used

- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Database**: MySQL

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes. 