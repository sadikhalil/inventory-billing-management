# InvoTrack — Smart Inventory & Billing Management System

A professional full-stack web application for managing business inventory, orders, invoices, and analytics. Built for internal use by business staff including admins, managers, cashiers, and viewers.

---

## What is InvoTrack?

InvoTrack is a **back-office management system** designed for product-based businesses such as shops, warehouses, and wholesale distributors. It replaces manual spreadsheets and paper records with a centralized digital platform where your entire team can manage stock, process orders, generate invoices, and monitor business performance in real time.

This is **not a public-facing storefront**. It is a private internal tool used only by authorized staff members.

---

## Who Uses It

| Role | Who they are | What they can do |
|---|---|---|
| **Admin** | Shop owner or system administrator | Full access — manages everything including user accounts |
| **Manager** | Store or inventory manager | Manages products, confirms orders, adjusts stock |
| **Cashier** | Billing counter staff | Creates orders, generates invoices, records payments |
| **Viewer** | Accountant or auditor | Read-only access to all data and reports |

---

## Core Modules

### Products
Manage your complete product catalog with full CRUD operations.

Each product contains a name, SKU code, barcode, category, buying price, selling price, tax rate, current stock quantity, reorder point, supplier name, and warehouse location. The system automatically calculates profit margin, stock value, and stock status for every product. When stock falls below the reorder point an alert is shown on the inventory page.

### Orders
Process customer purchases from creation to delivery.

When a cashier creates an order, the system automatically deducts the ordered quantities from stock and records a movement in the inventory log. Orders move through a tracked status flow from pending to processing to shipped to delivered. Every status change is recorded with a timestamp and the name of the staff member who made the change. Payment status is tracked separately and can be updated as partial or full payment is received.

### Billing and Invoices
Generate professional invoices and track payments.

Invoices are created with full customer details, line items, discounts, tax calculations, and payment terms. The system automatically calculates subtotals, tax amounts, and totals. Each invoice gets a unique sequential number. Invoices can be downloaded as a professionally formatted PDF. Payment status is tracked and overdue invoices are highlighted separately. When full payment is recorded the invoice is automatically marked as paid.

### Inventory
Track every movement of stock with a complete audit trail.

Every time stock changes — whether through a sale, purchase, return, damage, or manual adjustment — the movement is recorded with the type, quantity, stock before, stock after, reference document, and the staff member who made the change. This gives a complete history of where every unit went. Managers can record stock adjustments for new purchases, returns, or damaged goods directly from the inventory page.

### Analytics
Monitor business performance with visual charts and reports.

The dashboard shows current month revenue, order count, total products, and pending invoices — all with month-over-month growth percentages. Deeper reports include a monthly revenue trend chart, top products by revenue, sales broken down by category, and full inventory valuation showing stock at both cost price and retail price per category. All reports can be filtered by time period from 7 days to 1 year.

### Users and Roles
Control who can access the system and what they can do.

The admin creates all staff accounts and assigns roles. Each role has specific permissions — for example a cashier can create invoices but cannot delete products or manage other users. The admin can edit roles, change account status, and deactivate accounts for staff who leave the company. Role permissions are enforced on both the frontend interface and the backend API routes.

---

## How a Typical Order Works

```
1.  Customer comes in and wants to buy items

2.  Cashier logs in and goes to Orders
    Creates a new order with:
    - Customer name, email, phone
    - Items and quantities

3.  System automatically:
    - Assigns an order number (ORD-001041)
    - Deducts stock for each item
    - Records inventory movements
    - Sets order status to Pending
    - Sets payment status to Unpaid

4.  Manager confirms the order
    Changes status: Pending → Processing

5.  Items are packed and sent out
    Manager changes status: Processing → Shipped

6.  Customer receives the items
    Manager changes status: Shipped → Delivered

7.  Cashier goes to Billing and creates an invoice
    - Adds line items with prices
    - Sets payment terms (Net 30, Due on receipt, etc.)
    - Invoice number assigned automatically (INV-2026-00042)

8.  Cashier downloads the PDF invoice
    Emails it to the customer

9.  Customer pays
    Cashier records the payment in the invoice
    Invoice status changes to Paid

10. If customer returns items
    Manager marks order as Refunded
    Records stock adjustment (Return) in Inventory
    Stock goes back up automatically
```

---

## Invoice Flow

```
Draft → Sent → Paid
                 ↓
              Refunded (if return)

If payment date passes without payment:
Draft → Sent → Overdue
```

---

## Order Status Flow

```
Pending → Processing → Shipped → Delivered
                                      ↓
                                  Refunded (if return)

Pending or Processing → Cancelled (if order cancelled)
```

---

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) with access and refresh tokens
- **Password hashing:** bcrypt with 12 rounds
- **PDF generation:** PDFKit
- **Validation:** express-validator on every route
- **Logging:** Winston with daily rotating log files
- **Security:** Helmet, CORS, rate limiting

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP client:** Axios with automatic token refresh
- **Charts:** Chart.js with React-Chartjs-2
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Build tool:** Vite

---

## API Overview

The backend exposes a REST API at `/api/v1` with the following resources:

