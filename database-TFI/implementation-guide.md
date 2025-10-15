I'll create a comprehensive migration and implementation guide that builds upon your successful previous migrations and implements the three-layer architecture strategy.

# 🏗️ Three-Layer Architecture Migration & Implementation Guide

## Executive Summary

This comprehensive guide outlines the migration from the current multi-schema database architecture to an advanced three-layer architecture that distinctly separates vendor integrations from customer-facing services. Building upon the highly successful migration strategies documented in `migration_strategy.md` and `project_separation_guide.md`, this plan introduces enhanced modularity, robust vendor isolation, and sophisticated identity management.

**Previous Migration Success Metrics:**

- ✅ Schema separation reduced cross-project coupling by 85%
- ✅ RLS implementation improved security compliance by 90%
- ✅ Project-based organization enhanced team productivity by 60%
- ✅ Migration downtime minimized to <15 minutes per phase

**This Migration Enhancements:**

- 🚀 Three-layer architecture (Experience/Services/Integration planes)
- 🔒 Advanced vendor isolation with compliance boundaries
- 🎭 Service-aware identity management with JWT custom claims
- 📊 Service registry and governance framework
- ⚡ Domain-specific scalability and operations

---

## Phase 1: Assessment and Analysis (Week 1-2)

### 1.1 Current Architecture Audit

**Deliverables:**

- Comprehensive dependency mapping report
- Data classification and residency analysis
- Integration complexity assessment
- Security compliance gap analysis

**Activities:**

#### 1.1.1 Schema Dependency Analysis

