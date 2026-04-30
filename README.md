# Containerised CRUD REST API

## Project Description
A REST API with full CRUD functionality and pagination built with Node.js + Express, PostgreSQL database, and Nginx reverse proxy. Each service runs in a separate Docker container managed by Docker Compose.

## Tech Stack
- Node.js + Express (API)
- PostgreSQL (Database)
- Nginx (Reverse Proxy)
- Docker + Docker Compose

## How to Run
cp .env.example .env
docker compose up --build -d

API runs at: http://localhost

## API Endpoints
- GET /api/items?page=1&limit=10 — Get all items (paginated)
- POST /api/items — Create item
- PUT /api/items/:id — Update item
- DELETE /api/items/:id — Delete item
- GET /api/users?page=1&limit=10 — Get all users (paginated)
- POST /api/users — Create user
- PUT /api/users/:id — Update user
- DELETE /api/users/:id — Delete user

## Pagination
All list endpoints support pagination query params:
- page: page number (default 1)
- limit: items per page (default 10)

## Postman Collection
Included in repository: postman_collection.json

## Docker Hub
https://hub.docker.com/r/shreya0721/crud-api
