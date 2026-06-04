# Project Name:

DevPulse

A collaborative platform for software teams to report bugs, suggest features, and coordinate issue resolution.

## Live URL

```
http://localhost:8000
```

---

## Features

* User Registration
* User Login
* JWT Authentication
* Password Hashing using bcrypt
* Role-Based Authorization
* Create Issue
* Get All Issues
* Get Single Issue
* Update Issue
* Delete Issue
* Issue Status Management
* Global Error Handling
* Reusable Response Utility
* PostgreSQL Database
* Raw SQL Queries (No ORM)

---

## Technology Stack

### Backend

* Node.js
* TypeScript
* Express.js

### Database

* PostgreSQL
* pg

### Authentication & Security

* JWT (jsonwebtoken)
* bcrypt

### Environment Management

* dotenv

---

## Project Setup

### 1. Clone Repository

```bash
git clone <https://github.com/Apollo-Level2-Web-Dev/B7A2#b7a2>
cd devpulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
PORT = 8000
CONNECTIONSTRING = connection_string (Secure)
JWT_SECRET = jwt_secret
```

### 4. Run Development Server

```bash
npm run dev
```

Server will start at:
```text
http://localhost:8000
```

---

## API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/signup
```

#### Login User

```http
POST /api/auth/login
```

---

### Issues

#### Create Issue

```http
POST /api/issues
```

Authentication Required

#### Get All Issues

```http
GET /api/issues
```

Optional Query Parameters:

```http
GET /api/issues?sort=newest
GET /api/issues?sort=oldest
GET /api/issues?type=bug
GET /api/issues?type=feature_request
GET /api/issues?status=open
GET /api/issues?status=in_progress
GET /api/issues?status=resolved
```

#### Get Single Issue

```http
GET /api/issues/:id
```

#### Update Issue

```http
PATCH /api/issues/:id
```

Authentication Required

#### Delete Issue

```http
DELETE /api/issues/:id
```

Authentication Required

---

## Database Schema

### Users Table

| Field      | Type                     |
| ---------- | ------------------------ |
| id         | SERIAL PRIMARY KEY       |
| name       | VARCHAR                  |
| email      | VARCHAR UNIQUE           |
| password   | VARCHAR                  |
| role       | contributor / maintainer |
| created_at | TIMESTAMP                |
| updated_at | TIMESTAMP                |

---

### Issues Table

| Field       | Type                          |
| ----------- | ----------------------------- |
| id          | SERIAL PRIMARY KEY            |
| title       | VARCHAR(150)                  |
| description | TEXT                          |
| type        | bug / feature_request         |
| status      | open / in_progress / resolved |
| reporter_id | INTEGER                       |
| created_at  | TIMESTAMP                     |
| updated_at  | TIMESTAMP                     |

---

## Authentication

Protected routes require JWT token in request header:

```http
Authorization: <JWT_TOKEN>
```

---

## Project Structure

```text
src/
├── config/
├── db/
├── middleware/
├── modules/
│   ├── auth/
│   └── issues/
├── utils/
├── app.ts
├── server.ts
```

---

## Author

Ruhul Amin
