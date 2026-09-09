# 🌾 KisanLink — Agricultural Marketplace & Price Discovery Platform

> **Sell smarter, not just higher.**  
> A full-stack agricultural linkage platform connecting Indian farmers directly with APMC Mandis, FPOs, and institutional bulk buyers with real-time transparent price discovery and 7-stage contract lifecycle management.

---

## 🌟 Key Features

- 📱 **Multi-Role Portals:** Tailored workflows for **Farmers**, **Buyers/Traders (MANDI, FPO, PRIVATE)**, and **Administrators**.
- 🌐 **Multilingual (Vernacular UI):** Real-time language switcher supporting **English**, **తెలుగు (Telugu)**, and **हिन्दी (Hindi)**.
- 📈 **Dynamic Pricing & Sparkline Trends:** 7-day price movements, net take-home calculation, handling deductions, and market recommendations.
- 🛒 **Transparent Deal Negotiation:** 7-stage contract lifecycle (`OFFER_SENT` → `BUYER_ACCEPTED` → `DEAL_CONFIRMED` → `IN_TRANSIT` → `DELIVERED` → `PAID` → `COMPLETED`).
- 🔐 **Secure JWT Authentication:** Token-based access control, bcrypt password hashing, and role-based route guards.
- 🗄️ **PostgreSQL + Prisma ORM:** Enterprise-grade relational schema with 11 models, 7 enums, cascading relations, and automated migrations.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** Vanilla HTML5, Modern Responsive CSS, Centralized REST API Client (`fetch`), Dynamic Localized UI.
- **Backend:** Node.js, Express.js (REST API v1), Middleware Pipeline, Input Validation.
- **Database:** PostgreSQL (with Prisma ORM v5.22).
- **Authentication:** JSON Web Tokens (Access + Refresh Tokens), Bcrypt.js (Salt Rounds: 10).
- **Cloud Deployment Ready:** Configured for Vercel (Frontend), Render / Railway / Docker (Backend + Database).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) or Docker

### 1. Backend Setup
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Run database migrations and generate Prisma client
npx prisma migrate deploy
npx prisma db seed

# Start development server
npm run dev
```

### 2. Open Frontend
Open `frontend/index.html` in your browser, or visit `http://localhost:5000` when the backend is running.

---

## 🧪 Testing

Run the automated test suite covering all 139 end-to-end integration scenarios:
```bash
cd backend
npm test
```

---

## ☁️ Deployment

Detailed cloud deployment instructions for Vercel, Render, Railway, and Docker can be found in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## 📄 License
MIT License.
