# Hotel Room Booking & Reservation Platform

## Problem Statement
A backend platform for hotel property management and room reservations that supports secure guest authentication, hotel and room inventory, date/occupancy availability, reservation pricing, booking lifecycle management, staff operations, cancellation/refunds, invoices and administrative reports.

## Tech Stack
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing
- Postman for API testing

## Required Modules (13/13)
1. Guest Registration & Authentication
2. Hotel & Property Management
3. Room Type & Inventory Management
4. Availability Search Engine
5. Reservation Booking Workflow
6. Dynamic Pricing Rules
7. Booking Status Management
8. Check-in / Check-out
9. Housekeeping Status Tracking
10. Cancellation & Refund Policy Engine
11. Guest Booking History
12. Invoice Generation Summary
13. Admin Occupancy Reports (occupancy + revenue)

## Architecture
MVC-style organization:
- `config/` - MongoDB connection
- `models/` - Mongoose schemas
- `routes/` - Express route definitions
- `controllers/` - business logic
- `middleware/` - JWT authorization, validation and centralized error handling
- `scripts/` - admin seed script
- `postman/` - exported Postman collection

## Database Schema Summary
- `users`: name, email, passwordHash, role
- `hotels`: name, city, amenities[], rating
- `roomTypes`: hotelId, name, basePrice, totalRooms, capacity
- `rooms`: hotelId, roomTypeId, roomNumber, status, housekeepingStatus
- `bookings`: guestId, hotelId, roomTypeId, roomId, checkIn, checkOut, status, totalAmount
- `pricingRules`: hotelId/roomTypeId, type, date range, multiplier, active

Relationships use MongoDB ObjectId references because hotels, room types, rooms and bookings are independently managed resources and queried separately.

## Booking / Workflow Rules
### Date conflict
A booking conflicts when:
`requestedCheckIn < existingCheckOut AND requestedCheckOut > existingCheckIn`.

### Booking status
`RESERVED -> CONFIRMED -> CHECKED-IN -> CHECKED-OUT`

Cancellation is allowed from `RESERVED` or `CONFIRMED` only.

### Housekeeping
After checkout the room becomes `DIRTY`, then staff must progress:
`DIRTY -> CLEANING -> CLEAN`.
A room cannot be moved directly from `DIRTY` to `CLEAN`.

### Cancellation refund
- More than 7 days before check-in: 100%
- 3-7 days before check-in: 50%
- Less than 3 days: 0%

## Setup

### 1. Install dependencies
```powershell
npm install
```

### 2. Configure environment
```powershell
Copy-Item .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/hotel_booking
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@hotelbooking.com
ADMIN_PASSWORD=Admin@123
```

MongoDB Atlas can be used instead of local MongoDB. Do not commit `.env`.

### 3. Seed an admin
```powershell
npm run seed-admin
```

### 4. Start the server
```powershell
npm start
```

Server: `http://localhost:5000`

`mongosh` is not required by the Node.js application when using MongoDB Atlas.

## API Endpoint Reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Guest registration |
| POST | `/api/auth/login` | Login and JWT |
| GET | `/api/hotels` | List hotels |
| POST | `/api/admin/hotels` | Admin creates hotel |
| PUT | `/api/admin/hotels/:id` | Admin updates hotel |
| DELETE | `/api/admin/hotels/:id` | Admin deletes hotel |
| POST | `/api/admin/room-types` | Create room type |
| GET | `/api/room-types` | List room types |
| POST | `/api/admin/rooms` | Create room |
| GET | `/api/rooms` | List rooms |
| GET | `/api/hotels/search` | Search room availability |
| POST | `/api/bookings` | Create reservation |
| GET | `/api/bookings/:id` | Get booking |
| PUT | `/api/bookings/:id/status` | Controlled status transition |
| PUT | `/api/bookings/:id/cancel` | Cancel + refund |
| GET | `/api/guests/:id/bookings` | Guest booking history |
| POST | `/api/admin/pricing-rules` | Create pricing rule |
| GET | `/api/pricing-rules` | List pricing rules |
| PUT | `/api/admin/pricing-rules/:id` | Update pricing rule |
| DELETE | `/api/admin/pricing-rules/:id` | Delete pricing rule |
| PUT | `/api/bookings/:id/checkin` | Staff/Admin check-in |
| PUT | `/api/bookings/:id/checkout` | Staff/Admin check-out |
| PUT | `/api/rooms/:id/housekeeping` | Staff/Admin housekeeping update |
| GET | `/api/bookings/:id/invoice` | Invoice summary |
| GET | `/api/admin/reports/occupancy` | Occupancy report |
| GET | `/api/admin/reports/revenue` | Revenue report |

Every endpoint is documented in the exported Postman collection: `postman/Hotel-Room-Booking-Platform.postman_collection.json`.

## Validation, Security & Error Handling
- Passwords are stored as bcrypt hashes in `passwordHash`.
- Protected endpoints require a JWT Bearer token.
- Role-based authorization is enforced for Admin and Staff operations.
- Request validation runs before controller business logic.
- Centralized Express error handling returns consistent JSON error responses.
- Invalid IDs, missing fields, invalid dates, unauthorized access and workflow conflicts are rejected with 4xx responses.

## Postman Testing Checklist
Demonstrate:
1. Happy-path registration/login.
2. Validation failure -> 400.
3. Missing/invalid JWT -> 401.
4. Wrong role -> 403.
5. Booking date conflict -> 409.
6. Invalid workflow transition -> 409.
7. Invalid/non-existent ID -> 400/404.

## GitHub Hygiene
Do not commit:
- `node_modules/`
- `.env`

Commit:
- source code
- `.env.example`
- README
- Postman collection
- `package.json` and `package-lock.json`

For the contribution requirement, each team member should make genuine commits from their own GitHub account. Add collaborators and use feature branches/pull requests rather than fabricating authorship.

## Known Limitations / Scope
Payment gateways, SMS/email providers and maps are outside the required backend scope and are not required for evaluation. The project assumes a single currency/time-zone unless the team documents an extension.

## Demo Order
1. Register guest and login.
2. Login as Admin and create hotel.
3. Create room type and room.
4. Search availability.
5. Create and confirm booking.
6. Check in and check out.
7. Demonstrate housekeeping transition.
8. Show invoice and guest history.
9. Demonstrate cancellation/refund on a separate booking.
10. Show occupancy and revenue reports.

## Frontend Demo

The project now includes a browser-based demo frontend in `frontend/`. The Express server serves it at `http://localhost:5000/`, while the existing REST API remains under `/api`. The UI covers guest registration/login, hotel search, availability, booking, booking history, cancellation, invoice summary, admin hotel/room setup, occupancy/revenue reports, and room housekeeping visibility.

## Report & Screenshots

The project report is kept under `docs/P03_TeamXX_Section.pdf`. Replace the `TeamXX/Section` placeholders with the final team details and add final frontend screenshots before submission.
