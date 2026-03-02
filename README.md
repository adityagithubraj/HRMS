# HRMS Lite

## Overview

HRMS Lite is a simple Human Resource Management System built as a lightweight internal HR tool. It allows basic employee management and attendance tracking through a clean admin interface.

This project focuses on clean architecture and a production-ready structure using modern technologies.

---

## Features

- Add, list, and delete employees  
- Mark daily attendance (Present or Absent)  
- View attendance records  
- View total present and absent days per employee  

This system is designed for a single admin user and does not include authentication.

---

## Tech Stack

Frontend:
- React
- TypeScript
- Vite

Backend:
- FastAPI (Python)

Database:
- MongoDB (Atlas or local instance)

---

## Project Structure

```
backend/
  app/
    main.py
    config.py
    database.py
    routers_employees.py
    routers_attendance.py
    schemas.py
  requirements.txt

frontend/
  (Vite React + TypeScript app)
```

---

## Running the Backend

### 1. Create Environment File

Inside the `backend/` folder, create a `.env` file:

```
MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"
MONGODB_DB_NAME="hrms_lite"
```

### 2. Install Dependencies

```
pip install -r requirements.txt
```

### 3. Run the Server

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at:

- http://localhost:8000/
- http://localhost:8000/api
- http://localhost:8000/docs

---

## API Endpoints

### Employees

- `POST /api/employees` – Create employee  
- `GET /api/employees` – List employees  
- `DELETE /api/employees/{employee_id}` – Delete employee  

### Attendance

- `POST /api/attendance` – Mark attendance  
- `GET /api/attendance` – List attendance records  
- `GET /api/attendance/employee/{employee_id}` – Employee attendance  
- `GET /api/attendance/summary` – Attendance summary  

All endpoints return proper HTTP status codes like 404, 409, and 422 when required.

---

## Running the Frontend

### 1. Create Environment File

Inside the `frontend/` folder, create a `.env` file:

```
VITE_API_BASE_URL="http://localhost:8000/api"
```

### 2. Install Dependencies

```
npm install
```

### 3. Start Development Server

```
npm run dev
```

The app will run on the URL shown in the terminal (usually http://localhost:5173).

---

## UI Description

The application has a simple desktop-style layout:

- Left sidebar for navigation (Employees and Attendance)
- Top bar showing the current section
- Main area with forms and tables

### Employees Section

- Add employee form  
- Table listing employees  
- Delete option  
- Loading and error states  

### Attendance Section

- Mark attendance form  
- Recent attendance records table  
- Summary table with total present and absent days  

---

## Deployment

Backend:
- Deploy on Render.
- Set `MONGODB_URI` and `MONGODB_DB_NAME` environment variables.

Frontend:
- Deploy on Netlify.
- Run `npm run build`
- Update `VITE_API_BASE_URL` to your live backend URL.

Make sure CORS is properly configured on the backend.

---

## Limitations

- No authentication or user roles  
- Single admin usage  
- No advanced HR features like payroll or leave management  
