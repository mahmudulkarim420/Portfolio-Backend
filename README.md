# Mahmudul Karim Portfolio — Backend Specification

> This document is a **backend build specification** derived entirely from the existing Next.js 14 frontend. It describes every API, database model, validation rule, and architectural decision needed to implement a production-ready backend (Node.js + Express + Prisma + PostgreSQL) without re-inspecting the frontend.
>
> The frontend currently reads all content from a static data file ([`src/data/projects.ts`](src/data/projects.ts:1)) and exposes "legacy" TypeScript contracts in [`src/types/index.ts`](src/types/index.ts:1). Those contracts — together with the input shapes for server actions (`ProjectInput`, `SkillInput`, `ExperienceInput`, `ProfileInput`, `MessageInput`) and the session types (`SessionUser`, `SessionPayload`) — are the source of truth for this specification.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Frontend Analysis](#2-frontend-analysis)
3. [Backend Requirements](#3-backend-requirements)
4. [Database Design](#4-database-design)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [File Upload Requirements](#6-file-upload-requirements)
7. [Validation Rules](#7-validation-rules)
8. [Backend Folder Structure](#8-backend-folder-structure)
9. [Environment Variables](#9-environment-variables)
10. [API Development Roadmap](#10-api-development-roadmap)
11. [Future Improvements](#11-future-improvements)
12. [Assumptions & Notes](#12-assumptions--notes)

---

## 1. Project Overview

### What the application does

Mahmudul Karim Portfolio is a personal developer portfolio website. It presents a single-page bento-grid home page (hero, about, skills, professional journey, projects, contact) plus a dynamic project case-study detail route (`/projects/[slug]`). A visitor can browse the developer's profile, skills, work experience, and projects, open an in-page case-study modal, and (per the implied message contracts) send a contact message.

The backend's job is to turn the currently-hardcoded content into database-driven, admin-manageable content and to provide an authenticated admin API for full CRUD over that content.

### Main features

- **Public site**
  - View profile (name, title, bio, avatar, contact details, social links, resume link).
  - View skills grouped by category (Frontend / Backend Development) with proficiency level and icon.
  - View professional experience timeline.
  - Browse project cards and open a full case-study modal or visit `/projects/[slug]`.
  - Each project case study shows: hero image, overview, technologies, live/client/server repo links, challenges faced, and future plans.
  - Send a contact message (implied by `MessageInput` / `LegacyMessage`).
  - SEO: per-project metadata, JSON-LD `Person` structured data, `sitemap.xml`, `robots.txt`.
- **Admin (authenticated)**
  - Log in with email + password (JWT).
  - Create / update / delete / reorder projects, skills, and experiences.
  - Toggle project `published` state (draft vs published).
  - Update the singleton profile.
  - Read / mark-as-read / delete incoming contact messages.

### User roles

| Role | Description | Access |
|------|-------------|--------|
| **Visitor (public)** | Anyone browsing the portfolio. | All `GET` content endpoints + `POST` contact message. No authentication. |
| **Admin** | The portfolio owner (Mahmudul Karim). Single managed account. | All public endpoints + all write/delete endpoints + message inbox. Requires a valid JWT. |

> **Assumption:** The frontend contains no registration UI and the `SessionUser` type has only `id`, `email`, `name`. Therefore the admin account is assumed to be a single, seeded account (no public sign-up). See [§5](#5-authentication--authorization).

---

## 2. Frontend Analysis

### 2.1 Pages and their purpose

| Route | File | Purpose | Rendering |
|-------|------|---------|----------|
| `/` | [`src/app/page.tsx`](src/app/page.tsx:1) | Home page. Server component fetches `projects`, `skills`, `profile`, `experiences` and passes them to [`HomeClient`](src/components/HomeClient.tsx:1). | Server-rendered (SSR/SSG) |
| `/projects/[slug]` | [`src/app/projects/[slug]/page.tsx`](src/app/projects/[slug]/page.tsx:1) | Project case-study detail page. Pre-rendered for every slug via `generateStaticParams`. Calls `notFound()` when the slug is unknown. | Static generation (SSG) |
| (error) | [`src/app/error.tsx`](src/app/error.tsx:1) | Route-level error boundary with a "Try again" button. | Client |
| (loading) | [`src/app/loading.tsx`](src/app/loading.tsx:1) | Lightweight loading UI shown while server components load. | Server |
| `/sitemap.xml` | [`src/app/sitemap.ts`](src/app/sitemap.ts:1) | Lists home + every project detail route. | Generated |
| `/robots.txt` | [`src/app/robots.ts`](src/app/robots.ts:1) | Allows all crawlers, points to sitemap. | Generated |

### 2.2 Sections rendered on the home page

The home page is a bento grid assembled by [`HomeClient`](src/components/HomeClient.tsx:1). Sections can be re-ordered to the top via the navigation chips (context-driven, client-only state in [`Providers`](src/components/Providers.tsx:1)).

| Section | File | Data source | Dynamic? |
|---------|------|-------------|----------|
| Hero | [`HeroSection`](src/components/sections/HeroSection.tsx:1) | Hardcoded avatar/name/tagline + social links + resume URL | Partially dynamic (should come from `profile`) |
| About | [`AboutSection`](src/components/sections/AboutSection.tsx:1) | Hardcoded bio text | Should come from `profile.bio` |
| Skills | [`SkillsSection`](src/components/sections/SkillsSection.tsx:1) | `skills` prop (grouped by `category`) | ✅ Dynamic |
| Professional Journey | [`ProfessionalJourney`](src/components/sections/ProfessionalJourney.tsx:1) | `experiences` prop + static "training" list | ✅ Dynamic (experience); training is static |
| Projects | [`ProjectsSection`](src/components/sections/ProjectsSection.tsx:1) → [`ProjectCard`](src/components/cards/ProjectCard.tsx:1) → [`ProjectModal`](src/components/ui/ProjectModal.tsx:1) | `projects` prop | ✅ Dynamic |
| Contact | [`ContactSection`](src/components/sections/ContactSection.tsx:1) | `profile` prop (location, phone, email) | ✅ Dynamic |
| Footer | [`Footer`](src/components/sections/Footer.tsx:1) | Hardcoded logo + copyright | Static |

### 2.3 Dynamic sections (data-driven)

1. **Skills** — grouped by `category`, each skill has `name`, `level`, `icon` (a `react-icons` component name), and `order`.
2. **Professional Experience** — timeline of `role`, `company`, `startDate`, `endDate`, `description`, `order`.
3. **Projects** — list of cards; each opens a modal mirroring the `/projects/[slug]` page.
4. **Project detail page** — full case study looked up by `slug`.
5. **Contact details** — location, phone, email from `profile`.
6. **Profile / Hero** — avatar, name, title, bio, social links, resume URL.

### 2.4 Forms and the data they collect

The current public frontend renders **no visible `<form>` elements** — the `ContactSection` only displays contact information. However, [`src/types/index.ts`](src/types/index.ts:1) defines explicit **input contracts** that imply the following forms (admin + public). These are the basis for the backend APIs.

| Implied form | Input type | Fields collected | Source type |
|--------------|-----------|------------------|-------------|
| Contact message (public) | `MessageInput` | `name`, `email`, `message` | [`src/types/index.ts`](src/types/index.ts:138) |
| Admin login | `SessionUser` / `SessionPayload` | `email`, `password` (password not in type — auth-only) | [`src/types/index.ts`](src/types/index.ts:9) |
| Create/Update project (admin) | `ProjectInput` | `title`, `subtitle`, `slug`, `image`, `briefDescription`, `content`, `published`, `order`, `technologies[]`, `links{live,clientRepo,serverRepo}`, `challengesFaced[]`, `futurePlans[]` | [`src/types/index.ts`](src/types/index.ts:93) |
| Create/Update skill (admin) | `SkillInput` | `name`, `category`, `proficiency`, `order` | [`src/types/index.ts`](src/types/index.ts:108) |
| Create/Update experience (admin) | `ExperienceInput` | `role`, `company`, `period`, `description`, `order` | [`src/types/index.ts`](src/types/index.ts:115) |
| Update profile (admin) | `ProfileInput` | `name`, `title`, `bio`, `email`, `phone`, `location`, `github`, `linkedin`, `twitter`, `website`, `avatar`, `resumeUrl` | [`src/types/index.ts`](src/types/index.ts:123) |

> **Assumption (contact form):** The `LegacyMessage` type (`id`, `name`, `email`, `message`, `read`, `createdAt`) and `MessageInput` strongly imply a public contact form plus an admin message inbox, even though the current `ContactSection` only shows contact info. This is treated as a required backend feature. See [§12](#12-assumptions--notes).

### 2.5 CRUD operations required

| Resource | Create | Read (public) | Read (admin) | Update | Delete | Notes |
|----------|:------:|:------------:|:------------:|:------:|:------:|-------|
| Projects | ✅ admin | ✅ list + by slug | ✅ all (incl. drafts) | ✅ admin | ✅ admin | `published` flag controls public visibility; `order` controls display order |
| Skills | ✅ admin | ✅ list | ✅ | ✅ admin | ✅ admin | `order` controls display order within category |
| Experiences | ✅ admin | ✅ list | ✅ | ✅ admin | ✅ admin | `order` controls timeline order |
| Profile | ❌ (singleton, seeded) | ✅ | ✅ | ✅ admin | ❌ | Single row; update only |
| Messages | ✅ public (contact form) | ❌ | ✅ inbox | ✅ admin (mark read) | ✅ admin | `read` boolean + `createdAt` |
| Auth | ❌ (seeded admin) | ❌ | ❌ | ✅ (change password) | ❌ | Login returns JWT |

---

## 3. Backend Requirements

The backend is organized into **modules**. Each module owns its routes, controller, service, and validation. All modules share the Prisma client, auth middleware, error handler, and Cloudinary upload utility.

### 3.1 Module: Auth

**Responsibility:** Authenticate the admin and issue/verify JWTs.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/auth/login` | Public | Validate credentials, return JWT + user |
| `GET` | `/api/auth/me` | Admin | Return the current authenticated user |
| `POST` | `/api/auth/change-password` | Admin | Change the admin password |

**`POST /api/auth/login`**

Request:
```json
{
  "email": "mahmudulkarim545@gmail.com",
  "password": "secret123"
}
```

Response `200`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "admin-1", "email": "mahmudulkarim545@gmail.com", "name": "Mahmudul Karim" }
}
```

Response `401`:
```json
{ "error": "Invalid email or password" }
```

**`GET /api/auth/me`** → `200`
```json
{ "id": "admin-1", "email": "mahmudulkarim545@gmail.com", "name": "Mahmudul Karim" }
```

### 3.2 Module: Profile

**Responsibility:** Manage the singleton profile shown in the hero, about, and contact sections.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/profile` | Public | Return the profile |
| `PUT` | `/api/profile` | Admin | Update the profile |
| `POST` | `/api/profile/avatar` | Admin | Upload avatar image (returns Cloudinary URL) |
| `POST` | `/api/profile/resume` | Admin | Upload resume file (returns Cloudinary URL) |

**`GET /api/profile`** → `200`
```json
{
  "id": "singleton",
  "name": "Mahmudul Karim",
  "title": "Web Developer",
  "bio": "Web developer from Bangladesh...",
  "email": "mahmudulkarim545@gmail.com",
  "phone": "+880 1805111544",
  "location": "Dhaka, Bangladesh",
  "github": "https://github.com/mahmudulkarim420",
  "linkedin": "https://www.linkedin.com/in/mahmudul-karim-dev/",
  "twitter": "https://www.facebook.com/prem.hassan.784077",
  "website": "",
  "avatar": "https://res.cloudinary.com/.../18495_txxm64.png",
  "resumeUrl": "https://drive.google.com/..."
}
```

**`PUT /api/profile`** — request body matches [`ProfileInput`](src/types/index.ts:123) (all fields optional except `name`, `title`, `email`). Returns the updated profile.

### 3.3 Module: Skills

**Responsibility:** CRUD for skills, grouped by category, ordered by `order`.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/skills` | Public | List all skills (ordered) |
| `GET` | `/api/skills/:id` | Public | Get one skill |
| `POST` | `/api/skills` | Admin | Create a skill |
| `PUT` | `/api/skills/:id` | Admin | Update a skill |
| `DELETE` | `/api/skills/:id` | Admin | Delete a skill |

**`GET /api/skills`** → `200`
```json
[
  {
    "id": "skill-1",
    "name": "HTML5",
    "category": "Frontend Development",
    "level": "Intermediate",
    "proficiency": 60,
    "icon": "FaHtml5",
    "order": 1
  }
]
```

**`POST /api/skills`** — body matches [`SkillInput`](src/types/index.ts:108):
```json
{ "name": "ReactJS", "category": "Frontend Development", "proficiency": 70, "order": 5 }
```

> **Note on `level` vs `proficiency`:** The legacy read shape ([`LegacySkill`](src/types/index.ts:47)) uses a string `level` ("Beginner" / "Intermediate"), while the admin input ([`SkillInput`](src/types/index.ts:108)) uses a numeric `proficiency`. The backend stores **both**: `proficiency` (number, 0–100) as the source of truth and `level` (string) derived/stored for display. See [§12](#12-assumptions--notes).

### 3.4 Module: Experiences

**Responsibility:** CRUD for professional experience timeline entries.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/experiences` | Public | List experiences (ordered) |
| `GET` | `/api/experiences/:id` | Public | Get one experience |
| `POST` | `/api/experiences` | Admin | Create an experience |
| `PUT` | `/api/experiences/:id` | Admin | Update an experience |
| `DELETE` | `/api/experiences/:id` | Admin | Delete an experience |

**`GET /api/experiences`** → `200`
```json
[
  {
    "id": "experience-1",
    "role": "Frontend Developer Intern",
    "company": "SoftStack Agency",
    "startDate": "Dec 2025",
    "endDate": "Mar 2026",
    "period": "Dec 2025 - Mar 2026",
    "description": "Worked on building responsive user interfaces...",
    "order": 1
  }
]
```

**`POST /api/experiences`** — body matches [`ExperienceInput`](src/types/index.ts:115):
```json
{ "role": "Frontend Developer Intern", "company": "SoftStack Agency", "period": "Dec 2025 - Mar 2026", "description": "...", "order": 1 }
```

> **Note on `period` vs `startDate`/`endDate`:** The legacy read shape uses `startDate` + `endDate` strings, while the admin input uses a single `period` string. The backend stores `startDate`, `endDate`, **and** `period` (period is the display string; if omitted it is derived as `startDate - endDate`). See [§12](#12-assumptions--notes).

### 3.5 Module: Projects

**Responsibility:** CRUD for projects, including draft/publish, ordering, nested technologies, links, challenges, and future plans. This is the most complex module.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/projects` | Public | List **published** projects (ordered) |
| `GET` | `/api/projects/all` | Admin | List **all** projects incl. drafts |
| `GET` | `/api/projects/:slug` | Public | Get one **published** project by slug |
| `GET` | `/api/projects/admin/:id` | Admin | Get any project by id (incl. draft) |
| `POST` | `/api/projects` | Admin | Create a project |
| `PUT` | `/api/projects/:id` | Admin | Update a project |
| `DELETE` | `/api/projects/:id` | Admin | Delete a project |
| `POST` | `/api/projects/:id/image` | Admin | Upload project hero image (returns Cloudinary URL) |

**`GET /api/projects`** → `200` (array of [`LegacyProject`](src/types/index.ts:33)):
```json
[
  {
    "id": "skillforce",
    "slug": "skillforce",
    "title": "SkillForce",
    "subtitle": "Learning Website",
    "image": "https://res.cloudinary.com/.../Screenshot_...png",
    "briefDescription": "SkillForce is a full-stack learning platform...",
    "content": "",
    "technologies": [
      { "name": "NextJS", "fullWidth": false },
      { "name": "Node, Express, MongoDB", "fullWidth": true }
    ],
    "links": { "live": "#", "clientRepo": "https://github.com/...", "serverRepo": "https://github.com/..." },
    "challengesFaced": ["Implementing secure Firebase authentication..."],
    "futurePlans": ["Add adaptive-bitrate video streaming..."]
  }
]
```

**`POST /api/projects`** — body matches [`ProjectInput`](src/types/index.ts:93):
```json
{
  "title": "SkillForce",
  "subtitle": "Learning Website",
  "slug": "skillforce",
  "image": "https://res.cloudinary.com/.../Screenshot_...png",
  "briefDescription": "SkillForce is a full-stack learning platform...",
  "content": "",
  "published": true,
  "order": 1,
  "technologies": [
    { "name": "NextJS", "fullWidth": false },
    { "name": "Node, Express, MongoDB", "fullWidth": true }
  ],
  "links": { "live": "#", "clientRepo": "https://github.com/...", "serverRepo": "https://github.com/..." },
  "challengesFaced": ["Implementing secure Firebase authentication..."],
  "futurePlans": ["Add adaptive-bitrate video streaming..."]
}
```

Response `201` returns the created project (full [`LegacyProject`](src/types/index.ts:33) shape).

### 3.6 Module: Messages

**Responsibility:** Receive public contact messages and let the admin manage the inbox.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/messages` | Public | Submit a contact message |
| `GET` | `/api/messages` | Admin | List messages (newest first) |
| `PATCH` | `/api/messages/:id/read` | Admin | Mark a message as read |
| `DELETE` | `/api/messages/:id` | Admin | Delete a message |

**`POST /api/messages`** — body matches [`MessageInput`](src/types/index.ts:138):
```json
{ "name": "Jane Doe", "email": "jane@example.com", "message": "Hi, I'd like to collaborate." }
```

Response `201`:
```json
{ "id": "msg-1", "name": "Jane Doe", "email": "jane@example.com", "message": "...", "read": false, "createdAt": "2026-07-02T11:58:18.347Z" }
```

**`GET /api/messages`** → `200` (array of [`LegacyMessage`](src/types/index.ts:66)).

### 3.7 Module: Uploads (shared utility)

**Responsibility:** Handle multipart image/file uploads to Cloudinary and return the hosted URL. Exposed via the per-resource `*/image` and `*/avatar` endpoints above (which internally call the shared upload service).

---

## 4. Database Design

Recommended database: **PostgreSQL** with **Prisma ORM**. The schema below mirrors the legacy read shapes so the frontend types map 1:1 to API responses.

### 4.1 Enums

```prisma
enum SkillCategory {
  FRONTEND_DEVELOPMENT
  BACKEND_DEVELOPMENT
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

> **Assumption:** The frontend currently uses free-text `category` ("Frontend Development", "Backend Development") and `level` ("Beginner", "Intermediate"). The enum above codifies the values seen in [`src/data/projects.ts`](src/data/projects.ts:45). If free-text categories are preferred, model `category` as `String` instead. See [§12](#12-assumptions--notes).

### 4.2 Prisma schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------------------------------------------------------------------------
// Auth — single admin account (seeded, no public sign-up)
// ---------------------------------------------------------------------------
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  messages Message[] // messages read by this admin (optional relation)
}

// ---------------------------------------------------------------------------
// Profile — singleton (one row, id = "singleton")
// ---------------------------------------------------------------------------
model Profile {
  id        String  @id @default("singleton")
  name      String
  title     String
  bio       String  @db.Text
  email     String
  phone     String
  location String
  github    String  @default("")
  linkedin  String  @default("")
  twitter   String  @default("")
  website   String  @default("")
  avatar    String  @default("")
  resumeUrl String  @default("")
  updatedAt DateTime @updatedAt
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------
model Skill {
  id          String        @id @default(cuid())
  name        String
  category    SkillCategory
  level       SkillLevel    @default(BEGINNER)
  proficiency Int           @default(0)   // 0–100, source of truth
  icon        String        @default("FiCode") // react-icons component name
  order       Int           @default(0)

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([category, order])
}

// ---------------------------------------------------------------------------
// Experiences
// ---------------------------------------------------------------------------
model Experience {
  id          String   @id @default(cuid())
  role        String
  company     String
  startDate   String   // free-text month/year, e.g. "Dec 2025"
  endDate     String   // free-text, e.g. "Mar 2026" or "Present"
  period      String   @default("") // display string; derived if empty
  description String   @db.Text
  order       Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([order])
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
model Project {
  id               String              @id @default(cuid())
  slug             String              @unique
  title            String
  subtitle         String              @default("")
  image            String              @default("")
  briefDescription String              @default("")
  content          String              @db.Text @default("") // rich text / markdown
  published        Boolean             @default(false)
  order            Int                 @default(0)

  technologies     ProjectTechnology[]
  links            ProjectLinks?
  challenges       ProjectChallenge[]
  futurePlans      ProjectFuturePlan[]

  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  @@index([published, order])
}

model ProjectTechnology {
  id        String  @id @default(cuid())
  name      String
  fullWidth Boolean @default(false)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String

  @@index([projectId])
}

model ProjectLinks {
  id         String  @id @default(cuid())
  live       String  @default("#")
  clientRepo String  @default("")
  serverRepo String  @default("")
  project    Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId  String  @unique
}

model ProjectChallenge {
  id        String  @id @default(cuid())
  text      String
  order     Int     @default(0)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String

  @@index([projectId, order])
}

model ProjectFuturePlan {
  id        String  @id @default(cuid())
  text      String
  order     Int     @default(0)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String

  @@index([projectId, order])
}

// ---------------------------------------------------------------------------
// Messages (contact form submissions)
// ---------------------------------------------------------------------------
model Message {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String   @db.Text
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  readBy    User?    @relation(fields: [readById], references: [id], onDelete: SetNull)
  readById  String?

  @@index([createdAt])
  @@index([read])
}
```

### 4.3 Relationships summary

- `Project` **1—N** `ProjectTechnology` (cascade delete)
- `Project` **1—1** `ProjectLinks` (cascade delete)
- `Project` **1—N** `ProjectChallenge` (cascade delete, ordered)
- `Project` **1—N** `ProjectFuturePlan` (cascade delete, ordered)
- `User` **1—N** `Message` (optional `readBy`; set-null on user delete)
- `Profile` — singleton (no relations)
- `Skill`, `Experience` — standalone, ordered lists

### 4.4 Required vs optional fields

| Model | Required | Optional / defaulted |
|-------|----------|----------------------|
| `User` | `email`, `name`, `passwordHash` | — |
| `Profile` | `name`, `title`, `bio`, `email`, `phone`, `location` | `github`, `linkedin`, `twitter`, `website`, `avatar`, `resumeUrl` (default `""`) |
| `Skill` | `name`, `category` | `level` (default `BEGINNER`), `proficiency` (default `0`), `icon` (default `FiCode`), `order` (default `0`) |
| `Experience` | `role`, `company`, `startDate`, `endDate`, `description` | `period` (default `""`), `order` (default `0`) |
| `Project` | `slug`, `title` | `subtitle`, `image`, `briefDescription`, `content`, `published` (default `false`), `order` (default `0`) |
| `ProjectTechnology` | `name` | `fullWidth` (default `false`) |
| `ProjectLinks` | — | `live` (default `#`), `clientRepo`, `serverRepo` |
| `Message` | `name`, `email`, `message` | `read` (default `false`), `readById` (nullable) |

---

## 5. Authentication & Authorization

### Whether authentication is required

- **Public endpoints** (all `GET` content + `POST /api/messages` + `POST /api/auth/login`): **no auth**.
- **Admin endpoints** (all `POST`/`PUT`/`DELETE`/`PATCH` + `GET /api/projects/all` + `GET /api/messages`): **JWT required**.

### Admin-only features

- Create / update / delete projects, skills, experiences.
- Toggle project `published` state and view drafts.
- Update the singleton profile + upload avatar/resume.
- View the message inbox, mark messages read, delete messages.
- Change the admin password.

### Public features

- View published profile, skills, experiences, projects.
- View a single published project by slug.
- Submit a contact message.

### Suggested JWT flow

1. **Seed** the admin `User` row once (via a seed script) with a bcrypt-hashed password from `ADMIN_PASSWORD` env var.
2. Admin `POST /api/auth/login` with `{ email, password }`.
3. Server verifies the password with `bcrypt.compare`, then signs a JWT (HS256) with payload `{ sub, email, name }` and an expiry (e.g. `7d`). This matches the [`SessionPayload`](src/types/index.ts:15) shape (`sub`, `email`, `name`).
4. Client stores the token (httpOnly cookie recommended; `Authorization: Bearer <token>` header as fallback) and sends it on every admin request.
5. The `authenticate` middleware verifies the JWT, attaches `{ id, email, name }` (matching [`SessionUser`](src/types/index.ts:9)) to `req.user`, and rejects invalid/expired tokens with `401`.
6. `GET /api/auth/me` returns `req.user`.
7. `POST /api/auth/change-password` accepts `{ currentPassword, newPassword }`, verifies `currentPassword`, then updates `passwordHash`.

> **Assumption:** There is exactly one admin. The `authenticate` middleware does not need role checks beyond "is a valid user" — any authenticated user is the admin. If multiple admins are added later, introduce a `role` enum.

---

## 6. File Upload Requirements

### Resources that require image/file uploads

| Resource | Field | Type | Current hosting |
|----------|-------|------|-----------------|
| Profile | `avatar` | Image | Cloudinary (`res.cloudinary.com`) — see [`src/data/projects.ts`](src/data/projects.ts:36) |
| Profile | `resumeUrl` | PDF / link | Google Drive link — see [`HeroSection`](src/components/sections/HeroSection.tsx:43) |
| Project | `image` | Image (screenshot) | Cloudinary — see [`src/data/projects.ts`](src/data/projects.ts:147) |
| Footer | logo | Image | `i.ibb.co` — see [`Footer`](src/components/sections/Footer.tsx:20) |

### Suggested storage strategy

- **Cloudinary** is already in use (configured in [`next.config.mjs`](next.config.mjs:3) under `images.remotePatterns` for `res.cloudinary.com`). Use the **Cloudinary Upload API** (signed uploads from the backend using `cloudinary` SDK) for all admin image uploads.
- Endpoints `POST /api/profile/avatar`, `POST /api/profile/resume`, and `POST /api/projects/:id/image` accept `multipart/form-data` with a single `file` field, upload to Cloudinary, and return `{ url }`.
- Store only the **returned Cloudinary URL** in the database (`avatar`, `resumeUrl`, `image`).
- **Allowed MIME types:** images → `image/png`, `image/jpeg`, `image/webp`, `image/gif`; resume → `application/pdf`.
- **Max file size:** 5 MB (images), 10 MB (resume).
- The footer logo (`i.ibb.co`) is a static asset and does not need an upload endpoint.

> **Assumption:** Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are provided via environment variables. If Cloudinary is unavailable, fall back to local disk storage under `/uploads` and serve statically — but Cloudinary is the recommended production strategy since the frontend already whitelists it.

---

## 7. Validation Rules

All validation uses **Zod** schemas (one per module, in `src/modules/<module>/<module>.validation.ts`). On failure the API responds `422` with `{ "errors": { "<field>": "<message>" } }`.

### 7.1 Auth

| Field | Rule |
|-------|------|
| `email` | Required, valid email format |
| `password` | Required, min 8 chars |
| `currentPassword` (change-password) | Required |
| `newPassword` (change-password) | Required, min 8 chars, must differ from `currentPassword` |

### 7.2 Profile (`PUT /api/profile`)

| Field | Rule |
|-------|------|
| `name` | Required, 1–100 chars |
| `title` | Required, 1–100 chars |
| `bio` | Required, max 2000 chars |
| `email` | Required, valid email |
| `phone` | Required, 1–30 chars |
| `location` | Required, 1–100 chars |
| `github`, `linkedin`, `twitter`, `website` | Optional, valid URL when non-empty |
| `avatar`, `resumeUrl` | Optional, valid URL when non-empty |

### 7.3 Skills

| Field | Rule |
|-------|------|
| `name` | Required, 1–50 chars |
| `category` | Required, one of `FRONTEND_DEVELOPMENT`, `BACKEND_DEVELOPMENT` |
| `proficiency` | Required, integer 0–100 |
| `level` | Optional, one of `BEGINNER`, `INTERMEDIATE`, `ADVANCED` (auto-derived from `proficiency` if omitted: 0–33 → BEGINNER, 34–66 → INTERMEDIATE, 67–100 → ADVANCED) |
| `icon` | Optional, 1–50 chars (must be a known `react-icons` name — see [`SkillsSection`](src/components/sections/SkillsSection.tsx:41) `ICONS` map) |
| `order` | Optional, integer ≥ 0 |

### 7.4 Experiences

| Field | Rule |
|-------|------|
| `role` | Required, 1–100 chars |
| `company` | Required, 1–100 chars |
| `startDate` | Required, 1–30 chars |
| `endDate` | Required, 1–30 chars (use `"Present"` for ongoing) |
| `period` | Optional, max 60 chars (derived as `startDate - endDate` if empty) |
| `description` | Required, max 2000 chars |
| `order` | Optional, integer ≥ 0 |

### 7.5 Projects

| Field | Rule |
|-------|------|
| `title` | Required, 1–100 chars |
| `slug` | Required, 1–100 chars, matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase kebab-case), unique |
| `subtitle` | Optional, max 100 chars |
| `image` | Optional, valid URL when non-empty |
| `briefDescription` | Optional, max 500 chars |
| `content` | Optional, max 20000 chars (markdown/rich text) |
| `published` | Optional, boolean |
| `order` | Optional, integer ≥ 0 |
| `technologies` | Optional array; each item: `name` (required, 1–50), `fullWidth` (boolean) |
| `links` | Optional object: `live`, `clientRepo`, `serverRepo` (each optional URL when non-empty) |
| `challengesFaced` | Optional array of strings, each 1–500 chars |
| `futurePlans` | Optional array of strings, each 1–500 chars |

### 7.6 Messages

| Field | Rule |
|-------|------|
| `name` | Required, 1–100 chars |
| `email` | Required, valid email |
| `message` | Required, 10–2000 chars |

### 7.7 Uploads

| Field | Rule |
|-------|------|
| `file` | Required, single file, MIME in allowed set, within size limit (see [§6](#6-file-upload-requirements)) |

---

## 8. Backend Folder Structure

Recommended scalable, module-first architecture (Express + Prisma). Each module is self-contained and mirrors the frontend's resource boundaries.

```
server/
├── prisma/
│   ├── schema.prisma          # Prisma schema (see §4.2)
│   ├── seed.ts                # Seeds admin user + singleton profile + sample content
│   └── migrations/            # Generated migrations
├── src/
│   ├── app.ts                 # Express app: cors, json, multer, routes, error handler
│   ├── server.ts              # HTTP server bootstrap (listen)
│   ├── config/
│   │   ├── env.ts             # Loads + validates env vars (dotenv + zod)
│   │   ├── prisma.ts          # PrismaClient singleton
│   │   └── cloudinary.ts      # Cloudinary SDK config
│   ├── middlewares/
│   │   ├── authenticate.ts    # Verifies JWT, attaches req.user
│   │   ├── error-handler.ts   # Centralized error → JSON response
│   │   ├── validate.ts        # Generic Zod validation middleware (body/params/query)
│   │   └── upload.ts          # multer memoryStorage config (single file)
│   ├── utils/
│   │   ├── jwt.ts             # signToken / verifyToken
│   │   ├── password.ts        # hashPassword / comparePassword (bcrypt)
│   │   ├── slug.ts            # slugify helper
│   │   └── api-response.ts    # success(data) / error(code, msg) helpers
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── profile/
│   │   │   ├── profile.routes.ts
│   │   │   ├── profile.controller.ts
│   │   │   ├── profile.service.ts
│   │   │   └── profile.validation.ts
│   │   ├── skills/
│   │   │   ├── skills.routes.ts
│   │   │   ├── skills.controller.ts
│   │   │   ├── skills.service.ts
│   │   │   └── skills.validation.ts
│   │   ├── experiences/
│   │   │   ├── experiences.routes.ts
│   │   │   ├── experiences.controller.ts
│   │   │   ├── experiences.service.ts
│   │   │   └── experiences.validation.ts
│   │   ├── projects/
│   │   │   ├── projects.routes.ts
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts        # Includes nested create/update of technologies, links, challenges, futurePlans
│   │   │   ├── projects.validation.ts
│   │   │   └── projects.serializer.ts    # Maps Prisma row → LegacyProject shape
│   │   └── messages/
│   │       ├── messages.routes.ts
│   │       ├── messages.controller.ts
│   │       ├── messages.service.ts
│   │       └── messages.validation.ts
│   └── uploads/
│       └── upload.service.ts   # Shared Cloudinary upload logic
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

### Layer responsibilities

- **Routes** — define the endpoint path, HTTP method, middleware chain (`validate` → `authenticate` → `controller`).
- **Controllers** — extract request data, call the service, return `api-response.success(...)`. No business logic.
- **Services** — all Prisma queries and business logic (e.g. nested project writes, deriving `period`, deriving `level` from `proficiency`).
- **Validation** — Zod schemas per module.
- **Serializers** — transform Prisma models into the exact legacy shapes the frontend expects ([`LegacyProject`](src/types/index.ts:33), [`LegacySkill`](src/types/index.ts:47), etc.), so the API response is drop-in compatible with the current frontend types.
- **Middlewares** — cross-cutting: auth, validation, upload, error handling.
- **Prisma** — schema, migrations, seed.

---

## 9. Environment Variables

Create a `.env` file (and commit a `.env.example` without secrets):

```bash
# ── Server ──────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000          # Frontend origin (CORS)

# ── Database ────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/portfolio?schema=public"

# ── Auth / JWT ──────────────────────────────────────────
JWT_SECRET="replace-with-a-long-random-string"
JWT_EXPIRES_IN=7d

# ── Admin seed ──────────────────────────────────────────
ADMIN_NAME="Mahmudul Karim"
ADMIN_EMAIL="mahmudulkarim545@gmail.com"
ADMIN_PASSWORD="change-me-on-first-login"

# ── Cloudinary (file uploads) ───────────────────────────
CLOUDINARY_CLOUD_NAME="dvpa14whv"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_UPLOAD_FOLDER="portfolio"
```

> The frontend already uses `NEXT_PUBLIC_SITE_URL` (see [`.env`](.env:2)); the backend does not need it, but CORS must allow the frontend origin via `CLIENT_URL`.

---

## 10. API Development Roadmap

Implement in this order — each step is independently testable.

1. **Scaffold** — Initialize the Express + TypeScript project, install Prisma + PostgreSQL driver, configure `tsconfig`, `eslint`, and the folder structure from [§8](#8-backend-folder-structure).
2. **Config & Prisma** — Write `config/env.ts` (Zod-validated), `config/prisma.ts` (singleton), and the full `schema.prisma` from [§4.2](#42-prisma-schema-schemaprisma). Run `prisma migrate dev`.
3. **Seed** — Write `prisma/seed.ts` to create the admin `User` (from `ADMIN_*` env vars), the singleton `Profile`, and the sample skills/experiences/projects currently in [`src/data/projects.ts`](src/data/projects.ts:1).
4. **Shared utilities & middlewares** — `utils/jwt.ts`, `utils/password.ts`, `utils/slug.ts`, `middlewares/authenticate.ts`, `middlewares/validate.ts`, `middlewares/error-handler.ts`, `middlewares/upload.ts`, `config/cloudinary.ts`.
5. **Auth module** — `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`. Verify a valid token unlocks protected routes.
6. **Profile module** — `GET /api/profile` (public), `PUT /api/profile` (admin). Add avatar/resume upload endpoints once the uploads service is ready.
7. **Skills module** — Full CRUD; implement `level` auto-derivation from `proficiency`.
8. **Experiences module** — Full CRUD; implement `period` auto-derivation from `startDate`/`endDate`.
9. **Projects module** — Full CRUD with nested writes for `technologies`, `links`, `challengesFaced`, `futurePlans`; `published` filtering on public endpoints; the `projects.serializer.ts` to emit the [`LegacyProject`](src/types/index.ts:33) shape.
10. **Messages module** — `POST /api/messages` (public), `GET /api/messages` (admin), `PATCH .../read`, `DELETE`.
11. **Uploads** — Wire Cloudinary into `POST /api/profile/avatar`, `POST /api/profile/resume`, `POST /api/projects/:id/image`.
12. **Integration & CORS** — Configure CORS for `CLIENT_URL`, wire all routers into `app.ts`, add the global error handler, and add a `GET /api/health` check.
13. **Testing** — Add integration tests (e.g. with Vitest + Supertest) covering public reads, auth flow, and admin CRUD for each module.
14. **Frontend wiring** — Replace the static imports in [`src/app/page.tsx`](src/app/page.tsx:1) and [`src/app/projects/[slug]/page.tsx`](src/app/projects/[slug]/page.tsx:1) with `fetch` calls to the new API (or Next.js Route Handlers / server actions proxying the backend).

---

## 11. Future Improvements

Suggested backend features that go beyond what the current frontend strictly requires, but are natural extensions:

- **Admin dashboard UI** — A protected `/admin` area (not present in the current frontend) to manage content visually instead of via raw API calls.
- **Project reordering API** — A `PUT /api/projects/reorder` endpoint accepting an array of `{ id, order }` for drag-and-drop reordering.
- **Bulk publish/unpublish** — `PATCH /api/projects/bulk` to toggle `published` for multiple projects.
- **Message reply + email notification** — Send an auto-reply email to the submitter and notify the admin (via SMTP/SendGrid) on new messages.
- **Rich-text content for projects** — The `content` field is currently empty; support markdown/HTML rendering and a WYSIWYG editor in the admin.
- **Blog module** — The [`ProfessionalJourney`](src/components/sections/ProfessionalJourney.tsx:31) "Professional Training" list is currently hardcoded; promote it to a DB-managed `Training` model. A blog module is also a common next step.
- **Analytics** — Track page views and project click-throughs (privacy-friendly).
- **Rate limiting** — Add `express-rate-limit` on `POST /api/messages` and `POST /api/auth/login` to prevent abuse.
- **Refresh tokens** — Issue short-lived access tokens + long-lived refresh tokens instead of a single 7-day JWT.
- **Multiple admins / roles** — Add a `role` enum (`ADMIN`, `EDITOR`) if more than one person manages content.
- **Image optimization hooks** — Return Cloudinary transformation URLs (e.g. `f_auto,q_auto,w_1200`) so the frontend gets pre-optimized images.
- **API versioning** — Prefix routes with `/api/v1` to allow non-breaking evolution.
- **OpenAPI/Swagger docs** — Auto-generate API documentation from the route definitions.

---

## 12. Assumptions & Notes

The following are inferences made because the frontend does not make them fully explicit. They are called out so the backend builder can confirm or adjust them.

1. **Contact form (messages module).** The current [`ContactSection`](src/components/sections/ContactSection.tsx:1) only displays location/phone/email — there is no visible `<form>`. However, [`src/types/index.ts`](src/types/index.ts:66) defines `LegacyMessage` (`id`, `name`, `email`, `message`, `read`, `createdAt`) and `MessageInput` (`name`, `email`, `message`). These contracts strongly imply a public contact form plus an admin message inbox. **Assumption:** a contact form is a required backend feature; the frontend form is either planned or was removed and will be re-added.

2. **Single admin account (no sign-up).** The frontend has no registration UI, and [`SessionUser`](src/types/index.ts:9) contains only `id`, `email`, `name`. **Assumption:** the admin is a single seeded account; there is no public sign-up endpoint.

3. **`level` (string) vs `proficiency` (number) on skills.** The read shape [`LegacySkill`](src/types/index.ts:47) uses a string `level` ("Beginner"/"Intermediate"), while the admin input [`SkillInput`](src/types/index.ts:108) uses a numeric `proficiency`. **Assumption:** the backend stores both; `proficiency` (0–100) is the source of truth and `level` is derived (0–33 → BEGINNER, 34–66 → INTERMEDIATE, 67–100 → ADVANCED) unless explicitly provided.

4. **`period` (string) vs `startDate`/`endDate` on experiences.** The read shape [`LegacyExperience`](src/types/index.ts:56) uses `startDate` + `endDate`, while the admin input [`ExperienceInput`](src/types/index.ts:115) uses a single `period`. **Assumption:** the backend stores `startDate`, `endDate`, **and** `period`; if `period` is empty it is derived as `"<startDate> - <endDate>"`.

5. **Skill `category` and `level` as enums.** The frontend uses free-text values ("Frontend Development", "Backend Development", "Beginner", "Intermediate"). **Assumption:** these are codified as Prisma enums for data integrity. If free-text is preferred, model them as `String`.

6. **Cloudinary as the upload provider.** The frontend already hosts images on Cloudinary (`res.cloudinary.com`) and whitelists it in [`next.config.mjs`](next.config.mjs:3). **Assumption:** Cloudinary is the upload backend. The footer logo on `i.ibb.co` is treated as a static asset.

7. **`content` field on projects.** It is currently an empty string in [`src/data/projects.ts`](src/data/projects.ts:151) but exists on both [`LegacyProject`](src/types/index.ts:40) and [`ProjectInput`](src/types/index.ts:99). **Assumption:** it is intended for rich-text/markdown case-study content and should be supported (max 20000 chars) even though no current project uses it.

8. **Admin dashboard UI.** The frontend contains only public pages. The admin Input types imply management, but no admin UI exists. **Assumption:** the backend provides the admin API; an admin UI is a separate future task (see [§11](#11-future-improvements)).

9. **Project `published` flag.** [`ProjectInput`](src/types/index.ts:100) includes `published: boolean`, but [`LegacyProject`](src/types/index.ts:33) does not expose it. **Assumption:** public list/detail endpoints filter by `published = true`; the admin `GET /api/projects/all` returns drafts too.

10. **Resume hosting.** The hero resume link currently points to Google Drive ([`HeroSection`](src/components/sections/HeroSection.tsx:43)). **Assumption:** `resumeUrl` can be either an external URL or a Cloudinary-uploaded PDF; the backend stores whatever URL is provided.

---

*End of specification. This document is self-contained: a developer can build the entire backend from it without re-inspecting the frontend.*
