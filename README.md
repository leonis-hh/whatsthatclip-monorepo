# WhatsThatClip

WhatsThatClip is a full-stack app that identifies movies and TV shows from short video clips/links, then lets users save results, view search history, and check where titles are available to watch.

This repository contains:
- `apps/api`: Spring Boot backend (Java 21)
- `apps/web`: React frontend (Create React App)

## What the app does

1. A user submits a short-form video URL (TikTok/Instagram/YouTube style links).
2. The backend downloads the clip, extracts frames, and sends those images to Gemini for title inference.
3. The inferred title is validated/enriched with TMDB search results.
4. The frontend displays title details (poster, type, year, overview).
5. Authenticated users can:
   - save favorites,
   - view search history,
   - and fetch watch provider info by country.

## Monorepo structure

```text
.
├── apps/
│   ├── api/    # Spring Boot API + auth + persistence + integrations
│   └── web/    # React single-page app
└── README.md
```

## Tech stack

### Backend (`apps/api`)
- Java 21 + Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- Spring Security + JWT (JJWT)
- PostgreSQL driver
- Google Gemini SDK (`google-genai`)
- TMDB API integration

### Frontend (`apps/web`)
- React 19
- Create React App (`react-scripts`)
- Fetch API for backend communication

## Core backend API surface

Base URL (local): `http://localhost:8080`

Public endpoints:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/analyze`

JWT-protected endpoints:
- `GET /api/history`
- `GET /api/favorites`
- `POST /api/favorites`
- `GET /api/user/profile`
- `GET /api/watch/{type}/{id}?country=US`

> Pass JWT as `Authorization: Bearer <token>`.

## Local development setup

## 1) Prerequisites

Install:
- Java 21
- Maven (or use `apps/api/mvnw`)
- Node.js + npm
- PostgreSQL
- `yt-dlp`
- `ffmpeg` + `ffprobe` (used for frame extraction)

Also obtain API keys:
- Gemini API key
- TMDB API key
- A strong JWT secret (32+ chars recommended)

## 2) Backend configuration

Create `apps/api/src/main/resources/application.properties` with values like:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/whatsthatclip
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

server.port=8080

jwt.secret=replace-with-a-long-random-secret
gemini.api.key=replace-with-gemini-key
tmdb.api.key=replace-with-tmdb-key
```

## 3) Run backend

```bash
cd apps/api
./mvnw spring-boot:run
```

## 4) Run frontend

```bash
cd apps/web
npm install
npm start
```

Frontend runs on `http://localhost:3000` and talks to the backend at `http://localhost:8080`.

## Data model (high level)

- `User`
  - email, password hash
- `SearchHistory`
  - video URL, identified title metadata, timestamp, user
- `Favorite`
  - saved title metadata, timestamp, user

## Current product notes

- The frontend currently offers both URL input and a file picker; the backend analyze route currently uses URL-based processing.
- CORS is configured for local web dev origins (`localhost:3000` and `localhost:3001`).
- Watch-provider lookup supports movie/tv and country filtering through TMDB provider data.

## Scripts

### Backend

```bash
cd apps/api
./mvnw test
./mvnw spring-boot:run
```

### Frontend

```bash
cd apps/web
npm test
npm run build
npm start
```

## Next improvements worth considering

- Add Docker Compose for API + DB + web one-command startup.
- Add backend API documentation (OpenAPI/Swagger).
- Improve analyze pipeline observability and retries.
- Wire uploaded-file flow end-to-end (frontend upload -> backend processing).
- Add e2e tests covering auth/search/favorites/watch-provider workflows.
