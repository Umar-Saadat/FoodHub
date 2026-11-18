# 🍔 FoodHub — Full-Stack Food Delivery Web Application

FoodHub is a complete, production-ready, full-stack food delivery platform inspired by services like Uber Eats, Foodpanda, and DoorDash. Built with modern Python (FastAPI + SQLAlchemy) on the backend and React 18 (Vite + Tailwind CSS + Leaflet) on the frontend.

---

## 🌟 Highlights & Features

### 👤 Customer Experience
- **Dynamic Home Page:** Hero banners, category carousels, featured restaurants, popular dishes, stats counters, and interactive step-by-step guides.
- **Restaurant Discovery:** Real-time restaurant browsing, debounced search, cuisine filtering chips, and multiple sorting options (Top Rated, Fastest Delivery, Lowest Minimum).
- **Restaurant Details:** Rich header with operating metadata, tabbed menu navigation, customer reviews with star ratings, and an interactive **OpenStreetMap / Leaflet map** showing exact restaurant coordinates.
- **Menu & Dish Exploration:** Comprehensive dishes catalog, price range filtering, discount tags, prep times, and instant "Add to Cart" controls with in-place quantity increment/decrement.
- **Persistent Shopping Cart:** Server-synchronized cart across sessions, automated subtotal calculations, promo code validation engine (`WELCOME10`, `FREESHIP`), and delivery fee waivers.
- **Checkout Flow:** Saved delivery address selection, inline new address creation, Cash on Delivery (COD) and Stripe credit/debit card payment integration architecture.
- **Live Order Tracking:** Multi-stage order progress stepper (Pending → Confirmed → Preparing → Ready → Picked Up → Out for Delivery → Delivered), driver assignment card, and live tracking map.
- **Order History:** Paginated list of previous orders with colored status badges, itemized receipts, and cancellation capabilities where permitted.
- **User Profile Management:** Personal contact details editing, saved addresses CRUD (Home, Work, Apartment) with default toggles, and secure password updates.
- **Information & Support Pages:** Dedicated `/about` (company story & culinary philosophy), `/contact` (24/7 support channels & interactive ticket inquiry), and `/faq` (interactive searchable accordion).

### 🛡️ Administration Dashboard (`/admin`)
- **Executive Analytics:** Live revenue KPIs, 7-day sales breakdown, total registered customer counts, pending order alerts, and top-selling dishes.
- **User Management:** Full CRUD control over Customer, Driver, and Admin accounts, active/inactive status toggles, and credential updates.
- **Restaurant Management:** Create, edit, and archive partner restaurants, configure delivery zones, minimum orders, delivery fees, and upload restaurant cover images.
- **Menu Management:** Add dishes, manage item availability, set promotional discounts, prep times, and upload high-resolution food images.
- **Category Taxonomy:** Organize catalog taxonomy into culinary categories with automatic SEO-friendly slug generation.
- **Order Dispatch Center:** Monitor incoming orders in real time, transition order lifecycle states, and assign delivery drivers from the active fleet.
- **Fleet & Driver Tracking:** Live fleet monitor with OpenStreetMap visualizing driver locations, availability statuses, active deliveries, and vehicle details.
- **Promotions & Vouchers:** Create percentage discounts, fixed-amount vouchers, or free delivery codes with minimum order limits, usage quotas, and expiration dates.
- **Transaction Audit Logs:** Review all Cash on Delivery and online payment transactions with status badges, timestamps, and failure diagnostics.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | Python 3.13, FastAPI, Starlette, Uvicorn |
| **Database & ORM** | SQLite, SQLAlchemy 2.0, Alembic-ready |
| **Validation & Serialization** | Pydantic v2, Pydantic-Settings |
| **Authentication & Security** | PyJWT (HS256 access tokens), Bcrypt (password hashing), httpOnly refresh cookies |
| **Real-Time Communications** | WebSockets (`/ws/tracking/{order_id}`, `/ws/notifications`) |
| **Frontend Framework** | React 18, React Router v6, Vite |
| **Styling & Design System** | Tailwind CSS v3, Plus Jakarta Sans typography, Lucide React icons |
| **Mapping & Geospatial** | Leaflet 1.9, React-Leaflet, OpenStreetMap |
| **HTTP Client & State** | Axios (JWT request/response refresh interceptors), React Context API |

---

## 📁 Project Directory Structure

```
Food Hub/
├── backend/
│   ├── app/
│   │   ├── core/             # Configuration, security utils & auth dependencies
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── routers/          # FastAPI route controllers
│   │   ├── schemas/          # Pydantic validation & transfer schemas
│   │   ├── services/         # Domain business logic (Cart, Order, Payment, Promo)
│   │   ├── websocket/        # Real-time tracking manager
│   │   ├── database.py       # Engine & session factory
│   │   ├── main.py           # Application lifespan & entrypoint
│   │   └── seed.py           # Catalog & admin seeder
│   ├── uploads/              # Uploaded static media
│   ├── .env                  # Environment configuration
│   └── requirements.txt      # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI & Layout components
    │   ├── contexts/         # AuthContext, CartContext, ToastContext
    │   ├── hooks/            # Custom React hooks (e.g. useDebounce)
    │   ├── pages/            # Customer pages & Admin suite
    │   ├── services/         # Axios API clients
    │   ├── utils/            # Formatting & status utilities
    │   ├── App.jsx           # Routing & route guards
    │   └── main.jsx          # React DOM root
    ├── index.html            # Entry HTML
    ├── vite.config.js        # Vite dev proxy configuration
    └── tailwind.config.js    # Design tokens
```

---

## 🔑 Default Credentials

- **Admin Account:**
  - **Email:** `admin@foodhub.com`
  - **Password:** `Admin@FoodHub2024`
- **Customer Account (Pre-configured):**
  - **Email:** `hamza.test@example.com`
  - **Password:** `CustomerPassword123!`

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### 2. Backend Setup
```powershell
cd "backend"

# If not already created, create virtual environment:
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies:
pip install -r requirements.txt

# Configure environment:
# .env is already configured with a secure key and database URL.
# If creating from scratch: copy .env.example to .env and adjust variables.

# Run server:
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```powershell
cd "frontend"

# Install dependencies (if not already installed):
npm install

# Start Vite development server:
npm run dev
```
- Web Application: `http://localhost:5173`
- The Vite dev server automatically proxies `/api`, `/uploads`, and `/ws` requests to `http://127.0.0.1:8000`.

---

## 🧪 Production Build Verification

To verify that the frontend compiles cleanly for production:
```powershell
cd "frontend"
npm run build
```
Build outputs to `frontend/dist/` with 0 errors.

---

## 💳 Payment Configuration

FoodHub is architected to support two payment channels:
1. **Cash on Delivery (COD):** Fully functional out of the box. Orders can be marked confirmed, dispatched, and marked paid by admin or assigned drivers.
2. **Stripe Card Payments:** Configured via backend environment variables:
   - `STRIPE_SECRET_KEY`: Set your Stripe secret key (`sk_test_...`) in `backend/.env`.
   - `STRIPE_WEBHOOK_SECRET`: Set your Stripe webhook signing secret in `backend/.env`.
   - When keys are omitted, the frontend automatically falls back cleanly to Cash on Delivery.

---

## 🗺️ Geospatial & Mapping Support

FoodHub uses Leaflet and OpenStreetMap tiles without requiring proprietary API keys.
- **Restaurant Detail:** Shows exact restaurant location on interactive map.
- **Admin Fleet:** Real-time visual fleet overview showing available and busy drivers with vehicle details.
- **Order Tracking:** Live location rendering for drivers out on delivery routes.
