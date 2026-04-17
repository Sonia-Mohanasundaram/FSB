# Backend (Express API)

This backend serves the API used by the frontend in this project.

## MongoDB Atlas setup

1. Create a free cluster in MongoDB Atlas.
2. Create a database user and password.
3. In Network Access, allow your IP (or 0.0.0.0/0 for testing only).
4. Copy the Atlas connection string.
5. Create a .env file inside backend and set:

PORT=5000
FRONTEND_ORIGIN=http://localhost:8080
MONGODB_URI=your_atlas_connection_string

## Run

1. Open terminal in `backend`
2. Install deps: `npm install`
3. Start API: `npm run dev`

Default server URL: `http://localhost:5000`

## Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/doctors`
- `POST /api/doctors`
- `DELETE /api/doctors/:id`
- `GET /api/availability/:doctorId`
- `POST /api/availability`
- `DELETE /api/availability/:id`
- `GET /api/appointments`
- `POST /api/appointments`
- `DELETE /api/appointments/:id`
- `PUT /api/appointments/:id/visit`
