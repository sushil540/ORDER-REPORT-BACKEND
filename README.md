# Sales Management System Backend

A robust backend system for managing sales operations, customer relationships, and generating reports. This Node.js application provides a RESTful API for handling sales personnel, customers, orders, and report generation.

## Features

- **Authentication System**: Secure user authentication and authorization
- **Sales Personnel Management**: CRUD operations for sales team members
- **Customer Management**: Comprehensive customer data handling
- **Order Management**: Track and manage sales orders
- **Report Generation**: Generate detailed reports using PDFKit
- **RESTful API**: Well-structured endpoints for all operations

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **PDF Generation**: PDFKit
- **Security**: bcryptjs for password hashing
- **Validation**: Validator package for data validation
- **Development**: Nodemon for auto-reloading

## Project Structure

```
backend/
├── configureDB/     # Database configuration
├── controllers/     # Business logic
├── helpers/         # Utility functions
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
└── server.js        # Application entry point
```

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/salespersons` - Sales personnel management
- `/api/customers` - Customer management
- `/api/orders` - Order management
- `/api/report` - Report generation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation

## Development

The project uses nodemon for development, which automatically restarts the server when changes are detected.

## Security

- Password hashing using bcryptjs
- JWT-based authentication
- CORS enabled for cross-origin requests
- Input validation using validator package

## License

ISC 