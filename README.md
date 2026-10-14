# Resource Reservation Management System

A web app for managing shared resources (rooms, equipment, vehicles) and their
reservations. Double bookings are blocked at the database level.

## Tech Stack
Next.js (App Router), TypeScript, PostgreSQL (`pg`), plain CSS

## Features
- Add and remove resources
- Create and cancel reservations
- Overlapping reservations for the same resource are rejected
- Dashboard showing which resources are free or in use right now
- Filter reservations by resource

## Setup
1. Install Node.js 20+ and PostgreSQL.
2. Create an empty database named `resource_reservation`.
3. Install dependencies:
```bash
   npm install
```
4. Copy `.env.example` to `.env.local` and put your own database password in it.
5. Create the tables and sample data, using either option:
   - Run `npm run db:setup`, or
   - Open `schema.sql` in pgAdmin's Query Tool (connected to `resource_reservation`) and run it.
6. Start the app:
```bash
   npm run dev
```
7. Open http://localhost:3000

## Project Structure
- `schema.sql` - tables, constraints and sample data
- `src/lib/db.ts` - PostgreSQL connection pool
- `src/app/api/` - REST API routes for resources and reservations
- `src/app/` - dashboard, resources and reservations pages

## Design Decisions
- **Overlap prevention** uses a PostgreSQL exclusion constraint (`btree_gist` +
  `tstzrange`). Checking in application code alone can fail when two requests
  arrive at the same time, so the database enforces the rule.
- Time ranges are half-open `[start, end)`, so a booking ending at 11:00 and
  another starting at 11:00 do not conflict.
- Resources are soft-deleted (`is_active`) to keep reservation history.
- Reservations are cancelled (status change), not deleted, for the same reason.
- Times are stored as `timestamptz` (UTC) and shown in the user's local time.
- Authentication was left out to keep the scope focused.

## Possible Improvements
User login and roles, calendar view, recurring reservations, automated tests.