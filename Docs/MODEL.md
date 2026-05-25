# Data Model Architecture

**Status**: Production-ready
**Multi-Tenancy**: Database-level enforcement
**Audit Trail**: Complete change history
**Scope Support**: GHG Protocol Scope 1/2/3

---

## Executive Summary

The Breathe ESG data model is designed around three core principles:

1. **Single Source of Truth**: Raw data immutable, computed fields regenerable
2. **Multi-Tenant Isolation**: Company FK on all tables + permission enforcement
3. **Compliance-First**: Every change logged, audit trail intact, locked records immutable

This document explains WHY each model exists and HOW relationships enable the business logic.

---

## Core Models

### 1. Company

```sql
Company {
  id: UUID PRIMARY KEY
  name: String (unique, 255 chars)
  email_domain: String (255 chars, optional)
  is_active: Boolean (default: true)
  created_by: FK User (nullable)
  created_at: DateTime (auto)
  updated_at: DateTime (auto)
}
```

**Why?**
- Top-level tenant identifier
- All data belongs to exactly one Company
- Enables per-company analytics, compliance, and billing

**Key Decisions**:
- UUID primary key: prevents ID enumeration attacks
- `is_active` soft delete: data never physically deleted
- `email_domain`: optional hint for SSO/user auto-provisioning

**Relationships**:
- `users` (1:N) - Users who belong to this company
- `data_sources` (1:N) - Sources this company ingests from
- `raw_records` (1:N) - All uploaded data
- `normalized_records` (1:N) - All processed data

---

### 2. User

```sql
User {
  id: UUID PRIMARY KEY
  email: String (unique across system)
  first_name: String (150 chars, optional)
  last_name: String (150 chars, optional)
  company: FK Company (NOT NULL)
  role: Enum (ADMIN, ANALYST, VIEWER)
  is_staff: Boolean (default: false)
  is_active: Boolean (default: true)
  password_hash: String (auto from AbstractBaseUser)
  created_at: DateTime (auto)
  updated_at: DateTime (auto)
}

Unique Constraints:
- (email) globally unique
- (email, company) NOT enforced (email unique globally)
```

**Why?**
- Custom user model supports UUID + company field
- Role-based access control (RBAC)
- Multi-company users possible (different emails, typically)

**Roles**:
- **ADMIN**: Create users, manage data sources, see audit logs
- **ANALYST**: Upload files, approve/reject records
- **VIEWER**: Read-only access to dashboards

**Relationships**:
- `company` (N:1) - Which company this user belongs to
- `reviewed_items` (1:N) - Records they approved/rejected
- `actions_performed` (1:N) - AuditLog entries they created

---

### 3. DataSource

```sql
DataSource {
  id: UUID PRIMARY KEY
  company: FK Company (NOT NULL)
  source_type: Enum (SAP, ELECTRICITY, TRAVEL)
  name: String (255 chars)
  description: Text (optional)
  last_sync: DateTime (nullable)
  is_active: Boolean (default: true)
  created_at: DateTime (auto)
  updated_at: DateTime (auto)
}

Unique Constraints:
- (company, source_type, name)
```

**Why?**
- Metadata about external data sources
- Track what's been synced and when
- Allow multiple sources of same type (multiple SAP instances, multiple building electricity)

**Example**:
```
Company: Acme Inc
├─ SAP01 (source_type: SAP, last_sync: 2024-02-15)
├─ SAP02 (source_type: SAP, last_sync: 2024-02-14)
├─ Building_C_Electricity (source_type: ELECTRICITY, last_sync: 2024-02-20)
└─ CorporateTravel (source_type: TRAVEL, last_sync: 2024-02-18)
```

**Relationships**:
- `company` (N:1)
- `raw_records` (1:N) - Rows uploaded from this source

---

### 4. RawRecord

```sql
RawRecord {
  id: UUID PRIMARY KEY
  company: FK Company (NOT NULL)
  data_source: FK DataSource (NOT NULL)
  raw_data: JSONField (stored as-is)
  file_name: String (255 chars)
  row_number: Integer (1-indexed)
  processing_status: Enum (
    UPLOADED,      -- received
    PROCESSING,    -- being parsed
    SUCCESS,       -- parsed & normalized
    FAILED         -- error during parsing
  )
  error_message: Text (only if FAILED)
  created_at: DateTime (auto)
  updated_at: DateTime (auto)
}

Unique Constraints:
- (data_source, file_name, row_number)
```

