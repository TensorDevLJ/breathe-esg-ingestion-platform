# Breathe ESG - Frontend

Complete React application for the Breathe ESG data ingestion platform.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Development](#development)
- [Building](#building)
- [Deployment](#deployment)
- [Architecture](#architecture)

---

## ✨ Features

### Dashboard
- Overview of all ingested data
- Statistics and metrics
- Charts and visualizations
- Real-time data updates

### Upload
- Multi-source file upload (SAP, Electricity, Travel)
- CSV file validation
- Progress tracking
- Upload history

### Review & Approval
- Flagged records workflow
- Severity levels (Low, Medium, High)
- Analyst notes and comments
- Approve/Reject actions
- Automated audit logging

### Audit Trail
- Complete change history
- Filter by action, date, user
- Export to CSV
- Non-repudiation proof

### Authentication
- JWT token-based auth
- Secure password handling
- Auto-logout on 401
- Role-based access control

---

## 📁 Project Structure

```
breathe-esg-frontend/
├── public/                  Static assets
├── src/
│   ├── main.jsx            Entry point
│   ├── App.jsx             Root component with routing
│   │
│   ├── api/                API integration
│   │   ├── client.js       Axios HTTP client
│   │   └── endpoints.js    API endpoint definitions
│   │
│   ├── components/         Reusable components
│   │   ├── Layout.jsx      Main layout wrapper
│   │   ├── Navigation.jsx  Top navigation bar
│   │   ├── Sidebar.jsx     Left sidebar menu
│   │   ├── UploadForm.jsx  File upload form
│   │   ├── RecordTable.jsx Records data table
│   │   ├── ReviewQueue.jsx Approval workflow
│   │   ├── AuditLog.jsx    Change history
│   │   └── Charts.jsx      Dashboard charts
│   │
│   ├── pages/              Page components
│   │   ├── Dashboard.jsx   Main dashboard
│   │   ├── Upload.jsx      Upload page
│   │   ├── Review.jsx      Review workflow
│   │   ├── Audit.jsx       Audit trail
│   │   └── Login.jsx       Authentication
│   │
│   ├── store/              Zustand state management
│   │   └── authStore.js    Authentication state
│   │
│   ├── styles/             CSS files
│   │   ├── globals.css     Global styles
│   │   └── tailwind.css    Tailwind imports
│   │
│   └── utils/              Utility functions
│       ├── formatters.js   Data formatting
│       └── validators.js   Input validation
│
├── package.json            Dependencies and scripts
├── vite.config.js          Vite configuration
├── tailwind.config.js      Tailwind configuration
├── postcss.config.js       PostCSS configuration
├── .env.example            Environment template
├── index.html              HTML entry point
└── README.md               This file
```

---

## 🚀 Setup

### Prerequisites
- Node.js 16+ (LTS recommended)
- npm 8+ or yarn 1.22+

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Opens at: `http://localhost:5173`

---

## 💻 Development

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Key Development Tools

- **Vite** - Lightning-fast bundler and dev server
- **React 18** - UI framework
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - React charts library
- **Lucide React** - Icon library

### Environment Variables

```env
# API Configuration (required)
VITE_API_URL=http://localhost:8000/api

# App Configuration
VITE_APP_NAME=Breathe ESG
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

---

## 🏗️ Building

### Production Build

```bash
npm run build
```

Creates optimized production bundle in `dist/` directory:
- Minified JavaScript
- CSS optimization
- Asset hashing
- Source maps (optional)

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── main.xxxx.js       (Main bundle)
│   ├── vendor.xxxx.js     (Vendor bundle)
│   └── styles.xxxx.css    (Styles)
└── vite.svg
```

---

## 🌐 Deployment

### Option 1: Render.com (Recommended)

1. **Connect GitHub repository**
2. **Create Static Site**
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

3. **Set Environment Variable**
   ```
   VITE_API_URL=https://your-api-domain.com/api
   ```

4. **Deploy** - Automatic on git push

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure environment** in Vercel dashboard

### Option 3: Traditional Hosting

1. **Build**
   ```bash
   npm run build
   ```

2. **Upload `dist/` to web server**
   - S3 + CloudFront
   - Netlify
   - GitHub Pages
   - Any HTTP server

3. **Configure CORS** (if API on different domain)
   ```
   Access-Control-Allow-Origin: your-frontend-url
   ```

---

## 🏛️ Architecture

### Component Hierarchy

```
App
├── Login (if not authenticated)
└── Layout (if authenticated)
    ├── Navigation (top bar)
    ├── Sidebar (left menu)
    └── Routes
        ├── Dashboard
        │   └── Charts
        ├── Upload
        │   ├── UploadForm
        │   └── RecordTable
        ├── Review
        │   └── ReviewQueue
        └── Audit
            └── AuditLog
```

### State Management

**Zustand Store** (`store/authStore.js`):
- User authentication
- JWT token storage
- Logout handling
- User profile info

### API Integration

**Axios Client** with interceptors:
- Auto-adds JWT token to all requests
- Handles 401 responses (auto-logout)
- Configurable base URL from env

### Styling

**Tailwind CSS** utility-first approach:
- No CSS files needed for most components
- Utility classes in JSX
- Theme customization in `tailwind.config.js`
- Dark mode support (can be added)

---

## 🔐 Security

### Best Practices Implemented

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **HTTPS** - Production uses HTTPS only
- ✅ **CORS** - Backend restricts origins
- ✅ **Input Validation** - Client-side validation
- ✅ **XSS Prevention** - React escapes by default
- ✅ **CSRF Protection** - DRF provides tokens
- ✅ **Secure Storage** - Tokens in localStorage (production: httpOnly cookies)
- ✅ **Rate Limiting** - Backend enforces rate limits

### Not Implemented (Deferred)

- Service Worker / Offline support
- End-to-end encryption
- Two-factor authentication

---

## 📱 Responsive Design

All components are mobile-responsive:
- Desktop: Full sidebar + content
- Tablet: Collapsible sidebar
- Mobile: Full-width layout

### Breakpoints (Tailwind)

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## 🐛 Common Issues

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### CORS errors
- Check `VITE_API_URL` in `.env`
- Backend must include frontend URL in `CORS_ALLOWED_ORIGINS`

### 401 Unauthorized
- Token may have expired
- Re-login required
- Check JWT expiration in backend

### Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🚀 Performance

### Optimizations Included

- ✅ Code splitting (automatic with Vite)
- ✅ Tree shaking (unused code removed)
- ✅ Lazy loading (React Router supports it)
- ✅ Asset optimization (Vite handles it)
- ✅ Caching strategies

### Performance Tips

1. Use `React.memo` for expensive components
2. Use `useCallback` to memoize functions
3. Use `useMemo` to memoize computations
4. Lazy load routes: `React.lazy(() => import(...))`
5. Monitor bundle size: `npm run build -- --analyze`

---

## 📚 Learn More

### Documentation
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand-demo.vercel.app/)
- [Recharts](https://recharts.org)
- [Axios](https://axios-http.com)

### Related Docs
- Backend: See `../Backend/README.md`
- Deployment: See `../Docs/DEPLOYMENT.md`
- Architecture: See `../Docs/DECISIONS.md`

---

## 🤝 Contributing

When adding features:

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Follow code style**
   ```bash
   npm run format
   ```

3. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Push and create PR**

---

## 📄 License

Internal use. Do not distribute.

---

**Last Updated**: May 2026
**Status**: Production Ready
**Tested On**: Node 18+, Chrome/Firefox/Safari
