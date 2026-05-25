# Deliberate Tradeoffs: What We Didn't Build

**Purpose**: Explain three intentional omissions and why they're deferred.

---

## Tradeoff #1: PDF Parsing for Utility Bills

### What We Didn't Build
**OCR + PDF parsing for utility bill PDFs**

Utility companies typically provide:
1. CSV export (what we handle)
2. PDF monthly bill
3. Web portal (what a real integration would scrape)

### Why Not?
- OCR is error-prone (0.95-0.99 accuracy)
- PDF structure varies by utility (British Gas ≠ E.ON)
- Adds pdfplumber, pytesseract, and OCR engine (50 MB)
- Regional variations (German invoices different from UK)
- Production deployment requires system-level OCR libraries

### What Goes Wrong
```
PDF Bill:
  "Consumption: 12,345 kWh"  (human-readable)
  
OCR Output:
  "Consumption: 12,345 kWh"  (usually correct)
  OR
  "Consumption: l2,345 kWh"  (l instead of 1, 95% confidence)
  OR
  "Consumption: 12345 k Wh"  (space in kWh)
  
→ Validation fails, record flagged, analyst manually corrects
```

### In Production
1. Client provides CSV export (easiest path)
2. If only PDF available, hire temp staff to manually extract data
3. In v2, add specialized OCR service (EasyPost, etc.)

### Cost-Benefit
| Aspect | Cost | Benefit |
|--------|------|---------|
| Dev time | 2 days | Maybe 5% of uploads |
| Maintenance | OCR breaks on PDF updates | Saves manual work |
| Accuracy | 95% | 100% with CSV |
| Deployment | +50MB, system deps | Faster intake |

**Decision**: CSV only in v1. Add PDF in v2 if requested.

---

## Tradeoff #2: Real SAP OData Integration

### What We Didn't Build
**Live connection to SAP via OData API**

Real SAP installations typically have:
1. IDoc messaging (complex, SAP-specific)
2. OData REST API (newer, JSON-based)
3. Flat file export (what we handle)

OData example:
```
GET https://sap.company.com/odata/v2/MaterialMovements(
  filter=Date eq datetime'2024-02-01T00:00:00'
)?$select=PlantCode,Material,Quantity,Unit
```

### Why Not?
- Requires live SAP system with OData enabled
- SAP technical team must configure (2-4 week lead time)
- VPN + network whitelisting required
- SAP credentials management complex
- Auth: OAuth, SAML, or Basic (different per SAP version)
- Drift: SAP system changes API surface
- Testing: need actual SAP instance

### What Goes Wrong
```
Scenario: Breathe production connects to SAP via OData

Day 1: Works ✓
Day 30: SAP system patched, OData endpoint version changes
        → New field added to PlantCode
        → Our parser fails
        → Manual rollback, SAP team involved

Week 6: SAP team says "new API version requires certificate rotation"
        → Deployment blocked
        → Revenue on hold
```

### In Production
1. Customer provides CSV export (safest, proven)
2. Customer IT automates CSV export (ABAP script, scheduled)
3. Later (v2), engineer SAP team's OData connection
4. Real-time integration: quarterly review, full test suite

### How CSV Provides Proof
```
Breathe → "Can you export as CSV?"
Customer IT → (30 min automation)
Breathe ← "Here, takes 30 seconds"

Breathe → "Excellent, we're reading this format"
Later → "Real SAP integration? That's the same format"
```

CSV validates the **data shape** without the operational nightmare.

---

## Tradeoff #3: Airport Code Geolocation for Travel

### What We Didn't Build
**Resolve airport codes (JFK, LHR, BER) to coordinates for distance calculation**

Travel data comes in as:
```
TravelType,Origin,Destination,Distance,AirportCode
FLIGHT,Berlin,London,900,LHR
FLIGHT,Berlin,New York,,JFK  ← Distance missing!
```

### Real Solution (Ideal)
```python
# Use airport API (OpenFlights, Geonames, etc.)
origin_code = 'BER'  # Berlin
destination_code = 'JFK'  # New York

origin_coords = AirportLookup.get('BER')  # (52.52, 13.40)
dest_coords = AirportLookup.get('JFK')    # (40.64, -73.77)

distance = haversine_distance(origin_coords, dest_coords)  # ~6,600 km
```

### Why Not?
- **Requires external API** (OpenFlights, SkyScanner, etc.)
  - Network latency: 200ms per lookup
  - Rate limits: 1000 lookups/day
  - Fallback needed if API down

- **Hard-coded lookup is fragile**
  - 45,000+ airports worldwide
  - New airports, code changes, mergers
  - Must maintain annually

- **Straight-line distance wrong**
  - Great circle distance ≠ actual flight path
  - 900 km distance doesn't exist (great circle is 882 km)
  - Analyst seeing "900" learns to double-check

### What We Do Instead
```python
if travel_type == 'FLIGHT' and distance_missing:
    # Flag it
    anomalies['missing_distance'] = (
        "Flight distance not provided. "
        "Analyst should manually check or reject."
    )
    review_queue.create(
        reason_flagged='Missing flight distance',
        severity='MEDIUM'
    )
```

Analyst workflow:
```
Analyst sees: FLIGHT Berlin → New York, distance=MISSING
Analyst does: "Typical NYC flight is 6300-6500 km"
Analyst decides: Approve with note "Assumed 6400 km" OR Reject
Analyst acts: Sets flag_reason and approves
```

### In Production
1. v1: Analyst manually handles missing distances
2. v2: Add OpenFlights lookup for auto-distance
3. v3: Integrate with Concur API (includes real flight data)

### Why This Is OK
- Travel is typically 5-10% of records (rest is fuel/electricity)
- Analyst review catches it anyway
- Better to flag and ask than guess wrong
- Real integration (Concur) provides actual flight data

---

## Summary Comparison

| Tradeoff | Effort (dev days) | Impact | v2 Plan |
|----------|-------------------|--------|---------|
| PDF Parsing | 2-3 | 5% of utilities | OCR service |
| SAP OData | 3-5 | 20% of SAP orgs | Full integration |
| Airport Geolocation | 1-2 | 10% of flights | Concur API |

## Total Deferred: ~7 days of engineering

## What We Get Instead
- **Simpler deployment**: No external APIs required
- **Testable**: Don't need real SAP/Concur accounts
- **Debuggable**: CSV is human-readable
- **Auditable**: Every file persisted
- **Analyst-driven**: Humans catch edge cases

---

## If Asked in Review: "Why not build these?"

**Q: Can't you add PDF parsing quickly?**
A: "Quickly, maybe. Reliably, no. OCR breaks on PDF format changes. CSV is 100% reliable. We can add OCR in v2 with proper test suite."

**Q: Don't you need SAP integration for enterprise sales?**
A: "Maybe. But first prove the data model works. SAP integration is 3 weeks vs CSV which works today. When customer IT approves OData access, we're ready. The format is the same."

**Q: Can you calculate flight distances automatically?**
A: "We can, but wrong guesses are worse than flagged records. Analyst catches them. Real solution is Concur API in v2, which provides actual flight distances from booking system."

---

## Principle

> **Defer complexity until its value is proven.**

Each of these features would:
1. Add dependencies (external APIs, libraries)
2. Increase deployment surface (more things to configure)
3. Increase debugging surface (more things to break)

Build in layers:
1. **v1 (MVP)**: CSV intake, flagging, analyst review ← You are here
2. **v2 (Growth)**: Add one integration (PDF or SAP) based on customer demand
3. **v3 (Enterprise)**: Full third-party integrations (Concur, real SAP, etc.)

This is how real engineering works: **start simple, improve based on actual needs**.