**Why?**
- **Immutability**: Original data never modified, enables audit trail
- **Regeneration**: Can re-parse with improved parsing rules
- **Debugging**: Can see exactly what was uploaded
- **Compliance**: Prove data source integrity

**Example JSON**:
```json
{
  "PlantCode": "PL001",
  "Material": "Diesel Fuel",
  "Quantity": "1500.00",
  "Unit": "L",
  "Date": "2024-01-15",
  "DocumentType": "FUEL",
  "Vendor": "Shell Germany"
}
```

**Processing Status Flow**:
```
UPLOADED → PROCESSING → SUCCESS ✓
                    ↓
                   FAILED ✗
```

**Relationships**:
- `company` (N:1)
- `data_source` (N:1)
- `normalized_record` (1:1, optional) - Links to computed version

---

### 5. NormalizedEmissionRecord

```sql
NormalizedEmissionRecord {
  id: UUID PRIMARY KEY
  company: FK Company (NOT NULL)
  raw_record: FK RawRecord (1:1, NOT NULL)
  
  # Source tracking
  source_type: Enum (SAP, ELECTRICITY, TRAVEL)
  
  # GHG Protocol classification
  scope: Enum (1, 2, 3)
  category: Enum (fuel_diesel, electricity_grid, travel_flight, etc.)
  
  # Facility information
  facility_code: String (50 chars) - SAP code or meter ID
  facility_name: String (255 chars, optional) - Looked up from PlantLookup
  
  # Quantity (original)
  quantity: Decimal(18, 4)
  unit: String (20 chars) - standardized: L, kWh, km, etc.
  
  # Quantity (standardized)
  quantity_standardized: Decimal(18, 4) - ALWAYS in kg CO2e
  
  # Temporal
  date: Date (indexed)
  
  # Additional context
  vendor: String (255 chars, optional)
  notes: Text (optional)
  
  # Quality flags
  is_flagged: Boolean (indexed)
  flag_reason: JSONField - {reason: detail}
  
  # Audit lock
  is_locked: Boolean - Once approved, cannot edit
  
  created_at: DateTime (auto)
  updated_at: DateTime (auto)
}

Unique Constraints: None (multiple records per facility per day possible)

Indexes:
- (company, is_flagged) - Find pending review
- (company, date) - Time-series queries
- (company, scope) - Scope-based reporting
- (company, facility_code) - Facility reports
- is_locked - Find audit-locked records
```

**Why This Structure?**

The separation of `quantity` (original) and `quantity_standardized` (kg CO2e) is crucial:

```
Scenario: Upload 5000 L diesel fuel

Raw:        5000 L
Parsed:     quantity=5000, unit="L"
Normalized: 
  - quantity=5000, unit="L" (for reference)
  - quantity_standardized=13400 (kg CO2e, using emission factor 2.68)

Benefits:
1. Audit trail: can see original units
2. Debugging: if emission factor changes, can regenerate
3. Analysis: all records in same units for aggregation
```

**Scope & Category Mapping**:

| Scope | Categories | Example |
|-------|-----------|---------|
| 1 | fuel_gasoline, fuel_diesel, fuel_natural_gas, fuel_lpg | Burning fuel at facility |
| 2 | electricity_grid, steam_heating, steam_cooling | Purchased electricity, steam |
| 3 | travel_flight, travel_hotel, travel_ground, commuting, waste, procurement_goods | Business travel, employee commuting |

**Flag Reasons** (JSONField):
```json
{
  "missing_distance": "Travel record missing distance",
  "high_consumption": "Consumption is 150% above facility average",
  "unusual_unit": "Unit 'metric_tons' not standard for this category",
  "negative_quantity": "Quantity is -500"
}
```

**Relationships**:
- `company` (N:1)
- `raw_record` (1:1)
- `review_queue_item` (1:1, optional)
- `audit_logs` (1:N) - Change history

---

