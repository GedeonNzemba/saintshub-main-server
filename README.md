# Backend Server - SaintsHub

## Overview

This backend is a Node.js/Express REST API for managing churches, users, and related resources. It supports user authentication, secure CRUD operations for churches, image uploads via Cloudinary, and robust schema validation with Zod and TypeScript.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Authentication & Security](#authentication--security)
- [API Endpoints](#api-endpoints)
  - [Auth Routes](#auth-routes)
  - [Church (Dashboard) Routes](#church-dashboard-routes)
- [User & Church Data Model](#user--church-data-model)
- [Running the Project](#running-the-project)
- [Development Notes](#development-notes)

---

## Tech Stack

- **Node.js** & **Express** (REST API)
- **TypeScript** (type safety)
- **MongoDB** & **Mongoose** (data storage and ODM)
- **Zod** (request validation)
- **Cloudinary** (image uploads)
- **JWT** (authentication)
- **ESLint** (code quality)

---

## Project Structure

```
src/
  controllers/        # Route handlers (auth, dashboard)
  middleware/         # Custom Express middleware (auth, error handling)
  models/             # Mongoose schemas (User, Church)
  routes/             # Express route definitions
  schemas/            # Zod validation schemas
  services/           # Auth/email/Cloudinary utilities
  utils/              # Miscellaneous helpers
```

---

## Environment Variables

Create a `.env` file in the project root with values for:

```
MONGODB_URI=<your mongo connection string>
JWT_SECRET=<your jwt secret>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<your cloudinary cloud name>
CLOUDINARY_API_KEY=<your cloudinary api key>
CLOUDINARY_API_SECRET=<your cloudinary api secret>
```

**Note:** Cloudinary credentials are loaded from environment variables for security.

---

## Authentication & Security

- **JWT-based authentication** for protected routes.
- Passwords are securely hashed.
- Sensitive fields (like `password`) are never returned in API responses.
- Only authenticated users can create/update/delete church data.
- Public endpoints are available for fetching public church and user info.

---

## API Endpoints

### Auth Routes

| Method | Endpoint                       | Description                    | Auth Required |
|--------|------------------------------- |--------------------------------|--------------|
| POST   | `/api/v1/auth/signup`          | Register a new user            | No           |
| POST   | `/api/v1/auth/login`           | Login and get JWT              | No           |
| GET    | `/api/v1/auth/me`              | Get current user info          | Yes          |
| GET    | `/api/v1/auth/users/:id`       | Get user info by ID            | No           |
| PATCH  | `/api/v1/auth/updateMe`        | Update user profile            | Yes          |
| PATCH  | `/api/v1/auth/update-password` | Update user password           | Yes          |
| PATCH  | `/api/v1/auth/update-avatar`   | Update user avatar             | Yes          |
| POST   | `/api/v1/auth/logout`          | Logout                         | Yes          |

### Church (Dashboard) Routes

| Method | Endpoint                                  | Description                          | Auth Required |
|--------|-------------------------------------------|--------------------------------------|--------------|
| POST   | `/api/v1/dashboard/churches`              | Create a new church                  | Yes          |
| GET    | `/api/v1/dashboard/churches`              | Get all churches                     | Yes          |
| GET    | `/api/v1/dashboard/public/churches`       | Get public list (id & name)          | No           |
| GET    | `/api/v1/dashboard/churches/:id`          | Get single church (populates user)   | Yes          |
| PATCH  | `/api/v1/dashboard/churches/:id`          | Update church                        | Yes          |
| DELETE | `/api/v1/dashboard/churches/:id`          | Delete church                        | Yes          |
| ...    | ...                                       | Nested routes for deacons, trustees, songs, etc. | Yes          |

---

## User & Church Data Model

### User

- `_id`, `firstName`, `lastName`, `email`, `role`, `avatar`, `createdAt`, etc.
- Password is securely hashed and never returned by the API.

### Church

- `_id`, `name`, `principal`, `location`, `image`, `banner`, `securities`, `oldServices`, `liveServices`, `gallery`, `songs`, `logo`, `createdAt`
- `user`: Reference to the User who created the church. Populated with user details (excluding password) on fetch.

---

## Running the Project

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Set up your `.env` file** (see above).
3. **Start the server:**
   ```sh
   npm run dev
   ```
4. **API is available at:**  
   `http://localhost:<PORT>/api/v1/`

---

## Development Notes

- All request payloads are validated with Zod schemas for type safety and data integrity.
- Image uploads are handled via Cloudinary and require valid credentials.
- The backend is modular and easy to extend with new resources or endpoints.
- For testing, use Postman, Insomnia, or curl to interact with the API endpoints.

---

## License

Private/Proprietary (update as needed).
