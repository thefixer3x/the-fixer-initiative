# Project DISRUPTOR: Database Recovery & Refactoring Success Criteria

This document defines the completion criteria for the database recovery and refactoring initiative. The project is considered complete only when all items in all phases are checked.

---

### Phase 1: Infrastructure & Schema Readiness (Current Phase)

- [ ] **New Project Active:** The new Supabase project "DISRUPTOR" (`hjplkyeuycajchayuylw`) is the active target for all operations.
- [ ] **Migrations Applied:** All local migration files (`001` through `004`) have been successfully executed on the new database, creating the foundational schema.
- [ ] **Schema Verified:** The new database schema is confirmed to contain the `control_room.apps` table and the `app_id` column on the `public.profiles` table.
- [ ] **Server Stabilized:** The application server is no longer in a restart loop and can be started without crashing due to missing database tables.

---

### Phase 2: Data Restoration & Backfilling

- [ ] **Core Data Restored:** All essential data (users, accounts, transactions, etc.) from the `db_cluster-14-10-2025@02-26-55.backup` file has been successfully restored into the new database.
- [ ] **User Identities Consolidated:** A script has been run to consolidate user records from `public.users` and `client_services.users` into `auth.users` and `public.profiles`, ensuring no user data is lost.
- [ ] **`app_id` Backfilled on Profiles:** A script has been successfully executed to populate the `public.profiles.app_id` for all existing users based on their original data source.
- [ ] **`app_id` Backfilled on Core Tables:** Scripts have been run to populate the `app_id` for all other critical business tables (e.g., `client_transactions`, `memory_entries`, `orders`).
- [ ] **Data Integrity Verified:** A review confirms that data is correctly associated with its parent application and user, and no data has been orphaned.

---

### Phase 3: Application Code & Logic Refactoring

- [ ] **Unified Authentication:** All applications in the ecosystem have been updated to use the central Supabase authentication client (`supabase.auth.signIn()`, etc.).
- [ ] **Centralized Profiles:** All applications now fetch and update user profile information exclusively from the `public.profiles` table.
- [ ] **Data Scoping Implemented:** All database queries (`SELECT`, `INSERT`, `UPDATE`) in the application code for project-specific data have been updated to include a strict `WHERE app_id = ?` clause.
- [ ] **Redundant Code Removed:** No application code references the old, deprecated tables (`public.users`, `client_services.users`).

---

### Phase 4: Final Database Hardening & Cleanup

- [ ] **Constraints Enforced:** The `app_id` columns on all relevant tables have been altered to be `NOT NULL`.
- [ ] **Foreign Keys Enabled:** The foreign key constraints from `app_id` columns to `control_room.apps.id` have been enabled.
- [ ] **Row-Level Security (RLS) Activated:** Strict RLS policies are enabled and verified on all `app_id`-scoped tables, ensuring one application cannot access another's data at the database level.
- [ ] **Old Tables Dropped:** The old, now-empty, redundant tables (e.g., `public.users`, `client_services.users`) have been permanently dropped from the database.

---

### Phase 5: Documentation & Future-Proofing

- [ ] **Onboarding Guide Complete:** The `DATABASE_ONBOARDING_GUIDE.md` is written and approved, establishing a clear, mandatory process for adding new applications to the ecosystem.
- [ ] **Recovery Plan Archived:** The `RECOVERY_PLAN.md` is updated to reflect the successful completion of the project and is archived for future reference.
