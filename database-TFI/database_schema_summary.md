# Database Schema Summary - Backup: db_cluster-14-10-2025@02-26-55

## Overview

This is a PostgreSQL cluster dump containing a comprehensive multi-schema database system for a financial services platform with AI-powered features.

## Key Schemas

### 1. **auth** - Authentication & User Management

**Purpose:** Handles user authentication, sessions, and security.

**Main Tables:**

- `users`: Core user accounts with email, roles, SSO support
- `sessions`: User session management with JWT support
- `identities`: External identity providers (Google, GitHub, etc.)
- `refresh_tokens`: Token refresh management
- `mfa_factors`: Multi-factor authentication
- `audit_log_entries`: Security audit trail

**Key Features:**

- Multi-provider SSO (Google, GitHub, Azure, LinkedIn)
- MFA support with TOTP/WebAuthn
- Session management with refresh tokens
- Comprehensive audit logging

### 2. **client_services** - Client Services & Financial Products

**Purpose:** Core business logic for user accounts, savings, referrals, and payments.

**Main Tables:**

- `users`: Client user profiles with status and verification
- `accounts`: Wallet accounts with balances and tiers
- `savings_plans`: Predefined savings products
- `user_savings`: Individual user savings instances
- `transactions`: Financial transaction records
- `referrals`/`enhanced_referrals`: Referral program management
- `merchants`: Payment gateway configurations
- `kyc_documents`: Know Your Customer verification
- `payment_gateways`: Gateway configurations (Paystack, Xpress, etc.)

**Key Features:**

- Multi-tier account system
- Automated savings plans with interest calculations
- Referral bonus system
- KYC verification workflow
- Payment gateway integration

### 3. **credit** - Credit & Lending System

**Purpose:** Loan application and management system.

**Main Tables:**

- `providers`: Loan provider configurations
- `applications`: Loan applications from users
- `bids`: Provider loan offers
- `transactions`: Loan disbursements and repayments
- `credit_scores`: Credit scoring data
- `status_history`: Application status tracking

**Key Features:**

- Multi-provider loan marketplace
- Credit scoring integration
- Bid-based loan matching
- Comprehensive status tracking

### 4. **public** - General Application Data

**Purpose:** Shared application data and AI features.

**Main Tables:**

- `users`: Application users (separate from auth.users)
- `organizations`: Multi-tenant organization management
- `memory_entries`: AI memory system with vector search
- `chat_conversations/messages`: Chat system
- `profiles`: User profile information
- `products`: Marketplace products
- `orders/order_items`: E-commerce functionality
- `api_keys`: API key management
- `notifications`: User notification system

**Key Features:**

- Vector-based AI memory system
- Multi-tenant organization support
- Marketplace functionality
- Comprehensive notification system
- API key management

### 5. **storage** - File Storage Management

**Purpose:** File upload and storage system.

**Main Tables:**

- `buckets`: Storage bucket configuration
- `objects`: File storage records
- `migrations`: Schema migration tracking

**Key Features:**

- Multi-bucket storage system
- File versioning and metadata
- Migration tracking

### 6. **realtime** - Real-time Features

**Purpose:** Real-time messaging and subscriptions.

**Main Tables:**

- `messages`: Real-time message storage
- `subscription`: Real-time subscription management

**Key Features:**

- WebSocket-based real-time messaging
- Subscription filtering and RLS

## Data Analysis Summary

### User Base

- **Total Users:** 11 unique users across auth and client_services
- **Active Sessions:** Multiple active sessions with recent activity
- **Authentication Methods:** Email, Google, GitHub, Azure, LinkedIn

### Financial Data

- **Accounts:** Configured with different tiers and statuses
- **Transactions:** Comprehensive transaction logging
- **Savings Plans:** Predefined savings products available

### Memory System

- **Memory Entries:** 4 test entries in agent_banks_memories
- **Search Analytics:** Basic search logging implemented
- **Vector Support:** Full vector search capabilities

### Security Features

- **RLS Enabled:** Row Level Security on all major tables
- **Audit Logging:** Comprehensive audit trails
- **API Keys:** Secure API key management
- **Encryption:** Password hashing and secret storage

## Roles and Permissions

### Database Roles

- `supabase_admin`: Full administrative access
- `postgres`: Database administration
- `service_role`: Service-level operations
- `authenticated`/`anon`: User access levels
- `dashboard_user`: Dashboard access

### Application Roles

- **USER:** Standard user access
- **ADMIN:** Administrative access
- **AGENT:** Limited admin access

## Key Relationships

### Core Relationships

```
auth.users (1) → (*) client_services.users
auth.users (1) → (*) public.profiles
public.organizations (1) → (*) public.users
public.users (1) → (*) public.memory_entries
client_services.users (1) → (*) client_services.accounts
client_services.accounts (1) → (*) client_services.transactions
credit.applications (1) → (*) credit.bids
```

### Business Logic Flows

1. **User Registration:** auth.users → client_services.users → public.profiles
2. **Savings Management:** client_services.savings_plans → client_services.user_savings → client_services.transactions
3. **Loan Process:** credit.applications → credit.bids → credit.transactions
4. **Memory System:** public.memory_entries with vector search

## Areas for Improvement

### Performance

- Some unused indexes identified in migrations
- RLS policy optimization needed
- Foreign key index coverage incomplete

### Security

- API key management could be enhanced
- Audit logging could be more granular
- Some functions need search_path fixes

### Scalability

- Vector search indexing could be optimized
- Partitioning strategy for large tables
- Archive strategy for old data

## Conclusion

This database represents a mature financial services platform with comprehensive user management, lending capabilities, and AI-powered memory features. The schema is well-structured with proper relationships and security measures in place.
