# Breathe ESG - Enterprise Data Ingestion Platform

A production-quality full-stack application for ingesting, normalizing, and reviewing ESG data from multiple corporate sources (SAP, Utility Portals, Corporate Travel) before audit submission.

**Status**: Complete working prototype with deployment support (Render/Railway)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Quick Start](#quick-start)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Data Flow](#data-flow)
7. [Key Design Decisions](#key-design-decisions)
8. [Running Locally](#running-locally)
9. [Deployment](#deployment)
10. [Known Limitations](#known-limitations)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│                    - Analyst Review Dashboard                    │
│                    - Upload Interface                            │
│                    - Approval Workflow                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API (DRF)
┌────────────────────────▼────────────────────────────────────────┐
│                  BACKEND (Django + DRF)                          │
├─────────────────────────────────────────────────────────────────┤
│  HTTP Layer:                                                    │
│  - UploadViewSet (SAP, Electricity, Travel)                     │
│  - RecordViewSet (read records)                                 │
│  - ReviewQueueViewSet (approval workflows)                      │
│  - AuditLogViewSet (audit trail)                                │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer:                                                 │
│  - SAPParser: CSV → Validation → Standardization                │
│  - UtilityParser: Electricity CSV parsing & kWh normalization   │
│  - TravelParser: Travel CSV parsing with distance flagging      │
│  - NormalizationService: Common format conversion               │
│  - AnomalyService: Anomaly detection & flagging                 │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer:                                                    │
│  - PostgreSQL database                                          │
│  - Multi-tenant data isolation                                  │
│  - Audit logging                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

**Data Ingestion Pipeline**
```
Raw File Upload
    ↓
Source-Specific Parser (SAP/Utility/Travel)
    ↓
Validation (required fields, format, ranges)
    ↓
Standardization (units, dates, codes)
    ↓
NormalizedEmissionRecord created
    ↓
Anomaly Detection
    ↓
ReviewQueue item created if flagged
    ↓
Analyst Review & Approval
    ↓
Audit Lock
```

---

## 📁 Project Structure

```
breathe-esg-project/
├── Backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/
│   │   ├── settings.py          # Django settings, secrets management
│   │   ├── urls.py              # URL routing
│   │   ├── wsgi.py              # WSGI application
│   │   └── asgi.py              # ASGI application
│   ├── apps/
│   │   ├── accounts/            # User, Company multi-tenancy
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   ├── permissions.py   # Tenant isolation
│   │   │   └── admin.py
│   │   ├── ingestion/           # Core data ingestion
│   │   │   ├── models.py        # DataSource, RawRecord, NormalizedEmissionRecord
│   │   │   ├── views.py         # UploadViewSet
│   │   │   ├── serializers.py
│   │   │   ├── permissions.py
│   │   │   └── admin.py
│   │   ├── parsers/             # Source-specific parsers
│   │   │   ├── sap_parser.py
│   │   │   ├── utility_parser.py
│   │   │   ├── travel_parser.py
│   │   │   └── base_parser.py
│   │   ├── normalization/       # Normalization and anomaly detection
│   │   │   ├── models.py        # ReviewQueue, AuditLog, PlantLookup
│   │   │   ├── services.py      # NormalizationService, AnomalyService
│   │   │   ├── views.py         # ReviewQueueViewSet, AuditLogViewSet
│   │   │   ├── serializers.py
│   │   │   ├── permissions.py
│   │   │   └── admin.py
│   │   └── core/
│   │       ├── models.py        # Base models, mixins
│   │       └── utils.py         # Shared utilities
│   ├── tests/
│   │   ├── test_sap_parser.py
│   │   ├── test_utility_parser.py
│   │   ├── test_travel_parser.py
│   │   ├── test_normalization.py
│   │   └── test_api.py
│   └── .gitignore
│
├── Frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── .env.example
│   ├── src/
│   │   ├── main.jsx             # Entry point
│   │   ├── App.jsx              # Root component
│   │   ├── api/
│   │   │   ├── client.js        # Axios client with auth
│   │   │   └── endpoints.js     # API endpoint definitions
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Main layout wrapper
│   │   │   ├── Navigation.jsx   # Top navigation
│   │   │   ├── Sidebar.jsx      # Sidebar navigation
│   │   │   ├── UploadForm.jsx   # CSV upload component
│   │   │   ├── RecordTable.jsx  # Record display table
│   │   │   ├── ReviewQueue.jsx  # Approval workflow
│   │   │   ├── AuditLog.jsx     # Audit trail display
│   │   │   ├── Filters.jsx      # Advanced filtering
│   │   │   └── Charts.jsx       # Dashboard charts
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── Upload.jsx       # Upload page
│   │   │   ├── Review.jsx       # Review workflow
│   │   │   └── Audit.jsx        # Audit trail
│   │   ├── hooks/
│   │   │   ├── useAuth.js       # Authentication hook
│   │   │   └── useApi.js        # API interaction hook
│   │   ├── styles/
│   │   │   ├── globals.css      # Global styles
│   │   │   └── theme.css        # Theme variables
│   │   └── utils/
│   │       ├── formatters.js    # Data formatting utilities
│   │       └── validators.js    # Input validation
│   └── .gitignore
│
├── SampleData/
│   ├── sap_export_sample.csv    # Example SAP export
│   ├── electricity_export_sample.csv
│   ├── travel_export_sample.csv
│   └── README_SAMPLES.md        # Sample data documentation
│
├── Docs/
│   ├── MODEL.md                 # Data model & design
│   ├── DECISIONS.md             # Architecture decisions
│   ├── TRADEOFFS.md             # Deliberate omissions
│   ├── SOURCES.md               # Source research & justification
│   ├── API_REFERENCE.md         # Complete API documentation
│   └── DEPLOYMENT.md            # Deployment guide
│
├── docker-compose.yml           # Local development environment
├── .env.example                 # Environment variables template
├── .gitignore
└── PROJECT_CHECKLIST.md         # Implementation checklist
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- PostgreSQL 13+
- Git

### 1. Clone & Setup Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure database
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### 2. Setup Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`
Backend API at `http://localhost:8000`

### 3. Load Sample Data (Optional)

```bash
python manage.py loaddata sample_data.json
```

---

## 🗄️ Database Schema

### Multi-Tenancy Foundation

All models include `company` foreign key to enforce tenant isolation.

### Core Models

**User & Company**
```
Company
  ├── id (UUID)
  ├── name (string)
  ├── created_at
  └── created_by (User)

User
  ├── id
  ├── email (unique per company)
  ├── company (FK Company)
  ├── role (ADMIN, ANALYST, VIEWER)
  └── is_active
```

**Data Ingestion**
```
DataSource
  ├── id (UUID)
  ├── company (FK Company)
  ├── source_type (SAP, ELECTRICITY, TRAVEL)
  ├── name
  ├── description
  └── created_at

RawRecord
  ├── id (UUID)
  ├── company (FK Company)
  ├── data_source (FK DataSource)
  ├── raw_data (JSONField) # Original upload data
  ├── file_name
  ├── row_number
  ├── uploaded_at
  └── processing_status (UPLOADED, PROCESSING, SUCCESS, FAILED)

NormalizedEmissionRecord
  ├── id (UUID)
  ├── company (FK Company)
  ├── raw_record (FK RawRecord)
  ├── source_type (SAP, ELECTRICITY, TRAVEL)
  ├── scope (1, 2, 3)
  ├── category (Fuel, Procurement, Electricity, Flight, Hotel, etc.)
  ├── facility_code
  ├── facility_name
  ├── quantity (Decimal)
  ├── unit (kg, kWh, km, etc.) # Standardized
  ├── quantity_standardized (Decimal) # Always in kg CO2e
  ├── date
  ├── vendor
  ├── notes
  ├── is_flagged
  ├── flag_reason (JSON)
  ├── created_at
  └── updated_at
```

**Review & Audit**
```
ReviewQueue
  ├── id (UUID)
  ├── company (FK Company)
  ├── normalized_record (FK NormalizedEmissionRecord)
  ├── reason_flagged (string)
  ├── severity (LOW, MEDIUM, HIGH)
  ├── status (PENDING, APPROVED, REJECTED)
  ├── reviewed_by (FK User, nullable)
  ├── reviewed_at (nullable)
  ├── reviewer_notes
  └── created_at

AuditLog
  ├── id (UUID)
  ├── company (FK Company)
  ├── record (FK NormalizedEmissionRecord)
  ├── action (CREATED, APPROVED, REJECTED, EDITED)
  ├── actor (FK User)
  ├── changes (JSONField) # What changed
  ├── timestamp
  └── ip_address

PlantLookup
  ├── id (UUID)
  ├── company (FK Company)
  ├── sap_plant_code
  ├── facility_name
  ├── facility_address
  ├── latitude
  ├── longitude
  ├── scope_1_applicable
  ├── scope_2_applicable
  └── scope_3_applicable
```

---

## 🔌 API Design

### Authentication
All endpoints require JWT token in `Authorization: Bearer <token>` header.

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Upload Endpoints

```
POST /api/upload/sap/
  Consumes: multipart/form-data (CSV file)
  Returns: {
    "upload_id": "uuid",
    "total_rows": 100,
    "successful": 95,
    "failed": 5,
    "flagged": 8,
    "processing_status": "PROCESSING"
  }

POST /api/upload/electricity/
  Same structure

POST /api/upload/travel/
  Same structure
```

### Data Retrieval

```
GET /api/records/
  Query params:
    - company_id (required)
    - source_type (SAP, ELECTRICITY, TRAVEL)
    - start_date
    - end_date
    - facility_code
    - is_flagged (true/false)
  
  Returns: Paginated list of NormalizedEmissionRecord

GET /api/records/{id}/
  Returns: Single record with audit history

GET /api/records/statistics/
  Returns: {
    "total_records": 1000,
    "by_source": {...},
    "by_scope": {...},
    "by_status": {...}
  }
```

### Review & Approval

```
GET /api/review-queue/
  Query params:
    - company_id
    - status (PENDING, APPROVED, REJECTED)
    - severity
  
  Returns: Paginated ReviewQueue items

PATCH /api/review-queue/{id}/approve/
  Body: {
    "reviewer_notes": "Data looks correct"
  }
  Returns: Updated ReviewQueue item

PATCH /api/review-queue/{id}/reject/
  Body: {
    "reason": "Insufficient documentation",
    "reviewer_notes": "Contact procurement"
  }
  Returns: Updated ReviewQueue item
```

### Audit Trail

```
GET /api/audit-log/
  Query params:
    - company_id
    - record_id
    - start_date
    - end_date
  
  Returns: Paginated AuditLog entries

GET /api/audit-log/export/
  Query params: same as above
  Returns: CSV export of audit log
```

---

## 📊 Data Flow

### Upload Flow (Detailed)

1. **File Upload**
   - User uploads CSV to `/api/upload/{source_type}/`
   - DRF validates: file type, size, encoding
   - Creates `DataSource` record if new
   - Creates `RawRecord` entries (one per CSV row)

2. **Parsing**
   - Source-specific parser reads `RawRecord.raw_data`
   - Validates required fields exist
   - Validates data types (dates, numbers, codes)
   - Validates value ranges (quantities > 0, etc.)
   - Returns: validation errors or parsed dict

3. **Standardization**
   - Convert dates to ISO format (YYYY-MM-DD)
   - Standardize units (L → liters, kg → kg, etc.)
   - Normalize quantities (all fuel to kg, all electricity to kWh)
   - Lookup facility codes in `PlantLookup`
   - Assign Scope (1/2/3) based on category

4. **Anomaly Detection**
   - Missing required fields → Flag as MEDIUM severity
   - Unusual quantities (> 99th percentile) → Flag as LOW severity
   - Negative quantities → Flag as HIGH severity
   - Missing travel distance → Flag as MEDIUM severity
   - Unknown units → Flag as HIGH severity

5. **Approval Workflow**
   - Create `ReviewQueue` entry for all flagged records
   - Analyst sees dashboard with pending items
   - Can approve (mark as APPROVED) or reject
   - Approved records move to audit lock

6. **Audit Lock**
   - After approval, `NormalizedEmissionRecord.is_locked = True`
   - Locked records cannot be edited
   - Full change history in `AuditLog`

---

## 🎯 Key Design Decisions

### Why CSV for All Three Sources?

**Decision**: All sources ingest via CSV upload (not PDF/API/portal scrape)

**Justification**:
1. **SAP**: Real enterprises export via CSV. IDoc/OData requires production SAP instance; CSV is enterprise-standard
2. **Utility**: Portal scrapes return CSVs. PDFs require OCR (expensive, error-prone)
3. **Travel**: Concur/Navan export CSVs. API integration requires vendor accounts (overkill for prototype)

**Tradeoff**: Real Concur integration skipped (defer to v2)

### Multi-Tenancy at Database Level

**Decision**: `company` FK on all data tables, checked via permissions

**Why not application-level isolation?**
- Database-level is safer (accidental joins can't leak data)
- Easier to audit (all queries include company filter)
- Simpler to test (run same tests for different companies)

### Normalized Records Separate from Raw

**Decision**: `RawRecord` stores original data; `NormalizedEmissionRecord` is computed

**Why?**
- Audit trail: can regenerate normalized records if rules change
- Debugging: can see what was uploaded vs what was parsed
- Compliance: original data immutable

### Standardized Unit System

**Decision**: All quantities standardized to kg CO₂e for storage

**How**: 
- Fuel (liters) → kg using density lookup
- Electricity (kWh) → kg CO₂e using grid-specific emission factor
- Travel (km) → kg CO₂e using distance + transport mode

**Why?**
- Simplifies downstream carbon calculations
- Unit confusion is #1 data error in ESG (address proactively)
- Analyst can see both original and normalized values

---

## 💻 Running Locally

### Using Docker Compose (Recommended)

```bash
docker-compose up
```

This starts:
- PostgreSQL on port 5432
- Django on port 8000
- React dev server on port 5173

### Manual Setup

**Backend**
```bash
cd Backend

# Create venv
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Database setup
export DATABASE_URL=postgres://user:password@localhost:5432/breathe_esg
python manage.py migrate
python manage.py createsuperuser

# Load sample data
python manage.py loaddata sample_data.json

# Start server
python manage.py runserver 0.0.0.0:8000
```

**Frontend**
```bash
cd Frontend

# Install
npm install

# Development
npm run dev
# Production build
npm run build
```

---



## ⚠️ Known Limitations

### By Design (Deliberate Omissions)

1. **No Real SAP Integration**: Skipped production SAP OData API
   - Reason: Would require SAP instance credentials; CSV simulates real export structure
   - Trade-off: Prototype uses sample CSV; production would add OData module

2. **No PDF Parsing**: Skipped utility bill PDF extraction
   - Reason: OCR adds complexity; most facilities teams export CSVs anyway
   - Trade-off: Accepts CSV; if PDF required, add OCR service later

3. **No Airport Geolocation**: Travel parser doesn't resolve airport codes to coordinates
   - Reason: Requires external API (significant latency); distance calculation uses straight-line km
   - Trade-off: Analyst can manually override if needed

### Technical Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| Single file upload limit 10MB | Large exports may fail | Add chunked upload in v2 |
| No schedule-based re-ingestion | Manual trigger only | Add Celery task queue in v2 |
| No data version control | Can't compare before/after | Add snapshot feature in v2 |
| Audit log pruning manual | Can grow unbounded | Add retention policy in v2 |
| No email notifications | Analysts must check dashboard | Add background tasks in v2 |

---

## 🔧 Troubleshooting

### "Database connection refused"
```bash
# Ensure PostgreSQL is running
psql -U postgres -h localhost
# Update .env DATABASE_URL with correct credentials
```

### "Module not found" errors
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### CORS errors in frontend
```bash
# Ensure Backend .env has:
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Migration errors
```bash
python manage.py migrate --fake-initial
python manage.py migrate
```

---

## 📚 Documentation

See `Docs/` directory:
- **MODEL.md** - Complete data model with ER diagram
- **DECISIONS.md** - Every ambiguity resolved with justification
- **TRADEOFFS.md** - Three deliberate omissions with reasoning
- **SOURCES.md** - Source research, real-world formats, sample data justification
- **API_REFERENCE.md** - Complete API specification
- **DEPLOYMENT.md** - Step-by-step deployment guide

---

## 👥 Support

For questions during setup:
1. Check `Docs/` first
2. Review test files for usage examples
3. Check `.env.example` for required variables
4. Review Django/React error messages (usually helpful!)

---

## 📄 License

Internal use. Do not distribute.

---
