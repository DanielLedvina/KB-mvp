# Smart Tasker

A full-stack task management application built as an MVP to demonstrate modern frontend architecture, security practices, and DevOps readiness.

---

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | Angular 21 (standalone components, Signals API) |
| Backend    | Node.js + Express 5                             |
| Database   | PostgreSQL (Docker)                             |
| Auth       | JWT + bcrypt                                    |
| Validation | Zod                                             |
| API Docs   | OpenAPI 3 / Swagger UI                          |
| Testing    | Vitest (Angular native)                         |
| CI         | Jenkins (Declarative Pipeline)                  |
| CD         | ArgoCD (GitOps)                                 |
| Container  | Docker + nginx                                  |
| Orchestration | Kubernetes (Docker Desktop)                  |

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
├── Jenkinsfile                  # CI/CD pipeline
├── k8s/                         # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.example.yaml      # Template — copy to secret.yaml and fill in
│   ├── postgres.yaml            # PVC + Deployment + Service
│   ├── backend.yaml             # Deployment + Service
│   ├── frontend.yaml            # Deployment + Service
│   ├── ingress.yaml             # nginx Ingress
│   ├── argocd-app.yaml          # ArgoCD Application manifest
│   └── init.sql                 # DB schema (users + tasks tables)
│
├── tasker-frontend/             # Angular 21 SPA
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── dashboard/       # Smart component — owns all state
│   │   │   ├── task-column/     # Presentational — renders a column
│   │   │   ├── task-card/       # Presentational — renders a card
│   │   │   ├── login/
│   │   │   ├── header/
│   │   │   └── avatar/
│   │   ├── models/              # Shared TypeScript interfaces
│   │   │   ├── task.model.ts    # Task, CreateTaskDto, UpdateTaskDto
│   │   │   ├── user.model.ts    # User
│   │   │   └── index.ts         # Barrel export
│   │   ├── services/
│   │   │   ├── auth.service.ts  # Login, logout, token, localStorage
│   │   │   └── task.service.ts  # Task CRUD, signals state
│   │   ├── auth.guard.ts        # Route protection
│   │   ├── auth.interceptor.ts  # Attaches Bearer token to every request
│   │   └── app.config.ts        # provideHttpClient + interceptors
│   ├── src/environments/        # environment.ts / environment.mock.ts
│   ├── Dockerfile               # Multi-stage: node build → nginx serve
│   └── nginx.conf               # SPA fallback routing
│
└── tasker-backend/              # Express REST API
    ├── server.js                # App bootstrap, middleware, routes
    ├── db.js                    # Shared pg Pool
    ├── routes/                  # URL → controller mapping
    ├── controllers/             # HTTP request/response handling
    ├── services/                # Business logic + SQL queries
    ├── middleware/
    │   ├── auth.middleware.js   # JWT verification
    │   ├── validate.middleware.js # Zod schema validation
    │   ├── async-handler.js     # Wraps async controllers
    │   └── error.middleware.js  # Global error handler
    ├── schemas/                 # Zod validation schemas
    ├── swagger/                 # OpenAPI YAML (auth + tasks)
    ├── mock/                    # json-server mock for development
    └── .env.example             # Environment template
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

**Centralized models**
All TypeScript interfaces live in `src/app/models/` and are exported via a barrel `index.ts`. Components and services import from `../models` — never from each other — which prevents circular dependencies and makes types easy to find.

**Environment-based API switching**
Two environment files (`environment.ts`, `environment.mock.ts`) control which API the app talks to. Angular's `fileReplacements` in `angular.json` swaps the file at build time — no source code changes needed to switch between mock and real backend.

### Backend

**Layered architecture**
Split into four distinct layers: Routes (URL mapping) → Controllers (HTTP handling) → Services (business logic + SQL) → Middleware (cross-cutting concerns). Each layer can be changed or tested independently.

**JWT over sessions**
JWTs are stateless — the server only needs the secret to verify a token. Tokens expire after 7 days. Acceptable tradeoff for MVP scope.

**Zod validation as middleware**
Input validation runs before controllers via `validate(schema)` middleware. Controllers receive already-validated data and don't need defensive checks. Invalid requests are rejected with structured errors before any business logic runs.

**bcrypt for passwords**
Passwords are hashed with bcrypt at cost factor 10 (≈100ms per comparison). Never stored in plaintext.

