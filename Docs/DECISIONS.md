# Architecture Decisions & Tradeoffs

**Document Purpose**: Explain every major choice, what was considered, and why.

---

## 1. CSV Upload Over API Integration

### Decision
**All three sources ingest via CSV file upload, not real-time API integration.**

### What We Considered
1. ✅ **CSV Upload** (chosen)
   - Users manually export from system, upload file
   - Batch processing, 1-3x per month
   - Simple, auditable, no vendor API keys needed
   - Works offline

2. ❌ **SAP OData API**
   - Real-time, no manual steps
   - Requires SAP instance with OData enabled
   - Adds complexity (authentication, scheduling)
   - Network dependencies

3. ❌ **Utility Portal Web Scraping**
   - Fully automated
   - Breaks if portal UI changes
   - Terms of service violations possible
   - Complex, fragile

4. ❌ **Concur/Navan API Integration**
   - Real-time travel data
   - Requires vendor account + API key
   - Adds third-party dependency
   - Subscription cost

### Why CSV?

**Reality Check**: Most enterprises don't have modern APIs
- SAP instances often 10+ years old, no OData enabled
- Utility companies rarely expose APIs to commercial customers
- Travel platforms (Concur) expensive for startups

**Prototype Goal**: Demonstrate capability
- CSV upload proves we can handle realistic formats
- In production, add specific integrations later
- CSV is the **mode we can test without vendor accounts**

**Audit Trail**: CSV is auditable
- File stays in system (S3/storage)
- Can see exactly what was uploaded
- Reproducible

### How It Works

```
User                    System
  │
  ├─ Exports CSV from SAP
  │  (Menu → Export → As CSV → Send to Breathe)
  │
  └─ Uploads to /api/upload/sap/
       │
       ├─ Store raw file (S3)
       ├─ Parse rows
       ├─ Create RawRecord per row
       ├─ Normalize → NormalizedEmissionRecord
       ├─ Anomaly detection → ReviewQueue if flagged
       └─ Analyst approves → AuditLog entry
```

### Questions for PM (if production)

- "Should we add real-time SAP OData integration?"
  - *Answer*: "In v2. Needs SAP technical team. For now, CSV works."

- "Can we get direct API access from utilities?"
  - *Answer*: "Only for largest customers. CSV scrape is more universal."

- "Why not auto-sync from Concur?"
  - *Answer*: "Vendor API integration adds 2 weeks. CSV is MVP."

---

## 2. Multi-Tenancy at Database Layer

### Decision
**Every table has `company` FK. Enforced at DB + API layer.**

### What We Considered

1. ✅ **Database-Level FK + API Filters** (chosen)
   - `company_id` column on all tables
   - Django QuerySets filtered by company
   - Two layers of defense

2. ❌ **Application-Level Only (Django Middleware)**
   - No `company_id` on tables
   - All filtering in code
   - Easier to accidentally leak data (raw SQL bypasses filters)

3. ❌ **Row-Level Security (PostgreSQL RLS)**
   - PostgreSQL handles filtering
   - Company isolation at database layer only
   - Requires postgres_rls extension, complex setup

### Why Database FK + API Filters?

**Safety**: Two independent layers
- If API filter broken, database FK prevents joins
- If database breached, FK prevents "SELECT * FROM records"
- "Defense in depth"

**Debuggability**: Company visible in schema
```sql
SELECT * FROM ingestion_rawrecord WHERE company_id = '...';
```

**Performance**: Explicit index on (company_id, field)
```python
class RawRecord(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    
    class Meta:
        indexes = [
            models.Index(fields=['company', 'processing_status']),
        ]
```

**Audit**: Company filter in every query
```python
# Easy to audit:
queryset = NormalizedEmissionRecord.objects.filter(company=request.user.company)

# Hard to miss:
# If you forgot .filter(company=...), Django won't error, but you'll see wrong data
# The FK is there to prevent worst-case data leak
```

---

## 3. Separate RawRecord & NormalizedEmissionRecord

### Decision
**Keep original uploaded data immutable in RawRecord, compute normalized version.**

### What We Considered

1. ✅ **Separate Tables** (chosen)
   - RawRecord: Original CSV row, never modified
   - NormalizedEmissionRecord: Parsed, standardized, flagged
   - Can regenerate normalized if rules change

2. ❌ **Single Record + Version History**
   - One table, track all changes in JSONField
   - Simpler schema
   - But lose immutability

3. ❌ **Just Normalized, Delete Raw**
   - Save disk space
   - But can't debug if parsing logic changes
   - Can't re-parse with improved parser

### Why Separate?