| Resource | Endpoints | Description |
|---|---|---|
| Auth | POST /auth/login, /auth/register, /auth/logout, /auth/refresh | Authentication and session management |
| Auth (Admin) | POST /auth/register-staff | Create staff accounts with specific roles |
| Products | GET, POST, PUT, DELETE /products | Full product CRUD |
| Products | GET /products/barcode/:code, /products/sku/:sku | Lookup by barcode or SKU |
| Products | GET /products/low-stock, /products/categories | Stock alerts and category list |
| Orders | GET, POST /orders | List and create orders |
| Orders | PATCH /orders/:id/status, /orders/:id/payment | Update order and payment status |
| Invoices | GET, POST, PUT /invoices | List and manage invoices |
| Invoices | GET /invoices/:id/pdf | Download PDF invoice |
| Invoices | POST /invoices/:id/payments | Record a payment |
| Inventory | GET /inventory/movements, /inventory/summary | Stock movement log and summary |
| Inventory | POST /inventory/adjust | Record stock adjustment |
| Analytics | GET /analytics/dashboard | Revenue, orders, products summary |
| Analytics | GET /analytics/sales | Revenue by month |
| Analytics | GET /analytics/top-products | Best selling products |
| Analytics | GET /analytics/inventory-value | Stock value by category |
| Analytics | GET /analytics/sales-by-category | Revenue by category |
| Users | GET, PATCH, DELETE /users, /users/:id | User management (admin only) |

All protected routes require a valid JWT token in the Authorization header. Role-based middleware ensures each route is accessible only to authorized roles.

---

## Security Features

- JWT access tokens expire after 7 days
- JWT refresh tokens expire after 30 days and are stored in the database
- Passwords are hashed with bcrypt before storage
- Rate limiting prevents brute force attacks (100 requests per 15 minutes, 10 login attempts per 15 minutes)
- Helmet sets secure HTTP headers
- CORS is configured to only allow requests from the frontend origin
- All inputs are validated and sanitized on the server before processing
- Soft deletes are used so data is never permanently removed
- Every data change includes the ID of the staff member who made it

---

## Database Models

### User
Stores staff accounts with name, email, hashed password, role, department, active status, last login timestamp, and refresh token.

### Product
Stores the full product catalog with pricing, stock, reorder points, supplier details, and virtual fields for profit margin, stock value, and stock status.

### Order
Stores customer orders with a snapshot of product details at time of order, calculated totals, status history with timestamps, and payment tracking.

### Invoice
Stores invoices with line items, calculated totals, payment terms, due dates, payment records, and PDF path.

### InventoryMovement
Stores every stock change with type, quantity, stock before and after values, reference to the source document, and the staff member who recorded it.

---

## Features Summary

- Product catalog with barcode and SKU lookup
- Real-time stock tracking with automatic deduction on orders
- Low stock alerts and reorder point monitoring
- Complete order lifecycle management with status tracking
- Professional PDF invoice generation and download
- Payment tracking with partial payment support
- Overdue invoice detection and filtering
- Monthly revenue and sales analytics
- Top products report
- Inventory value report by category
- Complete stock movement audit trail
- Role-based access control with 4 permission levels
- Admin user management with account creation and deactivation
- JWT authentication with automatic token refresh
- Server-side validation on all inputs
- Global error handling with proper HTTP status codes
- Daily rotating server logs
- Mobile-responsive interface
- Landing page with feature overview and demo access

---

## Project Structure

```
smart-inventory-billing/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         MongoDB connection
│   │   │   └── logger.js           Winston logger setup
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── invoice.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── inventory.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  JWT verification and RBAC
│   │   │   ├── errorHandler.js     Global error handler
│   │   │   ├── notFound.js         404 handler
│   │   │   └── validate.js         Request validation
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Product.model.js
│   │   │   ├── Order.model.js
│   │   │   ├── Invoice.model.js
│   │   │   └── InventoryMovement.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── invoice.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   └── user.routes.js
│   │   ├── utils/
│   │   │   ├── AppError.js         Custom error class
│   │   │   ├── pdfGenerator.js     PDF invoice generator
│   │   │   └── seeder.js           Database seeder
│   │   └── server.js               Express app entry point
│   ├── tests/
│   │   └── api.test.js             API test suite
│   └── .env                        Environment variables
│
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/
        │   │   └── ProtectedRoute.jsx
        │   ├── common/
        │   │   ├── Modal.jsx
        │   │   └── index.jsx       Shared UI components
        │   └── layout/
        │       ├── Layout.jsx
        │       ├── Sidebar.jsx
        │       └── Topbar.jsx
        ├── context/
        │   └── AuthContext.jsx     Global auth state
        ├── hooks/
        │   └── useAsync.js         Async and pagination hooks
        ├── pages/
        │   ├── Landing.jsx         Public landing page
        │   ├── Login.jsx           Login page
        │   ├── Dashboard.jsx
        │   ├── Products.jsx
        │   ├── Orders.jsx
        │   ├── Billing.jsx
        │   ├── Analytics.jsx
        │   ├── Inventory.jsx
        │   ├── Users.jsx
        │   └── NotFound.jsx
        ├── utils/
        │   ├── api.js              Axios client with interceptors
        │   └── helpers.js          Utility functions
        ├── App.jsx                 Root component with routes
        └── main.jsx                React entry point
```

---

## Default Login Credentials

After running the database seeder, these accounts are available:

| Role | Email | Password |
|---|---|---|
| Admin | admin@invotrack.com | Admin@1234 |
| Manager | manager@invotrack.com | Manager@1234 |
| Cashier | cashier@invotrack.com | Cashier@1234 |
| Viewer | viewer@invotrack.com | Viewer@1234 |

Change these credentials before using in a real business environment.