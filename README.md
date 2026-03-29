# Smart Tasker

A full-stack task management application built as an MVP to demonstrate modern frontend architecture, security practices, and DevOps readiness.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21 (standalone components, Signals API) |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL (Docker) |
| Auth | JWT + bcrypt |
| Validation | Zod |
| API Docs | OpenAPI 3 / Swagger UI |
| Testing | Vitest (Angular native) |
| CI | Jenkins (Declarative Pipeline) |
| Container | Docker + nginx |

---

## Features

- Time-based greeting with username from database
- Task board with **To-Do** and **Completed** columns
- Drag & drop between columns
- Add / edit / delete tasks (title, tag, description)
- JWT authentication with localStorage session persistence
- Skeleton loading states and error banners with retry

---

## Project Structure

```
MVP/
├── Jenkinsfile                  # CI pipeline
├── tasker-frontend/             # Angular 21 SPA
│   ├── src/app/
│   │   ├── components/          # UI components
│   │   │   ├── dashboard/       # Smart component — manages state
│   │   │   ├── task-column/     # Presentational — renders a column
│   │   │   ├── task-card/       # Presentational — renders a card
│   │   │   ├── login/
│   │   │   ├── header/
│   │   │   └── avatar/
│   │   ├── services/
│   │   │   ├── auth.service.ts  # Login, logout, token, localStorage
│   │   │   └── task.service.ts  # Task CRUD, signals state
│   │   ├── auth.guard.ts        # Route protection
│   │   ├── auth.interceptor.ts  # Attaches Bearer token to every request
│   │   └── app.config.ts        # provideHttpClient + interceptors
│   ├── src/environments/        # environment.ts / mock / prod
│   ├── Dockerfile               # Multi-stage: build → nginx
│   └── nginx.conf               # SPA fallback routing
│
└── tasker-backend/              # Express REST API
    ├── server.js                # App bootstrap, middleware, routes mount
    ├── db.js                    # Shared pg Pool
    ├── routes/                  # URL → controller mapping
    ├── controllers/             # HTTP request/response handling
    ├── services/                # Business logic + SQL queries
    ├── middleware/
    │   ├── auth.middleware.js   # JWT verification
    │   ├── validate.middleware.js # Zod schema validation
    │   ├── async-handler.js     # Wraps async controllers for error forwarding
    │   └── error.middleware.js  # Global error handler
    ├── schemas/                 # Zod schemas (auth, task)
    ├── swagger/                 # OpenAPI YAML split by domain
    ├── mock/                    # json-server mock for development
    └── scripts/                 # One-time utility scripts
```

---

## Architecture Decisions

### Frontend

**Signals instead of RxJS BehaviorSubject**
Angular 21 Signals provide simpler, synchronous state management for UI state. RxJS is still used where it belongs — HTTP streams — but internal component/service state uses `signal()` and `computed()`. This reduces boilerplate and makes change detection more predictable.

**Smart / Presentational component split**
`Dashboard` is the only smart component — it owns state and handles events. `TaskColumn` and `TaskCard` are purely presentational: they receive data via `input()` and emit events via `output()`. This makes them independently testable and reusable.

**Observable-based service methods**
`TaskService` methods (`createTask`, `updateTask`, `deleteTask`) return `Observable` rather than subscribing internally. This gives callers full control over the subscription lifecycle. `Dashboard` uses `takeUntilDestroyed()` to automatically unsubscribe when the component is destroyed, preventing memory leaks.

**HTTP interceptor for auth**
Rather than manually attaching `Authorization` headers in every service method, a single `authInterceptor` reads the token from `AuthService` and attaches it to every outgoing request. The login endpoint is naturally excluded since it has no token yet.

**Environment-based API switching**
Three environment files (`environment.ts`, `environment.mock.ts`, `environment.prod.ts`) control which API the app talks to. Angular's `fileReplacements` in `angular.json` swaps the file at build time. Running `ng serve --configuration mock` points the app to the local json-server on port 3001 without touching any source code.

### Backend

**Layered architecture**
The original monolithic `server.js` (140 lines, all logic in one file) was split into four distinct layers:

- **Routes** — URL mapping only, no logic
- **Controllers** — HTTP request parsing and response formatting
- **Services** — all SQL queries and business logic
- **Middleware** — cross-cutting concerns (auth, validation, error handling)

This separation means each layer can be changed or tested independently.

**JWT over sessions**
Sessions require server-side storage (Redis or DB) which adds infrastructure complexity. JWTs are stateless — the server only needs the secret to verify a token. Tokens expire after 7 days. The tradeoff is that tokens cannot be invalidated before expiry without a blocklist, which is acceptable for this MVP scope.

**Zod validation as middleware**
Input validation runs before controllers via `validate(schema)` middleware. This means controllers receive already-validated, type-safe data and don't need defensive checks. Invalid requests are rejected with structured error responses (`{ error, details: [{ field, message }] }`) before any business logic runs.

**bcrypt for passwords**
Plaintext password comparison is replaced with `bcrypt.compare()`. The cost factor of 10 provides a reasonable balance between security and performance (≈100ms per comparison). The `scripts/hash-passwords.js` one-time migration script hashes existing plaintext passwords in the database.

**Global async error handling**
All async controllers are wrapped in `asyncHandler` which forwards thrown errors to Express's error handler via `next(err)`. This eliminates repetitive try/catch blocks in every controller and ensures unhandled promise rejections never crash the server.

---

## Running Locally

### Prerequisites
- Node.js 22+
- Docker Desktop

### Database
```bash
cd tasker-backend
docker-compose up -d
```

### Backend (real)
```bash
cd tasker-backend
cp .env.example .env   # fill in DB credentials
npm install
node scripts/hash-passwords.js   # one-time: hash existing passwords
npm run dev
```

### Backend (mock — no database needed)
```bash
cd tasker-backend
npm run mock
```

### Frontend
```bash
cd tasker-frontend
npm install

# Against real backend (port 3000)
ng serve

# Against mock backend (port 3001)
ng serve --configuration mock
```

### Running tests
```bash
cd tasker-frontend
npm test
```

---

## CI Pipeline (Jenkins)

The `Jenkinsfile` at the project root defines a declarative pipeline with these stages:

1. **Checkout** — clone from SCM
2. **Frontend** — `npm ci` → `npm test -- --run` → `npm run build`
3. **Backend** — `npm ci`
4. **Docker Build** — builds images for both frontend and backend
5. **Docker Push** — pushes to Docker Hub (runs on `main` branch only, requires `dockerhub-credentials` in Jenkins credentials store)

---

## API Documentation

With the backend running:

| URL | Description |
|-----|-------------|
| `http://localhost:3000/api-docs` | Combined Swagger UI |
| `http://localhost:3000/api-docs/auth` | Auth endpoints only |
| `http://localhost:3000/api-docs/tasks` | Task endpoints only |
