# 💰 Kharcha — Personal Expense Tracker

A modern, multi-user expense tracker built with React + Node.js + PostgreSQL.
Free to build, free to host, and designed for real daily use.

---

## 🗂️ Project Structure

```
expense-tracker/
├── frontend/          # React + TypeScript + Tailwind
│   └── src/
│       ├── pages/     # All page components
│       ├── components/ # Shared UI components
│       ├── contexts/  # Auth & Theme context
│       └── lib/       # API client & utilities
└── backend/           # Node.js + Express API
    └── src/
        ├── routes/    # API route handlers
        ├── middleware/ # Auth & validation
        └── db/        # Schema & DB pool
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or free cloud)

---

### 1. Database Setup

**Option A: Neon (Free cloud PostgreSQL — recommended)**
1. Go to [neon.tech](https://neon.tech) → Sign up free
2. Create a new project → Copy the connection string
3. It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

**Option B: Supabase (Alternative)**
1. Go to [supabase.com](https://supabase.com) → Create project
2. Settings → Database → Copy connection string (use "URI" format)

**Option C: Local PostgreSQL**
```bash
createdb expense_tracker
# Connection string: postgresql://localhost/expense_tracker
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env and fill in your values:
#   DATABASE_URL=your_postgres_connection_string
#   JWT_SECRET=any_long_random_string_here
#   FRONTEND_URL=http://localhost:5173

# Run database migrations (creates all tables)
npm run db:migrate

# Start the server
npm run dev
# → API running at http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create env file (optional for local dev, proxy handles /api)
# For production, create .env:
# VITE_API_URL=https://your-backend-url.com/api

# Start dev server
npm run dev
# → App running at http://localhost:5173
```

Open http://localhost:5173 → Register an account → Start tracking! 🎉

---

## 🌐 Deployment (100% Free)

### Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo → Select the `backend` folder
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     ```
     DATABASE_URL=your_neon_or_supabase_url
     JWT_SECRET=your_secret_key
     JWT_EXPIRES_IN=7d
     NODE_ENV=production
     FRONTEND_URL=https://your-app.vercel.app
     ```
5. Click Deploy → Copy your Render URL (e.g. `https://kharcha-api.onrender.com`)

**After backend is live, run migrations:**
In Render dashboard → Shell → `npm run db:migrate`

---

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo → Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://kharcha-api.onrender.com/api
   ```
4. Deploy → Share the URL with friends & family!

---

### Deploy Frontend to Netlify (Alternative)

```bash
cd frontend
npm run build
# Upload the 'dist' folder to Netlify Drop (drag & drop!)
# Or connect GitHub for auto-deploys
```

---

## 🔧 Environment Variables Reference

### Backend `.env`
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret key for JWT signing | `my_super_secret_key_abc123` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Allowed CORS origin | `https://your-app.vercel.app` |

### Frontend `.env`
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-api.onrender.com/api` |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (paginated, filterable) |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Soft delete expense |

**Query params for GET:** `page`, `limit`, `search`, `categoryId`, `accountId`, `startDate`, `endDate`, `type`

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all user categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create account |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |

### Borrow & Lend
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/borrow` | List transactions (filterable by type/status) |
| POST | `/api/borrow` | Create borrow/lend record |
| POST | `/api/borrow/:id/settle` | Record a settlement payment |
| DELETE | `/api/borrow/:id` | Delete record |

### Dashboard & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Monthly summary, charts data |
| GET | `/api/dashboard/reports` | Date-range reports with breakdowns |

---

## 🗄️ Database Schema

```sql
users           → id, name, email, password_hash, avatar_color
categories      → id, user_id, name, icon, color, is_default
accounts        → id, user_id, name, type, balance, icon, color
expenses        → id, user_id, title, amount, category_id, account_id, date, notes, type
borrow_transactions → id, user_id, person_name, amount, type, status, paid_amount, date
borrow_settlements  → id, transaction_id, amount, date, notes
```

All tables use soft deletes (`deleted_at` column) for data safety.

---

## ✨ Features

- ✅ Multi-user with secure JWT authentication
- ✅ Custom expense categories with icons & colors
- ✅ Multiple account management (bank, cash, UPI)
- ✅ Auto account balance updates on expense add/edit/delete
- ✅ Borrow & Lend tracking with partial settlement support
- ✅ Dashboard with pie chart, bar chart, recent transactions
- ✅ Reports with date range filtering and CSV export
- ✅ Dark / Light mode
- ✅ Mobile-first responsive design
- ✅ Pagination and search for expenses
- ✅ Default categories & accounts on registration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | TanStack Query (React Query v5) |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Hosting | Vercel (frontend) + Render (backend) + Neon (DB) |

---

## 🤝 Sharing with Friends & Family

Just share your Vercel URL! Anyone can:
1. Visit the link
2. Register their own account
3. Start tracking independently

Each user sees only their own data — completely isolated.

---

## 🔮 Future Enhancements

- [ ] Recurring expenses
- [ ] Monthly budget limits with alerts
- [ ] PWA support (installable on mobile)
- [ ] CSV import
- [ ] Google OAuth login
- [ ] Push notifications for due borrow payments
