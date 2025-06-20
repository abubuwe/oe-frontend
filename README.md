
## Submission 

This submission was done over 24 hours with a target of demonstating ads to users, and having a minimally working analytics engine for advertisers to be able to control their ads and see basic metrics. Due to personal constraints of being on vacation and wanting to interview in person before Tuesday, this time constaint was chosen to focus on demonstating core functionality and competencies. 

Windsurf was used to assist in the developemnt of this project.

Some parts of the project are placeholders, e.g the ad selection algorithm is very simplistic and the analytics engine isn't optimized for typical scale.

Loom Video: https://www.loom.com/share/dc7f03a323894c97bf7961541f3b7b4f?sid=5b21114e-56ef-4417-a870-cc771e2ad4e0

## Prerequisites

Create `.env` and set at least:

```bash
DATABASE_URL="postgresql://postgres:devpass@localhost:5433/postgres"

NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL="http://localhost:3000"
```

## Quick-start

```bash
npm install                      # install dependencies
npx prisma migrate dev           # create tables
npx prisma db seed               # seed demo data & test users
npm run dev                      # http://localhost:3000
```


## Authentication (dev)

This demo uses email/password (for simplicitity of setup) login (via NextAuth CredentialsProvider). The seed script creates four test users:

| Role       | Email                  | Password |
|------------|------------------------|----------|
| super      | super@example.com      | password |
| staff      | staff@example.com      | password |
| advertiser | advertiser@example.com | password |
| doctor     | doctor@example.com     | password |

Sign in at [http://localhost:3000/api/auth/signin](http://localhost:3000/api/auth/signin).

## API Overview

| Path | Methods | Roles |
| ---- | ------- | ----- |
| `/api/ask` | POST | doctor, advertiser, staff, super |
| `/api/ads` | GET | all |
| `/api/companies` | GET | super |
| `/api/categories` | GET, POST | super or company owner |
| `/api/categories/all` | GET | super |
| `/api/campaigns` | GET, POST | super or company owner |
| `/api/campaigns/all` | GET | super |
| `/api/report` | POST | all |
| `/api/reports` | GET | advertiser, staff, super |
| `/api/reports/summary` | GET | super |

## Sitemap

For full reference of all frontend pages and API routes, see [docs/sitemap.md](docs/sitemap.md).

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sitemap

### Frontend Pages

| Path                     | Method | Description                        |
| ------------------------ | ------ | ---------------------------------- |
| `/new`                   | GET    | Q&A interface (primary entry point; doctors and unauth users) |
| `/`                      | GET    | Redirects to `/new` for convenience |
| `/analytics`             | GET    | Role-based analytics dashboard (advertiser, staff, super) |

### NextAuth Routes

| Path                      | Method    | Description                   |
| ------------------------- | --------- | ----------------------------- |
| `/api/auth/[...nextauth]` | GET, POST | Sign‑in/Sign‑out, session mgmt |

### API Endpoints

| Path | HTTP | Roles | Description |
| --- | --- | --- | --- |
| `/api/ask` | POST | doctor+ | Ask question → OpenAI; record impression |
| `/api/ads` | GET | all | Fetch an ad for a question |
| `/api/report` | POST | all | Record a view or click event |
| `/api/companies` | GET | super | List all companies |
| `/api/categories` | GET / POST | super or company owner | Create / list categories for a company |
| `/api/categories/all` | GET | super | List all categories |
| `/api/campaigns` | GET / POST | super or company owner | Create / list campaigns for a company |
| `/api/campaigns/all` | GET | super | List all campaigns |
| `/api/reports` | GET | advertiser+ | List impressions & clicks (filtered by role/query) |
| `/api/reports/summary` | GET | super | Roll-up impressions & clicks by company/category |