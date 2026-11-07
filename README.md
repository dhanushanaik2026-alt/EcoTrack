# EcoTrack: Smart Waste Management and Recycling System

A full-stack starter application with React + Vite, Express, and PostgreSQL.

## Requirements
- Node.js 20+
- PostgreSQL 15+
- npm

## 1. Database
Create a database named `ecotrack` in pgAdmin or psql, then run `database/schema.sql`.

## 2. Backend
```bash
cd server
cp .env.example .env
```
Edit `.env` with your PostgreSQL username/password and a long JWT secret.
```bash
npm install
npm run dev
```
API runs at http://localhost:5000

Create an admin account by registering normally, then promote it in PostgreSQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```
Log out and log back in to receive an admin token.

## 3. Frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## Demo workflow
1. Register a user and log in.
2. Create a pickup request from the dashboard.
3. Promote an account to admin using the SQL above.
4. Log in as admin and update request status.

## Security notes
- Passwords are hashed with bcrypt.
- API routes use JWT authentication and role checks.
- Configure a strong JWT_SECRET and never commit `.env`.
- This is a college project starter, not a production waste-collection service. Validate addresses and operational workflows before real deployment.
