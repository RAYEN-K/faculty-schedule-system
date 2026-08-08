# Flexible Faculty Work Schedule Management System — Backend

REST API built with **NestJS + Prisma + PostgreSQL** that lets a university department manage flexible weekly teaching schedules: faculty members request day swaps or extra/compensation days, and the Head of Department (HOD) approves or rejects them.

## Tech Stack

- **Framework:** NestJS 11 (TypeScript)
- **ORM:** Prisma 6 / PostgreSQL
- **Auth:** JWT (Passport) + bcrypt password hashing
- **Validation:** class-validator / class-transformer
- **Docs:** Swagger (`@nestjs/swagger`)
- **Tests:** Jest + Supertest

## Roles


| Role                       | Can do                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| `ADMIN`                    | Manage departments, create users, assign faculty to departments   |
| `HOD` (Head of Department) | View department schedules, approve/reject requests, manage events |
| `FACULTY`                  | View own schedule, submit modification/additional-day requests    |


## Prerequisites

- Node.js 18+
- A running PostgreSQL instance

## Setup

1. **Install dependencies**
  ```bash
  npm install

  ```
2. **Configure environment variables**
  Copy the example file and fill in your own values:
  ```bash
  cp .env.example .env

  ```
  Required variables:

  | Variable       | Description                                                                    |
  | -------------- | ------------------------------------------------------------------------------ |
  | `DATABASE_URL` | PostgreSQL connection string (pooled)                                          |
  | `DIRECT_URL`   | PostgreSQL connection string (direct, used by Prisma migrations)               |
  | `JWT_SECRET`   | Random string, **minimum 32 characters** — the app refuses to start without it |
  | `FRONTEND_URL` | Your Next.js frontend URL, used for CORS (defaults to `http://localhost:3001`) |
  | `PORT`         | API port (defaults to `3000`)                                                  |

3. **Run database migrations**
  ```bash
  npx prisma migrate dev

  ```
4. **Seed demo data**
  ```bash
  npx prisma db seed

  ```
  This creates 2 departments (Informatique, Génie Électrique) and 4 demo accounts — see below.
5. **Start the server**
  ```bash
  npm run start:dev

  ```
  API runs at `http://localhost:3000`, Swagger docs at `http://localhost:3000/api`.

## Demo Accounts

All seeded accounts use the password `password123`.


| Role    | Email                 | Department       |
| ------- | --------------------- | ---------------- |
| Admin   | `admin@faculty.tn`    | —                |
| HOD     | `hod.info@faculty.tn` | Informatique     |
| Faculty | `ahmed@faculty.tn`    | Informatique     |
| Faculty | `sarra@faculty.tn`    | Génie Électrique |


## Available Scripts


| Command              | Purpose                             |
| -------------------- | ----------------------------------- |
| `npm run start:dev`  | Start the API in watch mode         |
| `npm run build`      | Compile TypeScript to `dist/`       |
| `npm run start:prod` | Run the compiled app                |
| `npm run lint`       | Lint and auto-fix the codebase      |
| `npm run test`       | Run unit tests                      |
| `npm run test:cov`   | Run unit tests with coverage report |
| `npm run test:e2e`   | Run end-to-end tests                |
| `npx prisma studio`  | Open a GUI to browse the database   |


## API Documentation

Once the server is running, full interactive API docs (with a "try it out" button and Bearer token support) are available at:

```
http://localhost:3000/api

```

## Project Structure

```
prisma/          Database schema, migrations, seed script
src/
 ├── auth/        Login, JWT strategy, role-based guards
 ├── users/       User management (Admin only)
 ├── departments/ Department CRUD + faculty assignment
 ├── schedules/   Weekly schedule CRUD
 ├── requests/    Modification / additional-day / compensation requests + approval workflow
 ├── events/      Institutional events
 └── prisma/      Shared Prisma service

```

