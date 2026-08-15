# SafeBite

AI-powered predictive food safety intelligence platform for FSSAI & Maharashtra FDA. Built for Smart India Hackathon 2026.

## Live demo

**https://foodshield-ai.vercel.app**

## Features

- **Role-based dashboards** — Food Safety Officer, Citizen, Business Owner
- **Predictive risk scoring** — C/D tier business identification from license, inspection, document, and complaint data
- **District heat map** — Leaflet map with search, risk-tier markers, and business lookup
- **Citizen complaint portal** — AI-drafted complaints, voice input, photo evidence, auto-assignment to officers, SLA countdown with auto-escalation
- **Inspection workflow** — queue with risk prioritisation, AI inspection summaries, violation logging
- **Analytics** — risk-tier distribution, district heat metrics, complaint trends, inspection outcomes

## Demo credentials

| Role            | Email             | Password  |
| --------------- | ----------------- | --------- |
| Food Safety Officer | officer@demo.in   | demo1234  |
| Citizen             | citizen@demo.in   | demo1234  |
| Business Owner      | owner@demo.in     | demo1234  |

## Getting started

```bash
npm install
npx prisma migrate dev      # creates SQLite dev.db and applies migrations
npx prisma db seed          # optional: loads demo businesses/complaints/inspections
npm run dev -- -p 3100
```

Open [http://localhost:3100](http://localhost:3100) and pick a demo role on the login page.

## Stack

Next.js (App Router, Turbopack) · React 19 · Tailwind CSS v4 · shadcn/ui · Prisma 7 + SQLite · react-leaflet · Recharts

## Notes

- `.env` holds `DATABASE_URL` and is gitignored — copy `.env.example` values locally if present.
- The SQLite database (`dev.db`) is generated locally and not committed.
