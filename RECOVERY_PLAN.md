# Database Refactoring & Recovery Plan

This document outlines the strategic plan to refactor the database for multi-project data separation and recover from the recent database reset.

## Current Status

- The original Supabase project was reset during a migration attempt.
- A new, clean Supabase project has been created:
  - **Project Name:** DISRUPTOR
  - **Project ID:** `hjplkyeuycajchayuylw`
- The immediate goal is to establish the correct, unified schema in this new project.

## High-Level Goal

The primary objective is to refactor the database so that data from different applications (Vortexcore, SEFTEC Store, CaaS, etc.) is properly isolated, preventing data "flying around" and ensuring a single source of truth for user identity.

## Planned Steps

### 1. Unify User Identity

- **Problem:** Multiple `users` tables (`auth.users`, `public.users`, `client_services.users`) exist, causing confusion.
- **Solution:**
    1.  Establish `auth.users` as the single source of truth for authentication.
    2.  Use the `public.profiles` table for all user metadata (first name, company, etc.).
    3.  **Action:** Add an `app_id` column to `public.profiles` to link each user to their primary application.
    4.  **Future Code Update:** All applications must be modified to use `supabase.auth.signIn()` for logins and fetch profile data from `public.profiles`.
    5.  **Future Data Migration:** Data from the old `public.users` and `client_services.users` will be migrated into the new `public.profiles` table.

### 2. Enforce Data Separation

- **Problem:** Business-logic tables (e.g., `transactions`, `orders`, `memory_entries`) lack a clear owner, making it impossible to know which app the data belongs to.
- **Solution:**
    1.  **Action:** Use the `control_room.apps` table as a central registry for all applications.
    2.  **Action:** Add a non-nullable `app_id` foreign key to all relevant tables, referencing `control_room.apps`.
    3.  **Future Code Update:** All application code must be updated to write the `app_id` on new records and filter all `SELECT` queries by `app_id`.
    4.  **Action:** Implement strict Row-Level Security (RLS) policies on all tables to programmatically enforce data isolation at the database level.

### 3. Create Onboarding Guidelines

- **Problem:** The lack of clear rules led to the current situation.
- **Solution:**
    1.  **Action:** Create a `DATABASE_ONBOARDING_GUIDE.md` that defines the new, mandatory process for adding applications and tables to the ecosystem, ensuring the `app_id` linkage is always enforced.

This plan will result in a clean, scalable, and secure multi-tenant database architecture.
