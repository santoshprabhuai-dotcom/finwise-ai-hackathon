# Month-End Close AI Orchestrator

Rebuild of the uploaded Make.com/Airtable month-end close automation as a production-oriented Next.js + Supabase application.

## Scope
- Close cycle dashboard
- 15-task close checklist with dependencies
- Audit trail for task status changes
- Deterministic bank reconciliation and variance calculation
- AI-assisted daily and final report generation
- Email status parsing and Slack notifications via integrations

The original project is used as a functional reference. Hardcoded task IDs and expected balances are replaced with database-driven configuration.

## Current backend
Supabase project: configured separately in deployment environment.

## Planned frontend
Next.js App Router + TypeScript + Tailwind CSS, deployed on Vercel.
