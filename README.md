# CollabBase — SaaS Team Task Manager

A production-style monorepo for the CollabBase platform.

## Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, Vite, TypeScript        |
| Backend  | FastAPI, SQLAlchemy, Alembic      |
| Database | PostgreSQL 16                     |
| Runtime  | Docker, Docker Compose            |

## Structure

```
CollabBase/
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/
│   │   │   ├── core/         # Config, settings
│   │   │   ├── db/           # Database session, base
│   │   │   ├── models/       # SQLAlchemy models
│   │   │   ├── routes/       # API routers
│   │   │   ├── schemas/      # Pydantic schemas
│   │   │   └── main.py       # App entry point
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── web/                  # React + Vite frontend
│       ├── src/
│       │   ├── api/          # API client
│       │   ├── components/   # Shared components
│       │   ├── hooks/        # Custom hooks
│       │   ├── layouts/      # Layout wrappers
│       │   ├── pages/        # Page components
│       │   ├── routes/       # Router config
│       │   ├── utils/        # Utilities, env
│       │   └── main.tsx
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for containerised setup
- [Python 3.12+](https://www.python.org/) — for local API development
- [Node.js 20+](https://nodejs.org/) — for local frontend development

---

## Quickstart — Docker (recommended)

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd CollabBase

# 2. Copy and fill in environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Build and start all services
docker-compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000       |
| API      | http://localhost:4000       |
| API Docs | http://localhost:4000/docs  |
| Database | localhost:5432              |

> API docs are only available when `DEBUG=true` in `apps/api/.env`.

---

## Local Development

### Backend

```bash
cd apps/api

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env

# Start the dev server (with auto-reload)
uvicorn app.main:app --reload --port 4000
```

### Frontend

```bash
cd apps/web

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Start the dev server
npm run dev
```

> The Vite dev server proxies `/api` requests to `http://localhost:4000` automatically.

---

## Useful Docker Commands

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f api

# Stop all services
docker-compose down

# Stop and remove volumes (resets the database)
docker-compose down -v

# Rebuild a single service
docker-compose up --build api
```
