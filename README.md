# HRMS Lite

## Overview

HRMS Lite is a lightweight Human Resource Management System designed as a simple internal HR tool for:

- **Employee management**: Add, list, and delete employees.
- **Attendance tracking**: Mark daily attendance and view records.
- **Basic summaries**: View total present/absent days per employee.

The focus is on a clean, production-ready architecture and a desktop-style admin UI.

## Tech Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB Atlas (or any MongoDB instance)

## Project Structure

- `backend/`
  - `app/main.py`: FastAPI application entrypoint and router registration.
  - `app/config.py`: Configuration and environment loading.
  - `app/database.py`: MongoDB connection and dependency.
  - `app/routers_employees.py`: Employee management APIs.
  - `app/routers_attendance.py`: Attendance management APIs and summary.
  - `app/schemas.py`: Pydantic models and API schemas.
  - `requirements.txt`: Python dependencies.
- `frontend/`
  - Vite React application with a single-page admin console UI.

## Backend: Running Locally

### 1. Create and configure environment

In `backend/`, create a `.env` file:

```bash
MONGODB_URI="YOUR_MONGODB_ATLAS_CONNECTION_STRING"
MONGODB_DB_NAME="hrms_lite"
```

You can also point `MONGODB_URI` to a local MongoDB instance if preferred.

### 2. Install dependencies

From the `backend/` directory:

```bash
pip install -r requirements.txt
```

### 3. Run the API server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- Base URL: `http://localhost:8000/`
- API root: `http://localhost:8000/api`
- Swagger docs: `http://localhost:8000/docs`

### Core API Endpoints

- **Employees**
  - `POST /api/employees` – Create employee (unique `employee_id` and email, validations).
  - `GET /api/employees` – List all employees.
  - `DELETE /api/employees/{employee_id}` – Delete an employee.

- **Attendance**
  - `POST /api/attendance` – Mark attendance for an employee (date + Present/Absent, one per day).
  - `GET /api/attendance` – List attendance records (optional filters: `employee_id`, `date`).
  - `GET /api/attendance/employee/{employee_id}` – Attendance for a specific employee.
  - `GET /api/attendance/summary` – Summary per employee (total present/absent).

All endpoints return meaningful error messages and appropriate HTTP status codes (e.g. 404, 409, 422).

## Frontend: Running Locally

### 1. Configure API base URL

In `frontend/`, create a `.env` file:

```bash
VITE_API_BASE_URL="http://localhost:8000/api"
```

### 2. Install dependencies

From the `frontend/` directory:

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

The application will be available at the URL printed by Vite (typically `http://localhost:5173`).

## UI Overview

- **Desktop-like layout** with:
  - Left sidebar navigation (`Employees`, `Attendance`).
  - Top bar showing current module and basic counters.
  - Main content area showing tables and forms.
- **Employee Management**:
  - Table of employees with delete action.
  - Form to add new employees.
  - Loading, empty, and error states.
- **Attendance Management**:
  - Form to mark attendance for an employee.
  - Table of recent records.
  - Summary table with total present/absent per employee.

## Deployment Notes

You can deploy the application using any modern platform:

- **Backend**: Render, Railway, Azure App Service, etc. (Expose FastAPI on a public URL and set `MONGODB_URI` and `MONGODB_DB_NAME` environment variables.)
- **Frontend**: Netlify, Vercel, GitHub Pages, etc. (Build with `npm run build` and point `VITE_API_BASE_URL` to the deployed backend URL.)

Ensure that:

- The backend CORS settings allow your frontend origin.
- The frontend `.env` uses the live backend URL.

## Assumptions & Limitations

- Single admin user; no authentication or authorization.
- No advanced HR features (leave, payroll, roles, etc.).
- No pagination or advanced filtering beyond simple query parameters.