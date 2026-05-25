# Breathe ESG Implementation Checklist

## Phase 1: Core Infrastructure ✓

### Backend Setup
- [x] Django project structure
- [x] PostgreSQL database configuration
- [x] Custom User model with UUID
- [x] Multi-tenancy base models (Company, User)
- [x] Settings with environment variables
- [x] Logging configuration

### Data Models
- [x] Core models (Company, User, DataSource)
- [x] Ingestion models (RawRecord)
- [x] Normalization models (NormalizedEmissionRecord, ReviewQueue, AuditLog, PlantLookup)
- [x] All model relationships verified
- [x] Audit trail support
- [x] Multi-tenancy enforcement

### Parser Framework
- [x] BaseParser abstract class
- [x] Validation utilities
- [x] Standardization utilities
- [x] Anomaly detection base

## Phase 2: Source-Specific Parsers ⚠️ (Partial)

### SAP Parser
- [x] SAPParser class with _parse_impl
- [x] Header normalization (English + German)
- [x] Quantity validation
- [x] Date parsing (multiple formats)
- [x] Unit standardization
- [x] Document type classification
- [x] Scope/category assignment
- [x] Anomaly detection
- [ ] **TODO**: Full integration with upload endpoint
- [ ] **TODO**: Error handling & edge cases
- [ ] **TODO**: Unit tests

### Electricity Parser
- [ ] **TODO**: UtilityParser class
- [ ] **TODO**: kWh normalization
- [ ] **TODO**: Billing period handling
- [ ] **TODO**: Tariff type support
- [ ] **TODO**: Missing value flags

### Travel Parser
- [ ] **TODO**: TravelParser class
- [ ] **TODO**: Multi-modal transport handling
- [ ] **TODO**: Distance validation
- [ ] **TODO**: Airport code support
- [ ] **TODO**: Hotel nights support

## Phase 3: API Endpoints ⚠️ (Skeleton)

### Upload Endpoints
- [ ] **TODO**: POST /api/upload/sap/
- [ ] **TODO**: POST /api/upload/electricity/
- [ ] **TODO**: POST /api/upload/travel/
- [ ] **TODO**: File validation
- [ ] **TODO**: CSV parsing
- [ ] **TODO**: Error response handling

### Record Endpoints
- [ ] **TODO**: GET /api/records/ (paginated, filtered)
- [ ] **TODO**: GET /api/records/{id}/
- [ ] **TODO**: GET /api/records/statistics/
- [ ] **TODO**: Serializers
- [ ] **TODO**: Permissions

### Review & Approval
- [ ] **TODO**: GET /api/review-queue/ (pending items)
- [ ] **TODO**: PATCH /api/review-queue/{id}/approve/
- [ ] **TODO**: PATCH /api/review-queue/{id}/reject/
- [ ] **TODO**: Serializers
- [ ] **TODO**: Permissions

### Audit Trail
- [ ] **TODO**: GET /api/audit-log/
- [ ] **TODO**: Filtering (by record, date, action)
- [ ] **TODO**: CSV export

### Authentication
- [ ] **TODO**: POST /api/auth/login/
- [ ] **TODO**: POST /api/auth/logout/
- [ ] **TODO**: JWT token refresh
- [ ] **TODO**: Token validation

## Phase 4: Frontend Components ⚠️ (Not Started)

### Layout & Navigation
- [ ] **TODO**: Main Layout component
- [ ] **TODO**: Sidebar navigation
- [ ] **TODO**: Top navigation bar
- [ ] **TODO**: User menu
- [ ] **TODO**: Auth state management

### Upload Interface
- [ ] **TODO**: UploadForm component
- [ ] **TODO**: CSV file picker
- [ ] **TODO**: Source type selection
- [ ] **TODO**: Progress indication
- [ ] **TODO**: Success/error messages

### Dashboard
- [ ] **TODO**: Dashboard page
- [ ] **TODO**: Statistics cards
- [ ] **TODO**: Recent uploads list
- [ ] **TODO**: Charts (by source, by scope)
- [ ] **TODO**: Quick filters

### Review Workflow
- [ ] **TODO**: ReviewQueue page
- [ ] **TODO**: Flagged records table
- [ ] **TODO**: Severity indicators
- [ ] **TODO**: Approve/reject buttons
- [ ] **TODO**: Reviewer notes input

### Audit Log
- [ ] **TODO**: AuditLog page
- [ ] **TODO**: Action timeline
- [ ] **TODO**: Change diff display
- [ ] **TODO**: Export to CSV

### Record Viewer
- [ ] **TODO**: RecordTable component
- [ ] **TODO**: Column selection
- [ ] **TODO**: Sorting/filtering
- [ ] **TODO**: Pagination
- [ ] **TODO**: Raw vs normalized view

### Filters & Search
- [ ] **TODO**: Advanced filter panel
- [ ] **TODO**: Date range picker
- [ ] **TODO**: Source type filter
- [ ] **TODO**: Facility code filter
- [ ] **TODO**: Flagged/approved filter
- [ ] **TODO**: Search by text

## Phase 5: Integration Testing ⚠️ (Not Started)

### Backend Tests
- [ ] **TODO**: test_sap_parser.py (happy path, edge cases)
- [ ] **TODO**: test_utility_parser.py
- [ ] **TODO**: test_travel_parser.py
- [ ] **TODO**: test_normalization.py
- [ ] **TODO**: test_anomaly_detection.py
- [ ] **TODO**: test_api.py (upload, review, audit)
- [ ] **TODO**: test_multi_tenancy.py
- [ ] **TODO**: Coverage target: 80%+