**Global async error handling**
All async controllers are wrapped in `asyncHandler` which forwards errors to Express's global error handler. Eliminates repetitive try/catch blocks.

---

## Scenario 1 — Mock server (no database needed)

Use this to demonstrate the app with dummy data without any infrastructure.

**What it does:** Frontend talks to `json-server` running on port 3001. Data is stored in a local JSON file. No PostgreSQL, no Docker needed.

```bash
# Terminal 1 — mock backend
cd tasker-backend
npm install
npm run mock
# json-server starts on http://localhost:3001

# Terminal 2 — frontend pointed at mock
cd tasker-frontend
npm install
ng serve --configuration mock
# App starts on http://localhost:4200
```

Login with any credentials from `tasker-backend/mock/db.json`.

---

## Scenario 2 — Real PostgreSQL database

Use this to demonstrate the app reading from and writing to a real database.

**What it does:** Frontend talks to Express backend on port 3000. Backend connects to PostgreSQL running in Docker. Data is persisted.

```bash
# Terminal 1 — start the database
docker start tasker-db
# PostgreSQL runs on localhost:5433

# Terminal 2 — real backend
cd tasker-backend
npm install
npm run dev
# Express starts on http://localhost:3000

# Terminal 3 — frontend pointed at real backend
cd tasker-frontend
ng serve
# App starts on http://localhost:4200
```

Login credentials: `daniel@tasker.com` / `password`

Swagger API docs: `http://localhost:3000/api-docs`

---

## Scenario 3 — Full CI/CD pipeline (Jenkins + Docker + ArgoCD + Kubernetes)

Use this to demonstrate the automated build and deployment flow.

**What it does:** A `git push` triggers Jenkins via GitHub webhook → Jenkins runs tests, builds Docker images, pushes to Docker Hub, updates Kubernetes manifests → ArgoCD detects the manifest change and deploys new pods automatically.

### Prerequisites

- Docker Desktop with Kubernetes enabled
- Jenkins container
- ngrok account

### First-time setup (run once)

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
# Wait for all pods to be Running
kubectl get pods -n argocd -w

# Register the app in ArgoCD
kubectl apply -f k8s/argocd-app.yaml
```

### Startup

```bash
# 1. Start Jenkins
docker start jenkins
# Open http://localhost:8080

# 2. Start ngrok so GitHub webhook can reach Jenkins
ngrok http 8080
# Update the GitHub webhook URL with the new ngrok URL
# GitHub repo → Settings → Webhooks → edit → Payload URL: https://<ngrok-id>.ngrok.io/github-webhook/

# 3. Expose ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8081:443
# Open https://localhost:8081
# Username: admin
# Password (macOS):
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 --decode && echo
# Password (Windows):
# kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

# 4. Expose the app running in Kubernetes
kubectl port-forward svc/tasker-frontend -n tasker 4200:80
kubectl port-forward svc/tasker-backend -n tasker 3000:3000
# Open http://localhost:4200
```

### Automated flow

```
git push to main
  → GitHub webhook fires → Jenkins starts automatically
  → Stage: Frontend — npm ci, 39 tests, ng build
  → Stage: Backend  — npm ci
  → Stage: Docker Build — builds tasker-frontend:N and tasker-backend:N
  → Stage: Docker Push  — pushes :N and :latest to Docker Hub
  → Stage: Update Manifests — updates k8s/frontend.yaml + k8s/backend.yaml with new tag, pushes to git
  → ArgoCD detects git change → kubectl apply → new pods roll out
```

---

## CI Pipeline stages (Jenkinsfile)

| Stage | What it does |
| ----- | ------------ |
| Check commit | Skips the pipeline if the commit is from Jenkins itself (prevents infinite loop) |
| Checkout | Clones the repo |
| Frontend | `npm ci` → `npm run test:ci` (39 tests) → `ng build` |
| Backend | `npm ci` |
| Docker Build | Builds `tasker-frontend:N` and `tasker-backend:N` |
| Docker Push | Tags `:N` and `:latest`, pushes to Docker Hub (main branch only) |
| Update Manifests | Updates image tags in `k8s/*.yaml`, commits and pushes to git |

---

## API Documentation

With the backend running (`npm run dev` or K8s port-forward):

| URL | Description |
| --- | ----------- |
| `http://localhost:3000/api-docs` | Combined Swagger UI |
| `http://localhost:3000/api-docs/auth` | Auth endpoints only |
| `http://localhost:3000/api-docs/tasks` | Task endpoints only |