### 6. ReviewQueue

```sql
ReviewQueue {
  id: UUID PRIMARY KEY
  company: FK Company (NOT NULL)
  normalized_record: FK NormalizedEmissionRecord (1:1)
  
  # What needs review
  reason_flagged: String (255 chars)
  severity: Enum (LOW, MEDIUM, HIGH)
  
  # Review status
  status: Enum (PENDING, APPROVED, REJECTED)
  reviewed_by: FK User (nullable)
  reviewed_at: DateTime (nullable)
  reviewer_notes: Text (optional)
  
  created_at: DateTime (auto)
  updated_at: DateTime (auto)
}

Unique Constraints:
- (normalized_record) - Only one review entry per record

Indexes:
- (company, status) - Find pending reviews
- (company, severity) - Prioritize high-severity items
- (status, created_at) - Age of pending reviews
```

**Why?**
- Separates flagging from approval
- Provides analyst workflow dashboard
- Tracks who approved/rejected and when

**Status Flow**:
```
PENDING (awaiting review)
  ├→ APPROVED (locked record, can't edit)
  └→ REJECTED (can re-upload/edit)
```

**Severity Guide**:
- **LOW**: Data quality concern, but low impact (e.g., > 95th percentile consumption)
- **MEDIUM**: Missing optional field, inconsistent formatting
- **HIGH**: Missing critical field, negative values, invalid unit

**Relationships**:
- `company` (N:1)
- `normalized_record` (1:1)
- `reviewed_by` (N:1, FK User)

---

### 7. AuditLog

```sql
AuditLog {
  id: UUID PRIMARY KEY
  company: FK Company (NOT NULL)
  record: FK NormalizedEmissionRecord
  
  # Action details
  action: Enum (CREATED, APPROVED, REJECTED, EDITED, LOCKED)
  actor: FK User (nullable) - Who did it
  changes: JSONField - What changed
  
  # Security
  ip_address: GenericIPAddressField (optional)
  
  # Timing
  created_at: DateTime (auto) - When it happened
}

Indexes:
- (record, -created_at) - Timeline for one record
- (company, action) - Track actions by type
- (actor) - Track user's actions
```

**Why?**
- Non-repudiation: prove who did what when
- Compliance: demonstrates audit trail for regulators
- Debugging: rollback capability if needed
- Analytics: track approval workflows

**Example Entries**:

```json
{
  "action": "CREATED",
  "actor": "analyst@company.com",
  "changes": {},
  "timestamp": "2024-02-15T10:30:00Z"
}

{
  "action": "EDITED",
  "actor": "analyst@company.com",
  "changes": {
    "quantity": {"old": "5000", "new": "5100"},
    "notes": {"old": "", "new": "Corrected reading"}
  },
  "timestamp": "2024-02-15T11:00:00Z"
}

{
  "action": "APPROVED",
  "actor": "manager@company.com",
  "changes": {
    "is_locked": {"old": false, "new": true}
  },
  "timestamp": "2024-02-15T14:30:00Z"
}
```

---

### 8. PlantLookup

```sql
PlantLookup {
  id: UUID PRIMARY KEY
  company: FK Company (NOT NULL)
  
  # Plant identification
  sap_plant_code: String (50 chars) - e.g., "PL001", "FA_BERLIN"
  facility_name: String (255 chars)
  facility_address: String (500 chars, optional)
  
  # Geolocation
  latitude: Float (optional)
  longitude: Float (optional)
  
  # GHG relevance
  scope_1_applicable: Boolean (default: true)
  scope_2_applicable: Boolean (default: true)
  scope_3_applicable: Boolean (default: true)
  
  created_at: DateTime (auto)
  updated_at: DateTime (auto)
}

Unique Constraints:
- (company, sap_plant_code)

Indexes:
- (company, sap_plant_code) - Code lookup
- facility_name - Free-text search
```

**Why?**
- SAP plant codes are opaque (PL001, WERK_02, etc.)
- Lookup table enriches records with facility names
- Tracks which scopes apply to each facility

**Usage During Normalization**:
```python
# Parser receives "PL001"
lookup = PlantLookup.objects.get(
    company=record.company,
    sap_plant_code="PL001"
)
normalized.facility_name = lookup.facility_name
normalized.latitude = lookup.latitude
normalized.longitude = lookup.longitude
```

