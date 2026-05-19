# 🍃 Tea Estate ERP Software

A production-ready Enterprise Resource Planning system for tea packaging and distribution businesses. Built with Next.js 15, TypeScript, and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Project Structure](#-project-structure)
- [Modules](#-modules)
- [Role-Based Access](#-role-based-access)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **Role-Based Dashboards** — 5 distinct dashboard views (Admin, Manager, Supervisor, Worker, Dealer)
- **JWT Authentication** — Access + refresh token rotation with theft detection
- **Production Management** — Raw materials, blend recipes, batch tracking, packaging workflow
- **Inventory Control** — Multi-warehouse, barcode scanning, stock movements, low-stock alerts
- **Sales & Invoicing** — Dealer orders, tax calculation, payment tracking, PDF invoice export
- **Analytics & Reports** — Sales, inventory, dealer performance, production, attendance with PDF/Excel export
- **Employee Management** — CRUD, department tracking, attendance
- **Dealer Management** — Credit limits, outstanding dues, GST tracking
- **Wastage Tracking** — Categorized waste reporting with analytics
- **Audit Logging** — Full trail of all data mutations
- **Cloudinary Integration** — Image upload service for products/employees
- **Responsive UI** — Collapsible sidebar, mobile-friendly, dark mode ready

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + ShadCN UI |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Prisma 5 with Driver Adapters |
| Auth | Custom JWT (jose) + bcrypt |
| Validation | Zod + React Hook Form |
| Images | Cloudinary |
| Charts | Custom SVG (zero-dependency) |
| Deployment | Vercel-optimized |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│  React 19 + ShadCN UI + Tailwind CSS                        │
│  Role-based sidebar • Modal system • Data tables • Charts   │
├─────────────────────────────────────────────────────────────┤
│                     NEXT.JS 15 (App Router)                   │
├──────────────┬──────────────────────────────────────────────┤
│  Middleware  │  JWT verification • Route protection • RBAC   │
├──────────────┼──────────────────────────────────────────────┤
│  API Routes  │  28 endpoints • Zod validation • Auth guards  │
├──────────────┼──────────────────────────────────────────────┤
│  Services    │  Business logic • Transactions • Audit logs   │
├──────────────┼──────────────────────────────────────────────┤
│  Prisma ORM  │  Type-safe queries • Neon adapter • Pooling   │
├──────────────┴──────────────────────────────────────────────┤
│              NEON POSTGRESQL (Serverless)                     │
│  25 tables • Indexed • Soft deletes • Audit trail           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- [Cloudinary](https://cloudinary.com) account (for image uploads)

### Installation

```bash
# Clone the repository
git clone https://github.com/arifarman22/ERP-software-.git
cd ERP-software-

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Push schema to database
npx prisma db push

# Seed admin user
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Credentials

Use these accounts to explore the system with different role-based dashboards:

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** | `superadmin@teaestate.erp` | `T3@Estate#Adm!n2024$` | Full system access — all modules, user management, audit logs |
| **Manager** | `manager@teaestate.erp` | `Test@1234` | Sales, production, inventory, dealers, reports |
| **Supervisor** | `supervisor@teaestate.erp` | `Test@1234` | Production batches, employee view, inventory view, reports |
| **Worker** | `worker@teaestate.erp` | `Test@1234` | Personal dashboard only — attendance, assigned tasks |
| **Dealer** | `dealer@teaestate.erp` | `Test@1234` | Orders view, invoices view, payment history |

> 💡 Each role sees a **completely different dashboard** with role-specific stats, charts, and navigation menu.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# JWT Secrets (generate: openssl rand -base64 64)
JWT_ACCESS_SECRET="your-64-char-secret"
JWT_REFRESH_SECRET="your-64-char-secret"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled connection (with `-pooler` in hostname) |
| `DIRECT_DATABASE_URL` | Neon direct connection (for migrations) |
| `JWT_ACCESS_SECRET` | Signs access tokens (15min expiry) |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (7 day expiry) |
| `CLOUDINARY_*` | Image upload service credentials |

---

## 🗄 Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Run migrations (production)
npx prisma migrate dev

# Seed default admin user
npx prisma db seed

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (25 models)
│   └── seed.ts                # Admin user seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Register pages
│   │   ├── (dashboard)/       # Protected pages
│   │   │   ├── dashboard/     # Role-based dashboards
│   │   │   ├── employees/     # Employee management
│   │   │   ├── production/    # Batches, recipes, packaging, wastage
│   │   │   ├── inventory/     # Products, warehouses, movements, alerts
│   │   │   ├── sales/         # Orders, analytics
│   │   │   ├── invoices/      # Invoice detail, payments
│   │   │   ├── dealers/       # Dealer management
│   │   │   └── reports/       # All analytics reports
│   │   └── api/               # 28 API route handlers
│   ├── components/
│   │   ├── ui/                # ShadCN primitives (Button, Card, Dialog...)
│   │   ├── dashboard/         # StatCard, Charts, DataTable, Modal
│   │   ├── forms/             # Reusable FormShell
│   │   └── layout/            # Sidebar, Header, Notifications
│   ├── hooks/                 # useAuth, useMutation
│   ├── lib/
│   │   ├── auth/              # JWT, sessions, permissions, guards
│   │   ├── services/          # Business logic (inventory, sales, production, reports, export)
│   │   ├── validators/        # Zod schemas
│   │   ├── db.ts              # Prisma singleton (Neon serverless)
│   │   ├── cloudinary.ts      # Image upload service
│   │   └── api-response.ts    # Standardized responses
│   ├── types/                 # TypeScript declarations
│   └── middleware.ts          # Auth + role-based route protection
├── .env.example
├── next.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

---

## 📦 Modules

### 🔐 Authentication
- Custom JWT with access (15min) + refresh (7d) tokens
- Refresh token rotation with family-based theft detection
- Login rate limiting (5 attempts → 15min lockout)
- Session management (max 5 concurrent)
- Login audit trail

### 👥 Employees
- CRUD with department/designation
- Linked to User accounts
- Attendance tracking ready

### 🍃 Production
- **Raw Materials** — Stock management with low-stock alerts
- **Blend Recipes** — Percentage-based ingredient formulas
- **Production Batches** — Full lifecycle (Pending → In Progress → QC → Completed)
- **Packaging** — Workflow with auto-transfer to finished goods inventory
- **Wastage** — Categorized tracking with analytics

### 📦 Inventory
- Multi-warehouse support
- Batch-level tracking
- Stock movements (Inbound/Outbound/Transfer/Adjustment)
- Barcode scanner (hardware + manual)
- Low-stock alerts with severity levels
- Inventory adjustments with audit trail

### 🛒 Sales & Invoicing
- Dealer order creation with stock reservation
- Order lifecycle (Draft → Confirmed → Dispatched → Delivered)
- Auto inventory deduction on confirmation
- Invoice generation with configurable tax rates
- Partial payment tracking
- PDF invoice export
- Sales analytics (revenue trends, top products, top dealers)

### 🏪 Dealers
- Company profiles with GST
- Credit limit management
- Outstanding balance tracking
- Performance analytics

### 📊 Reports & Analytics
- Sales reports (revenue, trends, product performance)
- Inventory reports (stock levels, warehouse distribution)
- Dealer performance (revenue, outstanding, overdue)
- Production analytics (yield trends, wastage breakdown)
- Attendance reports (rates, daily trends)
- **Export**: PDF (print-ready HTML) and Excel (CSV)

---

## 🔒 Role-Based Access

### 5 Roles with Granular Permissions

| Module | Admin | Manager | Supervisor | Worker | Dealer |
|--------|:-----:|:-------:|:----------:|:------:|:------:|
| Dashboard | ✅ Full | ✅ Sales/Prod | ✅ Production | ✅ Personal | ✅ Orders |
| Employees | ✅ CRUD | ✅ CRUD | 👁 View | ❌ | ❌ |
| Production | ✅ Full | ✅ Full | ✅ Create/Edit | ❌ | ❌ |
| Inventory | ✅ Full | ✅ Full | 👁 View | ❌ | ❌ |
| Sales | ✅ Full | ✅ Full | ❌ | ❌ | 👁 View |
| Invoices | ✅ Full | ✅ Full | ❌ | ❌ | 👁 View |
| Dealers | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| Reports | ✅ Full | ✅ Full | 👁 View | ❌ | ❌ |
| Users | ✅ Manage | ❌ | ❌ | ❌ | ❌ |

### Enforcement Layers

1. **Sidebar** — Menu items auto-hide based on permissions
2. **Middleware** — Server-side route blocking with redirect
3. **API Guards** — `withPermission()` rejects unauthorized API calls (403)

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT cookies |
| POST | `/api/auth/refresh` | Rotate access token |
| POST | `/api/auth/logout` | Revoke session |
| GET | `/api/auth/me` | Current user + permissions |
| POST | `/api/auth/register` | Create account |
| GET | `/api/auth/sessions` | List active sessions |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/employees` | List/Create employees |
| GET/POST | `/api/dealers` | List/Create dealers |
| GET/POST | `/api/production` | List/Create batches |
| GET/POST | `/api/inventory` | List/Create inventory items |
| GET/POST | `/api/inventory/products` | Product CRUD |
| GET/POST | `/api/inventory/warehouses` | Warehouse CRUD |
| GET/POST | `/api/inventory/movements` | Stock movements |
| POST | `/api/inventory/adjustments` | Inventory adjustments |
| GET | `/api/inventory/alerts` | Low-stock alerts |
| GET | `/api/inventory/barcode?code=X` | Barcode lookup |
| GET/POST | `/api/sales` | List/Create orders |
| PATCH | `/api/sales/[id]` | Update order status |
| GET/POST | `/api/invoices` | List/Create invoices |
| POST | `/api/invoices/[id]/payments` | Record payment |
| GET | `/api/invoices/[id]/pdf` | PDF export |
| GET | `/api/reports/sales` | Sales analytics |
| GET | `/api/reports/inventory` | Inventory report |
| GET | `/api/reports/dealers` | Dealer performance |
| GET | `/api/reports/production` | Production analytics |
| GET | `/api/reports/attendance` | Attendance report |
| GET | `/api/reports/export` | PDF/CSV export |
| POST | `/api/upload` | Image upload (Cloudinary) |
| GET | `/api/health` | System health check |

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

The project is optimized for Vercel serverless:
- Neon serverless driver (HTTP-based, no TCP)
- Connection pooling (max 5 per instance)
- Edge-compatible middleware

### Build Commands

```bash
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## 🔒 Security

- ✅ JWT with short expiry + refresh rotation
- ✅ HTTP-only secure cookies
- ✅ Refresh token theft detection (family revocation)
- ✅ Login rate limiting (5 attempts → lockout)
- ✅ bcrypt password hashing (12 rounds)
- ✅ Zod input validation on all endpoints
- ✅ Prisma parameterized queries (SQL injection safe)
- ✅ Role-based access at 3 layers (UI, middleware, API)
- ✅ Audit logging on all mutations
- ✅ Soft deletes (no permanent data loss)
- ✅ CORS protection via Next.js defaults
- ✅ Environment variable separation (.env excluded from git)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👤 Author

**Arif Arman**

- GitHub: [@arifarman22](https://github.com/arifarman22)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) — React framework
- [Prisma](https://prisma.io) — Type-safe ORM
- [Neon](https://neon.tech) — Serverless PostgreSQL
- [ShadCN UI](https://ui.shadcn.com) — Component library
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [Cloudinary](https://cloudinary.com) — Image management