**Auditability**: Original data immutable
```
Scenario: Bug discovered in emission factors
  
Old way (single table):
  "Oops, we computed 5000 kg CO2e wrong"
  → Delete record
  → Re-parse with new factor
  → Can't prove what happened
  
New way (two tables):
  → Original RawRecord untouched
  → Keep old NormalizedEmissionRecord in audit log
  → Create new one with fixed factors
  → Full chain of custody
```

**Compliance**: Required by regulations
- Must preserve original submission
- Must show modifications
- Must prove source integrity

**Debugging**: See exactly what happened
```python
# Analyst finds weird consumption number
consumption = record.quantity  # 15000
original = record.raw_record.raw_data  # {"Consumption": "15000"}
# Aha! CSV said "1 5 0 0 0" with space in middle
# Parse error caught
```

---

## 4. JSON Field for Flag Reasons

### Decision
**Store multiple flag reasons as JSON dict, not separate rows.**

### What We Considered

1. ✅ **JSONField dict** (chosen)
   ```python
   flag_reason = {
       "missing_distance": "Distance not provided",
       "unusual_consumption": "1000% above facility average"
   }
   ```

2. ❌ **Separate FlagReason Table**
   ```sql
   FlagReason
   ├ id
   ├ record_id (FK)
   ├ reason_type
   └ details
   ```

### Why JSON?

**Simplicity**: One record, multiple reasons
- A record can be flagged for 3 reasons simultaneously
- JSONField keeps record in one place
- Easier to query (no JOIN)

**Flexibility**: No schema migration needed
- Add new flag type: just set dict key
- No ALTER TABLE required
- Production-safe

**Readability**: Analyst sees all reasons at once
```python
{
    "missing_quantity": "",
    "negative_value": "Quantity is -500",
    "high_consumption": "95th percentile"
}
```

---

## 5. Standardized Unit (kg CO2e)

### Decision
**Always store `quantity_standardized` in kg CO2e.**

### What We Considered

1. ✅ **Convert to kg CO2e on ingestion** (chosen)
   - Fuel (L) → kg CO2e using emission factors
   - Electricity (kWh) → kg CO2e
   - Travel (km) → kg CO2e
   - Analysis trivial (just sum all records)

2. ❌ **Keep original units, convert at query time**
   - More flexibility
   - But query logic complex
   - Slower reporting

3. ❌ **Multi-unit storage (one field per unit type)**
   - Store quantity_liters, quantity_kg, quantity_kwh
   - No conversion needed
   - But table bloated, queries complex

### Why kg CO2e?

**ESG Reality**: End goal is total emissions
- Client wants: "We emitted 10,000 tonnes CO2e last year"
- Not: "We used 5000 L fuel AND 50,000 kWh AND 10,000 km travel"
- Standardized unit enables this

**Analysis**: Aggregation trivial
```python
total = NormalizedEmissionRecord.objects.filter(
    company=company,
    date__gte=start_date,
    date__lte=end_date
).aggregate(
    total=Sum('quantity_standardized')
)
# Returns: 10,453 kg CO2e = 10.5 tonnes CO2e
```

**Audit Trail**: Original units preserved
```python
record.quantity = 5000  # Original
record.unit = "L"       # Original unit
record.quantity_standardized = 13400  # Standardized (2.68 kg CO2e/L)
```

---

## 6. ReviewQueue as Separate Table

### Decision
**Flagged records go to ReviewQueue for analyst approval, not just marked in NormalizedEmissionRecord.**

### What We Considered

1. ✅ **Separate ReviewQueue Table** (chosen)
   - ReviewQueue.status = PENDING/APPROVED/REJECTED
   - Clear workflow state
   - Separate concern (flagging ≠ approval)

2. ❌ **Single `review_status` Field**
   ```python
   class NormalizedEmissionRecord:
       review_status = 'PENDING'  # or APPROVED
   ```
   - Simpler schema
   - But mixes concerns

### Why Separate?

**Workflow**: Flagging ≠ Approval
```
Scenario: Record is flagged as "unusual_consumption"

Semantics:
  is_flagged=True       → "This record needs review"
  ReviewQueue.status    → "Analyst decision on flagged record"

These are different things:
  - A record can be flagged multiple times (history)
  - Approval decision is singular (once approved, locked)
```

**Queries**: Easy to find pending
```python
# Find all pending approvals
pending = ReviewQueue.objects.filter(
    company=company,
    status='PENDING'
).order_by('severity', '-created_at')
```

**Analytics**: Track approval workflows
```python
avg_time_to_approval = (
    ReviewQueue.objects
    .filter(status='APPROVED')
    .annotate(time_to_review=F('reviewed_at') - F('created_at'))
    .aggregate(Avg('time_to_review'))
)
```

---

## 7. UUID Primary Keys

### Decision
**All models use UUID (not integer) for primary key.**

### What We Considered

