# Support Ticket & SLA Tracking System

A Dockerized full-stack assignment implementation for a lightweight support desk. It includes a MySQL schema, Express REST API, scheduled SLA engine, and a React agent dashboard.

## Quick Start

This repository now uses a single root `docker-compose.yml` that brings up MySQL, phpMyAdmin, the backend, frontend and a separate `sla-cron` service that runs the SLA worker.

To start everything:

```bash
docker compose up -d --build
```

Notes:

- The `sla-cron` is a standalone service (separate container) and not embedded inside the backend process. This makes it easy to scale and inspect independently.

Open:

- Frontend: http://localhost:5173
- phpMyAdmin: http://localhost:8080
- Backend health: http://localhost:4000/health
- API base: http://localhost:4000/api

## Tech Choices

- **Backend:** Express with `mysql2/promise` and `zod`.
- **Cron service:** `node-cron` with `mysql2/promise`.
- **Frontend:** React + Vite with local component state. This is enough for the assignment size and avoids unnecessary global state.
- **Database:** MySQL 8 with foreign keys, enums for constrained workflow fields, and indexes aligned to list filters and SLA scans.
- Clustering is used in the backend service for bettar performance 

## API

- `POST /api/tickets` creates a ticket and computes `sla_due_at` from priority.
- `GET /api/tickets` lists tickets with `page`, `pageSize`, `status`, `priority`, and `search`.
- `GET /api/tickets/:id` returns a ticket with comments and SLA events.
- `PATCH /api/tickets/:id/status` applies the status state machine.
- `PATCH /api/tickets/:id/assign` assigns or unassigns an agent.
- `POST /api/tickets/:id/comments` adds a comment.
- `GET /api/dashboard/stats` returns summary counts.
- `GET /api/agents` supports assignment UI.

## SLA Rules

Default SLA windows are configurable through env vars:

- `urgent`: 2 hours
- `high`: 8 hours
- `medium`: 24 hours
- `low`: 72 hours

The warning threshold defaults to the final 20% of the SLA window. For example, an urgent ticket warns with about 24 minutes remaining.

## Cron Idempotency

The SLA engine runs on `SLA_CRON_SCHEDULE` and scans tickets in `open` or `in_progress`.

Idempotency is enforced in two places:

- `sla_events` has a unique key on `(ticket_id, event_type)`, so repeated runs cannot create duplicate `warning`, `breached`, or `escalated` events.
- The worker uses `INSERT IGNORE`, row-level `FOR UPDATE` locking, and `is_escalated` checks before changing priority.

If the server is down for several hours, missed runs are not a problem. On the next run, the worker compares the current time with each active ticket's stored `sla_due_at`, so overdue tickets are still breached and escalated once.

Resolved and closed tickets are excluded from the SLA scan.

## Status State Machine

Allowed transitions:

- `open -> in_progress | resolved | closed`
- `in_progress -> open | resolved | closed`
- `resolved -> open | closed`
- `closed` is error

Invalid transitions return `409 Conflict` with a clear message.

## Database Design & Indexes

- `tickets.assigned_agent_id` uses `ON DELETE SET NULL`, because historical tickets should remain if an agent record is removed.
- `ticket_comments.ticket_id` and `sla_events.ticket_id` use `ON DELETE CASCADE`, because child records have no value without their ticket.
- `idx_tickets_sla_scan (status, sla_due_at, is_escalated)` supports the cron worker's active-ticket SLA scan.
- `idx_tickets_list_filters (status, priority, created_at)` supports dashboard filtering and sorting.
- `idx_comments_ticket_created` and `idx_sla_events_ticket_created` support ticket detail timelines.
- `uq_sla_event_once (ticket_id, event_type)` is the key guard for SLA idempotency.

## Environment Variables


- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `PORT`, `CORS_ORIGIN`
- `SLA_CRON_SCHEDULE`, `SLA_WARNING_RATIO`
- `SLA_LOW_HOURS`, `SLA_MEDIUM_HOURS`, `SLA_HIGH_HOURS`, `SLA_URGENT_HOURS`
- `VITE_API_BASE_URL` ,`RATE_LIMIT_WINDOW_MS` ,`RATE_LIMIT_MAX`

## Useful Commands

```bash
docker compose up --build
docker compose logs -f backend
docker compose down
```

Equivalent legacy commands are `docker-compose up --build`, `docker-compose logs -f backend`, and `docker-compose down`.

## What I Would Improve With More Time


- Use a messaging queue (e.g., kafka or RabbitMQ) to decouple Db Write operations

- Add simple start/stop and maintenance scripts  (Bash and PowerShell) that wrap `docker compose` commands and common tasks (migrations, seed). This makes local development and CI easier to manage.

- Interactive and bettar ui