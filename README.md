# RK Estates - Real Estate Management Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing real estate properties, bookings, and customer relationships.

## Features

✅ **Admin Dashboard**
- Properties management (add, edit, delete with image uploads)
- Bookings/CRM management
- Pipeline tracking
- Business statistics

✅ **Customer Portal**
- Browse properties
- Advanced filtering (city, type, budget, BHK)
- Property details with gallery
- Quick booking system
- WhatsApp integration

✅ **Backend API**
- RESTful API for all operations
- Image upload/delete with multer
- MongoDB database
- JWT authentication

## Project Structure

```
real-state/
├── backend/
│   ├── models/           (MongoDB schemas)
│   ├── routes/           (API endpoints)
│   ├── controllers/      (Business logic)
│   ├── uploads/          (Property images)
│   ├── server.js         (Main server)
│   ├── package.json      (Dependencies)
│   └── .env              (Environment variables)
├── frontend/
│   ├── src/
│   │   ├── components/   (React components)
│   │   ├── pages/        (Main pages)
│   │   ├── services/     (API calls)
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Backend Setup

### Installation

```bash
cd backend
npm install
```

### Configuration

Update `.env` file with your MongoDB connection and other settings:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rk-estates
JWT_SECRET=your_secret_key
ADMIN_USERNAME=Naitik
ADMIN_PASSWORD=Naitik@123
WHATSAPP_NUMBER=919876543210
```

### Run Backend

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Backend API Endpoints

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (with images)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `DELETE /api/properties/:id/image/:filename` - Delete specific image

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking
- `GET /api/bookings/stats/summary` - Get booking statistics

### Authentication
- `POST /api/auth/login` - Admin login (returns JWT token)
- `GET /api/auth/verify` - Verify token

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Default Credentials

**Admin Panel:** 
- Username: `Naitik`
- Password: `Naitik@123`

## API Response Format

Success:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Database Models

### Property
- title, description, city, location
- price, type (Apartment/Villa/Plot/Commercial)
- bhk, area, amenities
- images (array of URLs)
- status, isActive flag
- views count

### Booking
- name, phone, email
- propertyId, propertyName
- visitDate, status, source
- budget, interest, notes
- whatsappSent flag

## Contact
For support, contact: rajesh@email.com | +91-XXXXXXXXXX