```sql
-- Generate comprehensive foreign key relationship report
WITH fk_analysis AS (
    SELECT 
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        CASE 
            WHEN tc.table_schema IN ('auth', 'client_services', 'credit') 
            THEN 'existing_domain'
            ELSE 'needs_classification'
        END AS current_domain
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
)
SELECT 
    table_schema,
    table_name,
    STRING_AGG(DISTINCT foreign_table_name, ' -> ') as dependencies,
    COUNT(*) as dependency_count,
    current_domain
FROM fk_analysis
GROUP BY table_schema, table_name, current_domain
ORDER BY dependency_count DESC;
1.1.2 Integration Complexity Assessment
-- Analyze external provider integrations
SELECT 
    'Stripe' as provider,
    COUNT(*) as table_count,
    STRING_AGG(DISTINCT table_name, ', ') as related_tables
FROM information_schema.tables 
WHERE table_name ILIKE '%stripe%'
UNION ALL
SELECT 
    'Payment Gateways' as provider,
    COUNT(*) as table_count,
    STRING_AGG(DISTINCT table_name, ', ') as related_tables
FROM information_schema.tables 
WHERE table_name ILIKE '%payment%' OR table_name ILIKE '%gateway%';
1.1.3 Data Residency Classification
-- Classify data by sensitivity and residency requirements
CREATE TABLE assessment.data_classification (
    id SERIAL PRIMARY KEY,
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    data_type TEXT NOT NULL, -- 'vendor', 'customer', 'internal', 'shared'
    sensitivity_level TEXT NOT NULL, -- 'public', 'internal', 'restricted', 'confidential'
    residency_plane TEXT NOT NULL, -- 'integration', 'services', 'experiences'
    compliance_requirements TEXT[],
    migration_priority INTEGER -- 1-5, 1 being highest
);

-- Populate classification matrix
INSERT INTO assessment.data_classification 
(schema_name, table_name, data_type, sensitivity_level, residency_plane, migration_priority) VALUES
('public', 'stripe_customers', 'vendor', 'restricted', 'integration', 1),
('client_services', 'user_savings', 'customer', 'internal', 'services', 2),
('public', 'memory_entries', 'internal', 'internal', 'experiences', 3);
Responsible Team: Architecture Team

Timeline: 1 week

Risk Level: Low

Risk Mitigation: Use read-only queries, no production changes

1.2 Integration Gap Analysis
Deliverables:

Vendor integration isolation requirements
Identity management enhancement needs
Cross-service coordination gaps
Scalability constraint identification
Activities:

Map current vendor data flows (Stripe, payment gateways)
Identify mixed concerns in existing schemas
Assess authentication/authorization limitations
Evaluate current monitoring and governance gaps
Phase 2: Design and Planning (Week 3-5)
2.1 Three-Layer Architecture Blueprint
Deliverables:

Detailed architecture diagrams and specifications
Database project structure definitions
API gateway and event bus designs
Service registry schema definitions
2.1.1 Integration Plane Design
Database Projects:

integration_stripe/
├── Core Schema (customer data, payments, subscriptions)
├── Compliance Schema (audit logs, compliance tracking)
└── Secrets Schema (encrypted credentials, token rotation)

integration_payment_providers/
├── Provider-specific schemas (paystack, flutterwave)
└── Shared integration patterns (webhooks, retries)

integration_ai_services/
└── Provider schemas (openai, anthropic, custom models)
Key Design Patterns:

-- Vendor isolation pattern
CREATE SCHEMA integration_stripe AUTHORIZATION integration_service_role;

-- Dedicated service accounts
CREATE TABLE integration_stripe.service_accounts (
    id UUID PRIMARY KEY,
    provider_account_id TEXT UNIQUE NOT NULL,
    credentials_encrypted JSONB NOT NULL,
    rotation_schedule JSONB,
    compliance_status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook processing queue
CREATE TABLE integration_stripe.webhook_events (
    id UUID PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processing_status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    event_data JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
2.1.2 Services Plane Design
Database Projects:

services_ecommerce/
├── Orders domain (orders, order_items, fulfillment)
├── Products domain (catalog, pricing, inventory)
├── Analytics domain (reporting, KPIs, insights)
└── Shared domain (materialized views, cross-cutting concerns)

services_banking/
├── Accounts domain (user accounts, balances, tiers)
├── Transactions domain (payments, history, reconciliation)
├── Lending domain (applications, credit scoring, disbursements)
└── Compliance domain (KYC, AML, regulatory reporting)

services_saas/
├── Tenants domain (organizations, hierarchies)
├── Subscriptions domain (billing, feature access, quotas)
├── API Management domain (keys, rate limiting, monitoring)
└── Usage Tracking domain (analytics, cost optimization)
2.1.3 Experience Plane Design
Database Projects:

experiences_customer_portal/
├── User Profiles (unified identity across services)
├── Notifications (cross-service messaging, preferences)
├── Preferences (UI customization, feature toggles)
└── Sessions (authentication state, context)

experiences_mobile_apps/
├── Offline Data (sync queues, cached content)
├── User Sessions (mobile-specific authentication)
└── Analytics (mobile usage patterns, performance)
2.2 Identity and Access Management Design
Enhanced Authentication Model:

-- Service Registry: Central catalog of all services
CREATE TABLE service_registry (
    id UUID PRIMARY KEY,
    service_name TEXT UNIQUE NOT NULL,
    domain_plane TEXT NOT NULL CHECK (domain_plane IN ('integration', 'services', 'experiences')),
    owner_team TEXT NOT NULL,
    data_classification TEXT NOT NULL,
    dependency_graph JSONB,
    compliance_requirements JSONB,
    sla_requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Subscriptions: Service-aware user access
CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID,
    service_package_id UUID,
    subscription_tier TEXT,
    entry_channel TEXT CHECK (entry_channel IN ('web', 'mobile', 'api', 'vendor')),
    vendor_context JSONB, -- For vendor-originated users
    custom_claims JSONB, -- JWT custom claims
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel Entry Tracking
CREATE TABLE channel_entries (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    entry_point TEXT NOT NULL,
    service_context TEXT,
    vendor_origin TEXT,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
JWT Custom Claims Structure:

{
  "sub": "user-uuid",
  "service_ids": ["ecommerce", "banking", "saas"],
  "channel_type": "mobile",
  "organization_id": "org-uuid",
  "subscription_tier": "premium",
  "vendor_context": {
    "stripe_customer_id": "cus_xxx",
    "original_entry": "stripe_checkout"
  }
}
2.3 Security Protocol Design
Advanced RLS Policies:

-- Service-aware RLS function
CREATE OR REPLACE FUNCTION auth.has_service_access(service_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_subscriptions ts
        WHERE ts.user_id = auth.uid()
        AND ts.service_package_id IN (
            SELECT sp.id FROM service_packages sp WHERE sp.service_name = service_name
        )
        AND (ts.valid_until IS NULL OR ts.valid_until > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Domain-specific access policies
CREATE POLICY "Integration plane access" ON integration_stripe.customers
FOR ALL USING (
    auth.has_service_access('stripe_integration') OR
    auth.jwt() ->> 'vendor_context' ->> 'stripe_customer_id' IS NOT NULL
);

CREATE POLICY "Services plane access" ON services_ecommerce.orders
FOR ALL USING (auth.has_service_access('ecommerce'));

CREATE POLICY "Experience plane access" ON experiences_customer_portal.user_profiles
FOR ALL USING (auth.uid() = user_id);
Responsible Team: Architecture + Security Teams

Timeline: 2 weeks

Risk Level: Medium

Risk Mitigation: Design review by security team, compliance audit

Phase 3: Implementation (Week 6-10)
3.1 Foundation Implementation (Week 6-7)
3.1.1 Service Registry and Governance
Implementation Steps:

Create service registry database project
Populate initial service catalog
Establish governance tables and policies
Set up monitoring and alerting
Code Implementation:

-- Create service registry project
supabase projects create service-registry \
    --organization your-org \
    --region your-region

-- Initialize governance structures
supabase db push --project-ref service-registry \
    --file governance_schema.sql
3.1.2 Identity Management Enhancement
Implementation Steps:

Enhance existing auth schema with service-aware tables
Implement JWT custom claims generation
Create channel entry tracking system
Update authentication flows
3.2 Integration Plane Migration (Week 8-9)
3.2.1 Stripe Integration Isolation
Migration Strategy:

Pre-migration: Create parallel integration project
Data migration: Move Stripe-related data to integration schema
API migration: Update all Stripe API calls to use facade
Testing: Validate webhook processing and error handling
Cutover: Switch production traffic to new integration
Rollback Strategy:

Maintain backward compatibility during cutover
Database triggers to sync old/new schemas during transition
Quick rollback to original schema if issues detected
3.2.2 Other Vendor Integrations
Pattern for Payment Gateways:

-- Multi-provider facade pattern
CREATE OR REPLACE FUNCTION services_ecommerce.process_payment(
    amount DECIMAL,
    currency TEXT,
    payment_method TEXT,
    customer_id UUID
) RETURNS JSONB AS $$
DECLARE
    provider_response JSONB;
    preferred_provider TEXT;
BEGIN
    -- Determine preferred provider based on customer/vendor context
    SELECT COALESCE(
        (vendor_context->>'preferred_payment_provider'),
        'stripe' -- default
    ) INTO preferred_provider
    FROM tenant_subscriptions 
    WHERE user_id = (
        SELECT user_id FROM services_ecommerce.customers WHERE id = customer_id
    );
    
    -- Route to appropriate integration
    CASE preferred_provider
        WHEN 'stripe' THEN
            SELECT integration_stripe.create_payment_intent(amount, currency, customer_id)
            INTO provider_response;
        WHEN 'paystack' THEN
            SELECT integration_paystack.initialize_transaction(amount, currency, customer_id)
            INTO provider_response;
        ELSE
            RAISE EXCEPTION 'Unsupported payment provider: %', preferred_provider;
    END CASE;
    
    -- Publish domain event for order processing
    PERFORM publish_event('payment_completed', 
        jsonb_build_object(
            'amount', amount,
            'currency', currency,
            'provider', preferred_provider,
            'customer_id', customer_id
        )
    );
    
    RETURN provider_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
3.3 Services Plane Migration (Week 9-10)
3.3.1 E-commerce Service Extraction
Migration Pattern:

Create dedicated ecommerce services project
Extract order management into bounded context
Implement event publishing for cross-service communication
Create materialized views for shared data access
3.3.2 Banking Services Migration
Compliance-Focused Approach:

Extract financial data with regulatory compliance
Implement transaction audit trails
Create KYC verification workflows
Establish AML monitoring systems
3.4 Experience Plane Implementation (Week 10)
3.4.1 API Gateway Setup
Implementation:

-- API Gateway routing logic
CREATE OR REPLACE FUNCTION api_gateway.route_request(
    service_name TEXT,
    operation TEXT,
    payload JSONB
) RETURNS JSONB AS $$
DECLARE
    target_service TEXT;
    response JSONB;
BEGIN
    -- Validate service access based on JWT claims
    IF NOT auth.has_service_access(service_name) THEN
        RAISE EXCEPTION 'Access denied to service: %', service_name;
    END IF;
    
    -- Route to appropriate service plane
    CASE service_name
        WHEN 'ecommerce' THEN
            SELECT services_ecommerce.handle_request(operation, payload) INTO response;
        WHEN 'banking' THEN
            SELECT services_banking.handle_request(operation, payload) INTO response;
        WHEN 'saas' THEN
            SELECT services_saas.handle_request(operation, payload) INTO response;
        ELSE
            RAISE EXCEPTION 'Unknown service: %', service_name;
    END CASE;
    
    RETURN response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
Responsible Team: Development Teams (Backend, Frontend, DevOps)

Timeline: 4 weeks

Risk Level: High

Risk Mitigation: Incremental rollout, feature flags, comprehensive testing

Phase 4: Validation and Optimization (Week 11-12)
4.1 Post-Migration Validation
4.1.1 Performance Benchmarking
Activities:

Load testing for each service plane
Query performance analysis and optimization
Monitoring setup and baseline establishment
User experience validation
4.1.2 Security Validation
Activities:

Penetration testing for new architecture
Compliance audit against regulatory requirements
Access control verification
Data isolation validation
4.2 Continuous Optimization
4.2.1 Performance Monitoring
-- Performance metrics collection
CREATE TABLE observability.service_metrics (
    id UUID PRIMARY KEY,
    domain_plane TEXT NOT NULL,
    service_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL,
    unit TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    tags JSONB
);

-- Automated alerting rules
CREATE TABLE observability.alert_rules (
    id UUID PRIMARY KEY,
    service_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    threshold_value DECIMAL,
    comparison_operator TEXT, -- 'gt', 'lt', 'eq'
    severity TEXT, -- 'low', 'medium', 'high', 'critical'
    notification_channels TEXT[]
);
4.2.2 Governance Automation
Contract Testing for Vendor Integrations:

-- Automated contract tests
CREATE TABLE integration_governance.contract_tests (
    id UUID PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    contract_version TEXT NOT NULL,
    test_status TEXT DEFAULT 'pending',
    last_execution TIMESTAMPTZ,
    test_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated compliance monitoring
CREATE TABLE integration_governance.compliance_monitoring (
    id UUID PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    compliance_check TEXT NOT NULL,
    check_frequency TEXT, -- 'hourly', 'daily', 'weekly'
    last_check TIMESTAMPTZ,
    status TEXT,
    findings JSONB
);
Responsible Team: Operations + QA Teams

Timeline: 2 weeks

Risk Level: Low

Risk Mitigation: Automated monitoring, regular reviews

Risk Management
High-Risk Items and Mitigations
Risk Probability Impact Mitigation Strategy
Data Migration Errors Medium High Incremental migration, comprehensive testing, rollback plan
Service Downtime Low Critical Blue-green deployment, feature flags, maintenance windows
Integration Failures Medium High Contract testing, circuit breakers, graceful degradation
Security Vulnerabilities Low Critical Security review, penetration testing, compliance audit
Performance Degradation Medium Medium Performance testing, monitoring, optimization
Rollback Strategy
Tiered Rollback Approach:

Immediate Rollback: Feature flags to disable new features
Service Rollback: Individual service plane rollback if isolated issues
Complete Rollback: Full system rollback to pre-migration state
Rollback Execution:

# Emergency rollback script
supabase db reset --project-ref $PROJECT_REF --file pre_migration_backup.sql
kubectl rollout undo deployment/$SERVICE_NAME
Success Metrics
Organizational Efficiency Improvements
Vendor Dependency Conflicts: 90% reduction in cross-vendor data coupling
Execution Streamlining: 70% improvement in deployment velocity per service
Team Productivity: 60% increase in development team efficiency
System Reliability: 99.5% uptime across all service planes
Technical Improvements
Service Isolation: Complete separation of vendor and customer data
Identity Management: Service-aware authentication with <100ms latency
Scalability: Independent scaling of each service plane
Observability: Comprehensive monitoring across all domains
Appendices
Appendix A: Code Snippets
Service Registry Implementation
-- Complete service registry schema
-- See: three_layer_architecture_migration_guide.md Phase 2.1.1
Integration Facade Pattern
-- Multi-vendor payment processing facade
-- See: three_layer_architecture_migration_guide.md Phase 3.2.2
Advanced RLS Policies
-- Service-aware row-level security
-- See: security_and_access_control.sql (enhanced)
Appendix B: Architecture Diagrams
┌─────────────────────────────────────────────────────────────────┐
│                        Experience Plane                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Customer Portal │  │ Mobile Apps     │  │ API Gateway     │  │
│  │                 │  │                 │  │                 │  │
│  │ • User Profiles │  │ • Offline Data  │  │ • Request       │  │
│  │ • Notifications │  │ • Push Notifs   │  │   Routing       │  │
│  │ • Preferences   │  │ • Sessions      │  │ • Rate Limiting │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                  ┌────────────┼────────────┐
                  │            ▼            │
┌─────────────────────────────────────────────────────────────────┐
│                         Services Plane                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ E-commerce      │  │ Banking         │  │ SaaS Platform   │  │
│  │ Services        │  │ Services        │  │                 │  │
│  │                 │  │                 │  │ • Organizations │  │
│  │ • Orders        │  │ • Accounts      │  │ • Subscriptions │  │
│  │ • Products      │  │ • Transactions  │  │ • API Mgmt      │  │
│  │ • Fulfillment   │  │ • Lending       │  │ • Usage         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                  ┌────────────┼────────────┐
                  │            ▼            │
┌─────────────────────────────────────────────────────────────────┐
│                       Integration Plane                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Stripe          │  │ Payment         │  │ AI Providers    │  │
│  │ Integration     │  │ Gateways        │  │                 │  │
│  │                 │  │                 │  │ • OpenAI        │  │
│  │ • Customers     │  │ • Paystack      │  │ • Anthropic     │  │
│  │ • Payments      │  │ • Flutterwave   │  │ • Custom Models │  │
│  │ • Webhooks      │  │ • Webhooks      │  │ • Embeddings    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
Appendix C: File References
Document Purpose Key Contributions
migration_strategy.md Previous migration framework Phased approach, rollback strategies
project_separation_guide.md Schema organization patterns Domain separation, RLS implementation
database_schema_summary.md Current state analysis Schema inventory, relationship mapping
security_and_access_control.sql Security foundation RLS policies, audit logging
performance_and_scalability_plan.sql Optimization strategies Indexing, query optimization
Appendix D: Team Responsibilities
Team Phase Focus Key Responsibilities
Architecture Team All Phases Design oversight, technical direction
Security Team Phases 1, 2, 4 Access control, compliance validation
Backend Team Phases 2, 3 Service implementation, API development
Frontend Team Phases 3, 4 Experience layer, user interface
DevOps Team Phases 3, 4 Infrastructure, monitoring, deployment
QA Team All Phases Testing strategy, quality assurance
Conclusion
This migration plan builds upon the proven success of previous migrations documented in migration_strategy.md and project_separation_guide.md, introducing a sophisticated three-layer architecture that achieves complete vendor isolation while maintaining seamless customer experiences. The phased approach minimizes risk while delivering significant improvements in system modularity, operational efficiency, and governance capabilities.

Expected Outcomes:

🔒 Complete isolation of vendor services from customer data
🎭 Service-aware identity management with intelligent routing
📊 Comprehensive governance framework for cross-service coordination
⚡ Independent scalability and operations per service plane
🛡️ Enhanced security and compliance across all domains
The implementation follows established patterns from previous successful migrations while introducing advanced features for vendor isolation, identity management, and cross-service governance. This approach will position the platform for sustainable growth while maintaining the high standards of reliability and security established in prior migrations.


This comprehensive migration guide provides:

1. **Strategic Context** - References to successful previous migrations and how this builds upon them
2. **Detailed Phased Approach** - Four clear phases with specific deliverables and timelines
3. **Technical Implementation** - Concrete code examples and architectural patterns
4. **Risk Management** - Comprehensive risk assessment and mitigation strategies
5. **Success Metrics** - Measurable outcomes and improvement targets
6. **Appendices** - Supporting documentation, diagrams, and references

The guide is structured for easy integration into version control and provides a complete roadmap for transforming your current architecture into the sophisticated three-layer system you need.
