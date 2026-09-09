# KisanLink Backend REST API
**Architecture:** Node.js · Express.js · PostgreSQL · Prisma ORM · JWT · Bcrypt  
**Problem Statement Reference:** SIH26132 — *Strengthening Market Linkages and Price Discovery for Farmers*

---

## 1. Features & Capabilities

- **Role-Based Authentication (RBAC)**: Secure registration & login for `FARMER`, `BUYER`, and `ADMIN`. Mobile-number validation for farmers/buyers (10 digits), hashed with bcrypt.
- **Farmer Pricing Engine**: Real-time calculation of net take-home returns across APMC Mandis, FPOs, and Private Buyers factoring in gross prices, transport logistics, mandi fees, and handling charges.
- **Market Ticker & 7-Day Trend Advisory**: Real-time ticker and 7-day sparkline trend data with Sell vs. Wait recommendations.
- **B2B Agricultural Lot Cart**: Draft trade lot staging system allowing farmers or buyers to stage produce lots before formal deal execution.
- **7-Stage Deal Workflow**: Complete transaction management from initial offer to buyer acceptance, confirmation, dispatch, delivery, payment release, and mutual review ratings.
- **Buyer Feed & Outreach**: Live feed of nearby farmer harvest lots with direct buyer inquiry creation.
- **Addresses & Geolocation**: Farm origin and buyer hub addresses with coordinates and district mapping for logistics fare calculations.
- **Review & Rating System**: 1-to-5 star mutual reviews updating buyer reputation and deal counts.

---

## 2. Directory Structure

```
backend/
├── package.json
├── .env.example
├── .env
├── prisma/
│   ├── schema.prisma      # Complete PostgreSQL Prisma ORM schema
│   └── seed.js            # Initial seed data for crops, categories, users, buyers
└── src/
    ├── server.js          # Entry point & graceful shutdown
    ├── app.js             # Express app setup, CORS, logging, routes
    ├── config/
    │   ├── db.js          # PrismaClient singleton
    │   └── env.js         # Environment configuration
    ├── middleware/
    │   ├── auth.middleware.js     # Bearer JWT token verification
    │   ├── role.middleware.js     # RBAC role enforcement (FARMER, BUYER, ADMIN)
    │   ├── validate.middleware.js # Request payload validation
    │   └── error.middleware.js    # Centralized error handler & 404
    ├── utils/
    │   ├── apiResponse.js         # Standard JSON response wrapper
    │   ├── apiError.js            # Custom error class with HTTP status
    │   └── calculation.js         # KisanLink net return & trend formulas
    ├── services/
    │   ├── auth.service.js        # Auth, JWT generation, password hashing
    │   ├── farmer.service.js      # Ticker, trend advisory, best buyer discovery
    │   ├── buyer.service.js       # Dashboard stats, listing feed, inquiries
    │   ├── product.service.js     # Product & Category CRUD, search & filters
    │   ├── cart.service.js        # Cart & CartItems lot staging
    │   ├── order.service.js       # 7-stage deal order management
    │   ├── address.service.js     # Address management
    │   └── review.service.js      # Stage 7 review & rating engine
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── farmer.controller.js
    │   ├── buyer.controller.js
    │   ├── product.controller.js
    │   ├── cart.controller.js
    │   ├── order.controller.js
    │   ├── address.controller.js
    │   └── review.controller.js
    └── routes/
        ├── index.js               # Route aggregator mounted at /api/v1
        ├── auth.routes.js         # /api/v1/auth
        ├── farmer.routes.js       # /api/v1/farmer
        ├── buyer.routes.js        # /api/v1/buyer
        ├── product.routes.js      # /api/v1/products
        ├── cart.routes.js         # /api/v1/cart
        ├── order.routes.js        # /api/v1/orders
        ├── address.routes.js      # /api/v1/addresses
        └── review.routes.js       # /api/v1/reviews
```

---

## 3. Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure your PostgreSQL connection:
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/kisanlink?schema=public"
JWT_SECRET="kisanlink-super-secret-access-token-key-2026"
JWT_REFRESH_SECRET="kisanlink-super-secret-refresh-token-key-2026"
CLIENT_URL="*"
```

### 3. Run Prisma Migrations & Seed Data
```bash
# Generate Prisma Client
npx prisma generate

# Push database schema to PostgreSQL
npx prisma db push

# Seed initial commodities, buyers, and sample deals
npm run prisma:seed
```

### 4. Start the Server
```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000/api/v1`.

---

## 4. API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Register new user (`FARMER` or `BUYER`).
- `POST /api/v1/auth/login`: Login with 10-digit mobile number or admin ID.
- `POST /api/v1/auth/refresh`: Refresh expired access token.
- `GET /api/v1/auth/me`: Get current authenticated user profile (Bearer token required).
- `PATCH /api/v1/auth/language`: Update user's preferred language (`EN`, `TE`, `HI`).

### Farmer Discovery (`/api/v1/farmer`)
- `GET /api/v1/farmer/ticker`: Get today's market price ticker with freshness indicator.
- `GET /api/v1/farmer/trend/:cropSlug`: Get 7-day sparkline and sell/wait advisory.
- `POST /api/v1/farmer/discover-buyers`: Core calculation engine comparing buyers by net return.

### Buyer Portal (`/api/v1/buyer`)
- `GET /api/v1/buyer/stats`: Dashboard summary statistics.
- `GET /api/v1/buyer/listings`: Browse nearby farmer harvest listings.
- `POST /api/v1/buyer/inquire`: Submit direct inquiry to a farmer.

### Products & Categories (`/api/v1/products`)
- `GET /api/v1/products`: Search and filter commodities (`?search=tomato&category=vegetables&minPrice=10`).
- `GET /api/v1/products/:id`: Get commodity details by ID or slug.
- `POST /api/v1/products`: Create product (Admin only).
- `PUT /api/v1/products/:id`: Update product (Admin only).
- `DELETE /api/v1/products/:id`: Delete product (Admin only).
- `GET /api/v1/products/categories`: Get commodity categories.

### Trade Cart (`/api/v1/cart`)
- `GET /api/v1/cart`: Get active trade cart.
- `POST /api/v1/cart/items`: Add commodity lot to cart.
- `PATCH /api/v1/cart/items/:itemId`: Update lot quantity or quality grade.
- `DELETE /api/v1/cart/items/:itemId`: Remove lot from cart.
- `DELETE /api/v1/cart`: Clear cart.

### Orders / Deals (`/api/v1/orders`)
- `POST /api/v1/orders`: Initiate a deal order from a buyer quote (Farmer only).
- `GET /api/v1/orders`: Get user's active and completed deals.
- `GET /api/v1/orders/:id`: Get detailed deal status and 7-stage lifecycle state.
- `PATCH /api/v1/orders/:orderId/advance`: Transition deal to the next stage ($0 \rightarrow 6$).

### Addresses (`/api/v1/addresses`)
- `GET /api/v1/addresses`: Get user addresses.
- `POST /api/v1/addresses`: Create address (farm location or buyer warehouse).
- `PUT /api/v1/addresses/:id`: Update address.
- `DELETE /api/v1/addresses/:id`: Delete address.

### Reviews (`/api/v1/reviews`)
- `POST /api/v1/reviews`: Submit 1–5 star rating on deal completion (Stage 7).
- `GET /api/v1/reviews/user/:userId`: Get all reviews for a buyer or farmer.
