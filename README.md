# Service Tracker

A full-stack web app for tracking field technician jobs, built for a family-run electronics repair business operating across three districts near İzmir, Turkey. It replaces manual tracking with a shared, role-based system the office and technicians can use day to day.

> The UI is in Turkish, since it was built for its real users.

## Features

- **Job and customer records**: create, view, edit and close service jobs with customer details, district, service type, status and notes
- **Duplicate detection**: normalises Turkish phone number formats (`+90`, `90`, `05…`, spaces, dashes) and warns before a duplicate customer record is created
- **Role-based access**: all signed-in staff can view jobs and mark them complete; only admins can create, edit or delete records
- **Exports**: download the job list as Excel or PDF for reporting
- **District scoping**: records are constrained at the database level to the districts the business serves

## Security and data handling

Customer data is personal data, so data handling was a design constraint from the start:

- Passwords hashed with bcrypt; stateless JWT sessions that expire after 8 hours
- Deactivated users cannot sign in
- Admin-only routes enforced server-side by middleware, not just hidden in the UI
- Parameterised SQL queries throughout
- `helmet` security headers and `express-rate-limit` request limiting
- Secrets kept in environment variables; no customer data is stored in this repository
- Designed for local or in-country hosting rather than foreign cloud storage

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, Zustand |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | bcrypt, JSON Web Tokens |
| Exports | ExcelJS, PDFKit |

## Project structure

```
backend/
  schema.sql              # database schema
  scripts/create-user.js  # creates the first admin user
  src/
    config/database.js    # PostgreSQL connection pool
    middleware/auth.js    # JWT authentication and admin check
    routes/               # auth, customers, export
    server.js
frontend/
  src/
    pages/                # Login, Dashboard
    components/           # CustomerModal
    store/useStore.js     # Zustand state
    api/client.js         # API client
```

## Getting started

Requires Node.js and PostgreSQL.

```bash
# 1. Database
createdb servis_takip
psql servis_takip -f backend/schema.sql

# 2. Backend
cd backend
cp .env.example .env        # fill in your DB credentials and a JWT secret
npm install
npm run create-user -- admin "Admin User"
npm run dev

# 3. Frontend (in a new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Status

In development. Deployment is planned on an on-premises machine or a Turkey-based VPS to keep customer data in-country.
