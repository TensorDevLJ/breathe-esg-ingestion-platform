# Quick Start Guide - Breathe ESG

Get up and running in 5 minutes.

## 1. Clone & Setup Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env: Set DB credentials if using local PostgreSQL

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend runs at `http://localhost:8000`

## 2. Setup Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## 3. Test Upload

1. Open `http://localhost:5173` in browser
2. Log in with superuser credentials
3. Click "Upload" → "SAP"
4. Upload `SampleData/sap_export_sample.csv`
5. See parsed records in dashboard

## 4. Using Docker (Optional)

```bash
docker-compose up
```

This starts:
- Django on port 8000
- React on port 5173
- PostgreSQL on port 5432

## 5. Deploy to Production

See `Docs/DEPLOYMENT.md` for Render.com deployment steps.

---

## Documentation

- **README.md** - Complete architecture & setup
- **Docs/MODEL.md** - Data model explanation
- **Docs/DECISIONS.md** - Architecture decisions
- **Docs/TRADEOFFS.md** - Deliberate omissions
- **Docs/SOURCES.md** - Source research
- **Docs/DEPLOYMENT.md** - Production deployment

---

## API Endpoints (Skeleton, needs completion)

**NOT YET IMPLEMENTED** - See PROJECT_CHECKLIST.md for status

```
POST   /api/auth/login/
POST   /api/upload/sap/
POST   /api/upload/electricity/
POST   /api/upload/travel/
GET    /api/records/
GET    /api/review-queue/
PATCH  /api/review-queue/{id}/approve/
GET    /api/audit-log/
```

---

## Sample Data Files

Located in `SampleData/`:

- `sap_export_sample.csv` - SAP fuel & procurement data
- `electricity_export_sample.csv` - Utility meter readings
- `travel_export_sample.csv` - Corporate travel data

Use these to test the system end-to-end.

---

## Common Issues

**"Database connection refused"**
- PostgreSQL not running
- .env DB credentials wrong
- Run: `psql -U postgres` to test

**"Module not found"**
- Missing pip install
- Run: `pip install -r requirements.txt`

**"Port already in use"**
- Django: `python manage.py runserver 8001`
- React: `npm run dev -- --port 3000`

---

## Next Steps

1. Read `Docs/MODEL.md` to understand data model
2. Review `Docs/DECISIONS.md` to see architecture choices
3. Check `PROJECT_CHECKLIST.md` for implementation status
4. Run sample data through system
5. Deploy to Render (see DEPLOYMENT.md)

---

**Status**: Core data models ✓, Parsers ✓, API endpoints ⏳, Frontend ⏳

See PROJECT_CHECKLIST.md for detailed progress.