### Frontend Tests
- [ ] **TODO**: Component tests (Vitest)
- [ ] **TODO**: Integration tests
- [ ] **TODO**: E2E tests (Cypress/Playwright)

### Data Flow Tests
- [ ] **TODO**: End-to-end upload → parse → normalize → review → approve
- [ ] **TODO**: Multi-tenancy isolation
- [ ] **TODO**: Audit trail integrity

## Phase 6: Deployment ⚠️ (Not Started)

### Backend Deployment (Render)
- [ ] **TODO**: Dockerfile verification
- [ ] **TODO**: Environment variables setup
- [ ] **TODO**: PostgreSQL add-on provisioning
- [ ] **TODO**: Run migrations post-deploy
- [ ] **TODO**: Static files collection
- [ ] **TODO**: Health check endpoint
- [ ] **TODO**: Error monitoring (Sentry)

### Frontend Deployment
- [ ] **TODO**: Vercel deployment OR Render static site
- [ ] **TODO**: Build optimization
- [ ] **TODO**: Environment variable injection
- [ ] **TODO**: CORS configuration

### Database
- [ ] **TODO**: Migrations created & tested
- [ ] **TODO**: Backup strategy
- [ ] **TODO**: Connection pooling
- [ ] **TODO**: Monitoring

## Phase 7: Documentation ✓

### Completed
- [x] README.md (comprehensive, with setup instructions)
- [x] MODEL.md (data model with ER diagram, decisions)
- [x] DECISIONS.md (architecture decisions & justifications)
- [x] TRADEOFFS.md (three deliberate omissions)
- [x] SOURCES.md (source research & sample data justification)

### TODO
- [ ] **TODO**: API_REFERENCE.md (complete endpoint documentation)
- [ ] **TODO**: DEPLOYMENT.md (step-by-step deployment guide)
- [ ] **TODO**: DEVELOPMENT.md (local setup for developers)
- [ ] **TODO**: TROUBLESHOOTING.md (common issues & fixes)

## Phase 8: Sample Data ✓

- [x] sap_export_sample.csv
- [x] electricity_export_sample.csv
- [x] travel_export_sample.csv
- [ ] **TODO**: Management command to load sample data
- [ ] **TODO**: Sample PlantLookup data

## Phase 9: DevOps & CI/CD

- [ ] **TODO**: GitHub Actions workflow
- [ ] **TODO**: Automated testing on push
- [ ] **TODO**: Build & deploy on main branch
- [ ] **TODO**: Pre-deployment checks
- [ ] **TODO**: Database migration safety

## Phase 10: Security & Compliance

- [ ] **TODO**: CORS configuration
- [ ] **TODO**: CSRF protection
- [ ] **TODO**: SQL injection prevention (ORM usage)
- [ ] **TODO**: XSS prevention (React escaping)
- [ ] **TODO**: Rate limiting
- [ ] **TODO**: Input validation
- [ ] **TODO**: Permission checks
- [ ] **TODO**: Audit log retention policy

## Critical Path to MVP

### Must Have (Week 1)
1. ✓ Data models (all tables)
2. ✓ BaseParser + SAPParser
3. [ ] POST /api/upload/sap/ endpoint
4. [ ] CSV parsing pipeline
5. [ ] NormalizedEmissionRecord creation
6. [ ] ReviewQueue population
7. [ ] Basic React dashboard

### Should Have (Week 2)
8. [ ] Electricity & Travel parsers
9. [ ] Review approval workflow
10. [ ] Audit log
11. [ ] Advanced filtering
12. [ ] Deployment to Render

### Nice to Have (Week 3)
13. [ ] Charts & analytics
14. [ ] Bulk operations
15. [ ] Export functionality
16. [ ] Email notifications

## Current Status

**Completed**: 45% (Core models, parsers, documentation)
**In Progress**: Data model validation, API skeleton
**Blocked**: API endpoints require upload handler
**Not Started**: Frontend components, deployment, testing

## Next Actions (Priority Order)

1. **IMMEDIATE**: Create upload endpoints (POST /api/upload/sap/)
   - File handling
   - CSV parsing
   - RawRecord creation
   - Error handling
   - Status: 0%

2. **HIGH**: Complete SAPParser + test
   - Unit tests for all edge cases
   - German header handling
   - Unit conversion
   - Status: 60% (class exists, needs integration)

3. **HIGH**: Create Electricity & Travel parsers
   - Status: 0%

4. **HIGH**: Create ReviewQueue workflow
   - GET pending items
   - PATCH approve/reject
   - Status: 0%

5. **MEDIUM**: React components
   - Upload form
   - Dashboard
   - Review queue
   - Status: 0%

6. **MEDIUM**: Deploy to Render
   - Status: 0%

## Known Issues

- [ ] Transaction handling for atomic create (record + audit log)
- [ ] Large file handling (>100MB) - needs chunking
- [ ] Concurrent upload handling
- [ ] PlantLookup auto-population from SAP export

## Testing Metrics

- [ ] Parser unit tests: 0/3 complete
- [ ] API integration tests: 0/5 complete
- [ ] Frontend component tests: 0/8 complete
- [ ] E2E tests: 0/3 complete
- [ ] Coverage: Target 80%

## Deployment Readiness

- [ ] Backend deployable? NO (no upload endpoint yet)
- [ ] Frontend buildable? NO (components not started)
- [ ] Database migrations? YES (created)
- [ ] Documentation complete? YES (core docs done)
- [ ] Can run locally? PARTIAL (models work, API not tested)

---

**Last Updated**: 2024-02-24
**Completed**: 55 story points
**Remaining**: 45 story points
**Estimated Time to MVP**: 1 week (with full team)
