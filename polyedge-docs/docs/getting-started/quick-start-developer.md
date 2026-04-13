---
sidebar_position: 3
title: Quick Start (Developer)
description: For developers who want to run the bot from source.
---

# Quick Start (Developer)

This guide is for developers who want to run PolyEdge from source to contribute or build on top of it.

## Prerequisites

*   **Python 3.10+** (Required for the backend API)
*   **Node.js 18+** (Required for the React frontend)
*   **Git** (To clone the repository)

## Step-by-Step Setup

### 1. Clone the Repository

Download the PolyEdge project to your computer.

```bash
git clone https://github.com/your-repo/polyedge.git
cd polyedge
```

### 2. Backend Setup

Create a virtual environment and install the Python dependencies.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

Open `.env` and configure your API keys. At a minimum, set `GROQ_API_KEY` for AI features and `TRADING_MODE=paper` for safe testing.

### 3. Start the Backend

Run the FastAPI server with Uvicorn.

```bash
uvicorn backend.api.main:app --reload --port 8000
```

*   **Backend URL**: `http://localhost:8000`
*   **API Docs (Swagger)**: `http://localhost:8000/docs`

### 4. Frontend Setup

In a new terminal window, navigate to the `frontend` directory and install the Node.js packages.

```bash
cd frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

*   **Frontend URL**: `http://localhost:5173`

## Running Tests

PolyEdge includes a comprehensive test suite for both the backend and frontend.

### Backend (pytest)

```bash
# Run all backend tests
pytest
```

### Frontend (Vitest)

```bash
cd frontend
npm test
```

### E2E (Playwright)

```bash
cd frontend
npx playwright test
```

## Useful Commands

*   `uvicorn backend.api.main:app --reload` - Start the backend with auto-reload.
*   `npm run lint` - Run ESLint on the frontend code.
*   `npm run build` - Create a production build of the React app.

:::info
The backend uses **SQLite** by default for both the main database and the job queue. To use **Redis** or **PostgreSQL**, update your `DATABASE_URL` and `JOB_QUEUE_URL` in the `.env` file.
:::