1. ✅ **UUID (uuid.uuid4)** (chosen)
   - `id = models.UUIDField(primary_key=True, default=uuid.uuid4)`
   - Globally unique
   - Can't guess IDs
   - Safe to expose in URLs

2. ❌ **Integer (AutoField)**
   - Smaller storage
   - Faster increments
   - But reveals volume/order
   - Vulnerable to enumeration attacks

3. ❌ **Slug (string)**
   - Human-readable (good for URLs)
   - But generated by users (conflict risk)

### Why UUID?

**Security**: Can't enumerate
```
Integer IDs:
  GET /api/records/1
  GET /api/records/2
  GET /api/records/3
  → Attacker tries all IDs, finds patterns

UUID:
  GET /api/records/f47ac10b-58cc-4372-a567-0e02b2c3d479
  → Random, no pattern to exploit
```

**Privacy**: Don't leak data volume
```
Integer ID 10,000,000 suggests company has 10M records
UUID doesn't reveal count
```

**Scaling**: No coordination needed
- Multiple databases can generate UUIDs independently
- No central sequence
- Good for distributed systems

---

## 8. PostgreSQL (Not SQLite)

### Decision
**Require PostgreSQL for production.**

### What We Considered

1. ✅ **PostgreSQL** (chosen)
   - Multi-tenant isolation (FK enforcement)
   - JSON field support (flag_reason, raw_data)
   - Full-text search (facility lookup)
   - Transactions (for audit trail)

2. ❌ **SQLite**
   - Simpler dev setup
   - But limited JSON support
   - Single-writer only (multi-tenant risky)

### Why PostgreSQL?

**JSON Field**: Crucial for flexibility
```python
# SQLite has limited JSON support
raw_record.raw_data = {"PlantCode": "PL001", "Quantity": "5000"}
# PostgreSQL: Full indexing support
# SELECT * WHERE raw_data->>'PlantCode' = 'PL001'
```

**Multi-Tenancy**: Safer FK enforcement
```sql
-- PostgreSQL enforces immediately
ALTER TABLE ingestion_rawrecord 
ADD CONSTRAINT fk_company 
FOREIGN KEY (company_id) REFERENCES accounts_company(id);
```

**Transactions**: Consistent audit trail
```python
with transaction.atomic():
    record.save()
    AuditLog.objects.create(...)  # Both succeed or both fail
```

---

## 9. JWT for Authentication (Not Session)

### Decision
**Use JWT tokens, not Django sessions.**

### Why?

**Stateless**: No session table needed
- Easier deployment (no session stickiness)
- Scales horizontally
- Frontend has token in localStorage

**Mobile-friendly**: Works with React Native
- Sessions require cookies
- JWTs work everywhere

**CORS-safe**: Works across origins
- Sessions have CORS restrictions
- JWTs passed as header (no CORS issues)

---

## 10. Celery for Async (Added in v1.1)

### Decision
**Optional Celery for large file processing.**

### Why Not Initially?

- Adds Redis dependency
- Complicates local dev
- For prototype, sync processing fine

### Why Later?

- Files >100MB need async
- Don't want to block HTTP request
- Task queue (process in background)

---

## Trade-offs: What We Accepted

### 1. No Soft Delete on Records
**Locked records stay, not archived**
- Could add `is_deleted` field
- But complicates queries
- Audit log shows what happened anyway

### 2. Manual Facility Lookup Upload
**PlantLookup populated manually or from SAP export**
- Could auto-resolve all codes
- But needs external data source
- Manual keeps it simple

### 3. Single Emission Factor per Category
**Global emission_factors in settings.py**
- Could be per-region/per-facility
- Requires configuration UI
- Deferred to v2

### 4. No Geographic Clustering
**No built-in "all EU facilities" queries**
- Could use latitude/longitude
- Needs aggregation logic
- Deferred to v2

---

## If PM Asked...

**"Why not real Concur integration?"**
- "Concur API requires vendor account ($$$). CSV proves we can handle travel data. We'll add real integration once client buys Concur license."

**"Can I have real-time sync from SAP?"**
- "Requires OData API enabled in SAP (not always available). We can add this in v2 if customer approves budget."

**"Why PostgreSQL? Why not cloud database?"**
- "PostgreSQL works on Render/Railway. We could use RDS/Cloud SQL, but PostgreSQL is portable."

**"Why immutable RawRecord? Why not just re-parse?"**
- "Immutability proves we didn't modify source data. Compliance/audit requirement."

**"Can I edit a locked record?"**
- "No, by design. Once analyst approves, it's locked for audit. If you need to change, reject it and re-upload."

---

## Conclusion

Every decision balances **Correctness vs Simplicity**. This design prioritizes correctness (auditable, multi-tenant safe, immutable source) over maximum features.

A smaller, defensible system beats a feature-rich system you can't explain.