---

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ COMPANY (root tenant)                                       │
│ - id (UUID, PK)                                             │
│ - name (unique)                                             │
│ - email_domain                                              │
│ - is_active                                                 │
└────────┬──────────────────────────────────────────────────┬─┘
         │ 1:N                                            1:N
         ▼                                                 ▼
    ┌──────────┐                                    ┌──────────────────┐
    │ USER     │◄─── N:1 ───┐                       │ DATASOURCE       │
    │ - id (PK)│            │                       │ - id (PK)        │
    │ - email  │            │                       │ - source_type    │
    │ - role   │      ┌─────┴──────────────┐        │ - name           │
    │ - company│      │ (REVIEWER)         │        │ - last_sync      │
    └──────┬───┘      │                    │        └────────┬─────────┘
           │          │                    │                 │ 1:N
           │     ┌────▼─────────────┐     │                 ▼
           │     │ REVIEWQUEUE      │     │          ┌──────────────┐
           │     │ - id (PK)        │     │          │ RAWRECORD    │
           │     │ - status         │     │          │ - id (PK)    │
           │     │ - reviewed_by ───┼─────┘          │ - raw_data   │
           │     │ - reviewed_at    │                │ - status     │
           │     └────┬─────────────┘                └────┬─────────┘
           │          │ 1:1                              │ 1:1
           │          ▼                                  ▼
           │    ┌──────────────────────────────────────────┐
           │    │ NORMALIZEDEMISSIONRECORD                 │
           │    │ - id (PK)                                │
           │    │ - source_type                            │
           │    │ - scope (1/2/3)                          │
           │    │ - category                               │
           │    │ - facility_code                          │
           │    │ - quantity_standardized (kg CO2e)        │
           │    │ - is_flagged                             │
           │    │ - is_locked                              │
           │    └──────┬───────────────────────────────────┘
           │           │ 1:N
           │           ▼
           │    ┌──────────────┐
           │    │ AUDITLOG     │
           │    │ - id (PK)    │
           │    │ - action     │
           │    │ - actor ─────┼─────────┐
           │    │ - changes    │         │
           │    └──────────────┘         │
           │                             │
           └─────────────────────────────┘
```

---

## Multi-Tenancy Design

### Principle: Defense in Depth

**Layer 1: Database FK Constraint**
```sql
ALTER TABLE ingestion_rawrecord 
ADD CONSTRAINT chk_company_isolation 
FOREIGN KEY (company_id) REFERENCES accounts_company(id);
```

✓ Prevents orphaned records
✗ Doesn't prevent accidental joins

**Layer 2: Permission Checks**
```python
# In API views
queryset = NormalizedEmissionRecord.objects.filter(
    company=request.user.company
)
```

✓ API layer respects company
✗ Bypassed by raw SQL or shell access

**Layer 3: Serializers**
```python
class NormalizedRecordSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        validated_data['company'] = self.context['request'].user.company
        return super().create(validated_data)
```

✓ Can't override company via API
✗ Serializer bugs could leak data

**Why all three?**
- Database FK: catches bugs at lowest level
- Permission checks: prevents data leaks through API
- Serializer defaults: prevents accidental override

If any layer fails, the next catches it. This is security through layering.

---

## Unit Normalization

### The Problem

ESG data comes in many units:
- Fuel: liters, gallons, cubic meters, kg, tonnes
- Electricity: kWh, MWh, joules
- Travel: kilometers, miles, flights
- Procurement: kg, tonnes, units

**Solution**: Always standardize to kg CO₂e

### Conversion Process

```
Raw Input        Standardization        Emission Factor    kg CO2e
──────────────────────────────────────────────────────────────────
5000 L Diesel  →  5000 kg fuel  →  2.68 kg CO2e/L  →  13,400 kg CO2e
                  (using density)
                  
3000 kWh Elec  →  3000 kWh      →  0.4 kg CO2e/kWh →  1,200 kg CO2e
                  (grid-specific)
                  
1000 km Flight →  1000 km       →  0.12 kg CO2e/km →  120 kg CO2e
                  (economy class)
