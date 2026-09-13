# FinTrack — Personal Finance & Transaction Analytics

FinTrack is a full-stack MERN application for recording personal income and expenses, setting category budgets, and understanding spending through a visual analytics dashboard. Every financial record belongs to one authenticated user and can only be accessed by that user.

## Features and user workflow

### Accounts and security

- Register with a name, email address, and password.
- Sign in to receive a JSON Web Token (JWT). The browser sends it with protected requests.
- Sign out to clear the local session token.
- Passwords are hashed with bcrypt before storage; they are never saved as plain text.

### Transactions

Add income or expenses with a type, amount, category, date, and optional note. The transaction view supports search by category or note, filtering by type, pagination, and server-side sorting support. MongoDB indexes make common user/date/type/category lookups efficient.

### Budgets

Set a spending limit for a category and month. FinTrack combines the limit with that month’s expense records to show amount spent, amount remaining, a progress bar, and an over-budget state. Saving a budget for an existing category/month updates it rather than creating a duplicate.

## Dashboard data views

| View | What it shows | Why it matters |
| --- | --- | --- |
| Financial overview | Current-month balance, income, and expenses | Quick cash-flow snapshot |
| Cash-flow trend | Income and expense totals across recent months | Reveals changes over time |
| Spending by category | Current-month expenses as a donut chart | Highlights major spending categories |
| Monthly budgets | Actual category spend against each limit | Helps catch overspending early |
| Transactions | Individual financial records | Supports detailed review and filtering |

Analytics are calculated using MongoDB aggregation pipelines rather than loading all records into the browser.

## Authorization and data ownership

FinTrack uses two layers of protection:

1. **Authentication:** protected endpoints require `Authorization: Bearer <JWT>`.
2. **Data ownership:** transaction and budget queries always include the authenticated user ID. A signed-in user cannot access another user’s records by changing a URL ID.

Accounts have either a `user` (default) or `admin` role. The JWT includes user ID and role, and reusable middleware supports restricted endpoints:

```js
router.get('/users', protect, authorize('admin'), listUsers);
```

### Current administrator behavior

The role-based authorization foundation is ready, but the current dashboard intentionally provides personal-finance views only. It does **not** yet include an administrator console or admin-only management routes. An `admin` account therefore has the same dashboard views as a regular user today.

Future admin functions can safely include user management, audit-log review, platform-wide reporting, and account moderation. Personal transactions and budgets should remain user-scoped unless an explicit audited admin policy is introduced.

## Technology

- **Client:** React, Vite, Axios, Recharts, Lucide icons
- **Server:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Security:** JWT, bcrypt, Helmet, CORS configuration, rate limiting, Zod validation

## Project structure

```text
FINTRACK/
├── client/                 # React dashboard
│   └── src/
│       ├── App.jsx         # Authentication and dashboard views
│       ├── api.js          # Axios client and JWT attachment
│       └── styles.css      # Responsive UI styling
├── server/                 # Express API
│   └── src/
│       ├── models/         # User, Transaction, Budget schemas and indexes
│       ├── routes/         # Auth, transaction, budget, analytics APIs
│       ├── middleware/     # JWT, authorization, validation, errors
│       └── server.js       # API entry point
└── README.md
```

## Run locally in VS Code

### Prerequisites

- Node.js 18 or newer (Node 22 is supported)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- VS Code with its integrated PowerShell terminal

### First-time setup

Open the `FINTRACK` folder in VS Code. Open a terminal with `Ctrl` + backtick, then run:

```powershell
npm install
npm run install:all
Copy-Item server\.env.example server\.env
```

Open `server/.env` and configure it. For local MongoDB:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fintrack
JWT_SECRET=replace_this_with_a_private_random_value_at_least_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`JWT_SECRET` must be at least 32 characters, remain private, and never be committed to source control. For MongoDB Atlas, replace `MONGO_URI` with the Atlas connection string.

Start both apps:

```powershell
npm run dev
```

Open:

- Application: [http://localhost:5173](http://localhost:5173)
- API health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

The frontend runs on port `5173`; the API runs on port `5000`. Vite proxies browser requests beginning with `/api` to the API during development. Stop both by pressing `Ctrl + C` in the terminal.

## API overview

All responses are JSON. Apart from registration, login, and health checking, each endpoint needs a valid bearer token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user and return a JWT |
| `POST` | `/api/auth/login` | Sign in and return a JWT |
| `GET` | `/api/auth/me` | Read the active user profile |
| `GET`, `POST` | `/api/transactions` | List or create personal transactions |
| `PATCH`, `DELETE` | `/api/transactions/:id` | Update or remove an owned transaction |
| `GET`, `PUT` | `/api/budgets` | Read or upsert monthly budgets |
| `DELETE` | `/api/budgets/:id` | Remove an owned budget |
| `GET` | `/api/analytics/dashboard` | Read totals, trends, categories, and recent activity |

## Production notes

Before deployment, use managed MongoDB, set a strong unique `JWT_SECRET`, configure the deployed client origin in `CLIENT_URL`, use HTTPS, and add database backups, monitoring, and automated tests before storing real financial data.