```

### Stored Fields

```
NormalizedEmissionRecord:
  quantity = 5000            # Original: for reference
  unit = "L"                 # Original: for reference
  quantity_standardized = 13400  # Always kg CO2e
```

### Emission Factors

Configured in `settings.py`:

```python
EMISSION_FACTORS = {
    'grid_electricity': 0.4,  # Varies by region
    'fuel_gasoline': 2.31,
    'fuel_diesel': 2.68,
    'fuel_natural_gas': 1.9,
    'flight_economy': 0.12,
    'flight_business': 0.24,
    'hotel_night': 50,
}
```

### Advantages

1. **Uniform Analysis**: Compare fuel vs electricity vs travel
2. **Aggregation**: Sum all records for total emissions
3. **Scalability**: Can improve factors without re-parsing
4. **Auditability**: Track original units forever

---

## Scope Handling

### GHG Protocol Classification

**Scope 1: Direct Emissions**
- Owned/controlled sources
- Examples: facility heating oil, company vehicles

**Scope 2: Indirect Emissions (Energy)**
- Purchased electricity, steam, heating
- Locationbased vs Market-based

**Scope 3: Other Indirect Emissions**
- Supply chain, business travel, employee commuting

### Assignment Logic

**SAP Data**
```python
if document_type == 'FUEL':
    scope = 1
    category = infer_from_material(material_name)
elif document_type == 'PROCUREMENT':
    scope = 3
    category = 'procurement_goods'
```

**Electricity**
```python
scope = 2
category = 'electricity_grid'
```

**Travel**
```python
scope = 3
if travel_type == 'FLIGHT':
    category = 'travel_flight'
elif travel_type == 'HOTEL':
    category = 'travel_hotel'
```

---

## Audit Trail Architecture

### Immutability After Approval

```
RawRecord (ALWAYS IMMUTABLE)
    ↓
NormalizedEmissionRecord (editable until APPROVED)
    ↓
ReviewQueue.approve() → is_locked = True
    ↓
AuditLog entry: {action: APPROVED, changes: ...}
    ↓
[Record is now READ-ONLY]
```

### Change Tracking

```python
def save(self, *args, **kwargs):
    if self.is_locked:
        raise ValidationError("Record is locked for audit")
    
    # Compute changes
    old = NormalizedEmissionRecord.objects.get(id=self.id)
    changes = {}
    for field in self.TRACKED_FIELDS:
        old_val = getattr(old, field)
        new_val = getattr(self, field)
        if old_val != new_val:
            changes[field] = {
                'old': str(old_val),
                'new': str(new_val)
            }
    
    super().save(*args, **kwargs)
    
    # Log the change
    AuditLog.objects.create(
        record=self,
        action='EDITED',
        actor=get_current_user(),
        changes=changes
    )
```

---

## Why This Design?

### 1. Single Source of Truth
- Raw data immutable (RawRecord)
- Computed data regenerable (NormalizedEmissionRecord)
- Audit trail complete (AuditLog)

### 2. Multi-Tenancy Safe
- Company FK everywhere
- Serializers set company automatically
- Permissions enforce isolation

### 3. Compliance-Ready
- Every change logged with actor/timestamp
- Locked records can't be edited
- Original data preserved forever

### 4. Operationally Efficient
- Anomalies detected early (ReviewQueue)
- Analysts see only flagged items
- Can regenerate if rules improve

---

## Known Limitations & Future Work

| Issue | Impact | Mitigation |
|-------|--------|-----------|
| No soft delete on Company | Company deletion cascades | Archive instead in v2 |
| Unit conversion incomplete | Some units fail | Add custom conversion rules |
| Emission factors hard-coded | Can't change per-region | Make factors versioned in v2 |
| No data versioning | Can't compare before/after | Add snapshot model in v2 |

---

## Conclusion

This data model puts compliance and auditability first, then efficiency. It sacrifices some flexibility (immutable raw data, locked records) for certainty (audit trail, non-repudiation, reproducibility).

Every table serves a purpose. Every foreign key enforces a business rule. The design is defensible in audit and interview contexts because it prioritizes **correctness** over **feature count**.
