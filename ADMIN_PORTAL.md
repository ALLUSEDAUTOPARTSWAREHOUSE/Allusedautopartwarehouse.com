# AUAPW Admin Portal - Enterprise Dashboard

Complete admin portal with real-time KPI monitoring, secure session management, and merchant approval workflows.

---

## Admin Portal Access

### Admin Dashboard URL
```
http://localhost:3000/admin/login (development)
https://yourdomain.com/admin/login (production)
```

### Secure Admin Credentials

Your admin credentials are stored securely in environment variables:

**Email:** `ADMIN_EMAIL` environment variable  
**Password:** `ADMIN_PASSWORD` environment variable

These were configured when you added the environment variables to your Vercel/local project.

---

## Secure Backend Architecture

### Session Management
- **Storage:** httpOnly cookies (JavaScript cannot access, CSRF-safe)
- **Token Format:** HMAC-SHA256 signed JWT-like tokens
- **Expiration:** 8 hours
- **Verification:** Every request verifies HMAC signature against server secret

### Authentication Flow
1. Admin enters email + password
2. Server verifies credentials against `ADMIN_EMAIL` + `ADMIN_PASSWORD`
3. Server generates HMAC-signed token with 8-hour expiration
4. Token stored in secure httpOnly cookie
5. Subsequent requests automatically include cookie
6. Server validates signature on every protected request

### Why httpOnly Cookies?
- Immune to XSS attacks (JavaScript cannot steal)
- Immune to token leakage in localStorage
- Automatically sent with every request
- Supports CSRF protection via SameSite attribute

---

## Admin Portal Features

### Real-Time KPI Dashboard

Live metrics computed directly from database with 30-second refresh:

| KPI | Source | Meaning |
|-----|--------|---------|
| Daily Revenue | invoices.total | Total revenue today |
| Total Orders | COUNT(orders) | All orders placed |
| Avg Order Value | AVG(orders.total) | Average transaction |
| Approval Rate | seller_profiles approved/total | % Sellers approved |
| Fraud Rate | fraud_flags / transactions | % Flagged orders |
| Chargeback Rate | chargebacks / sales | % Disputed payments |
| Refund Rate | refunds / sales | % Refunded orders |
| Customer Satisfaction | AVG(seller_reviews.rating) | Average star rating |
| Avg Response Time | AVG(support_tickets.response_time) | Hours to respond |
| Avg Shipping Time | AVG(order_fulfillment.days_to_ship) | Days to fulfill |
| Inventory Turnover | sales / avg_inventory | Inventory velocity |

### Seller Approvals (Coming Soon)
- View pending KYB/KYC applications
- Review business documents
- Check fraud scores
- Approve/reject with commission tiers
- Email notifications to merchants

### Analytics
- Revenue trends
- Order patterns
- Fraud flag distribution
- Seller performance metrics
- Customer satisfaction trends

---

## How to Access Admin Portal

1. Navigate to: `http://localhost:3000/admin/login`
2. Enter your admin credentials:
   - Email: (from your `ADMIN_EMAIL` environment variable)
   - Password: (from your `ADMIN_PASSWORD` environment variable)
3. Click "Login"
4. Session cookie is automatically set
5. You're redirected to `/admin/dashboard`

### Session Features
- **Auto-login:** Revisit `/admin/dashboard` - no re-login needed if session valid
- **Logout:** Click "Logout" button in header - clears cookie, redirects to login
- **Session Timeout:** 8 hours of inactivity
- **Multi-window safe:** Session valid across all browser tabs

---

## API Endpoints

### Authentication Endpoints

**POST** `/api/admin/auth/login`
```json
Request: { "email": "admin@example.com", "password": "password" }
Response: { "success": true }
Sets: httpOnly cookie "adminSession"
```

**POST** `/api/admin/auth/logout`
```
Clears: adminSession cookie
Redirects: /admin/login
```

**GET** `/api/admin/auth/session`
```json
Response: { "authenticated": true, "email": "admin@example.com" }
(Protected route - returns 401 if not authenticated)
```

### KPI Endpoint

**GET** `/api/admin/kpis`
```json
Response: {
  "kpis": {
    "dailyRevenue": 12345.67,
    "totalOrders": 234,
    "averageOrderValue": 52.88,
    "approvalRate": 0.95,
    "fraudRate": 0.02,
    "chargebackRate": 0.003,
    "refundRate": 0.05,
    "customerSatisfaction": 4.7,
    "avgResponseTime": 2.3,
    "avgShippingTime": 2,
    "inventoryTurnover": 4.2
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
(Protected route - requires valid session cookie)
```

---

## Frontend Architecture

### Dashboard Component

Uses **SWR (Stale-While-Revalidate)** for optimal real-time updates:

```typescript
// Automatic refresh every 30 seconds with deduplication
const { data, error, isLoading } = useSWR(
  '/api/admin/kpis',
  fetcher,
  { 
    refreshInterval: 30000,  // 30s refresh
    dedupingInterval: 10000, // 10s dedup window
  }
)
```

### Why SWR?
- Automatic background refresh
- Request deduplication across components
- Graceful error handling
- Offline support with stale data
- Built-in revalidation on window focus

---

## Environment Variables Required

```bash
# Admin credentials (REQUIRED)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

# Database (REQUIRED)
DATABASE_URL=postgresql://user:pass@host/db

# Better Auth (for future customer auth)
BETTER_AUTH_SECRET=generated-secret-key

# Email (for notifications)
RESEND_API_KEY=re_xxxxx

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

---

## Security Practices Implemented

✓ HMAC-SHA256 token signing  
✓ httpOnly cookies (XSS immune)  
✓ SameSite=Lax CSRF protection  
✓ Server-side token validation on every request  
✓ 8-hour session expiration  
✓ Secure flag in production  
✓ No sensitive data in localStorage  
✓ Environment-variable based credentials  
✓ No default passwords in code  

---

## Testing the Admin Portal

### Test Scenario 1: Login and View KPIs
1. Open `http://localhost:3000/admin/login`
2. Enter your admin credentials
3. Observe dashboard with real-time metrics
4. Refresh page - metrics persist (session valid)
5. Wait 30 seconds - KPIs auto-update

### Test Scenario 2: Session Persistence
1. Login to admin portal
2. Open new browser tab
3. Visit `http://localhost:3000/admin/dashboard`
4. You're already logged in (session shared across tabs)

### Test Scenario 3: Logout
1. Click "Logout" button in header
2. Redirected to `/admin/login`
3. Visit `/admin/dashboard` - redirected back to login
4. Session cookie cleared

---

## Architecture Diagram

```
User Login Form
    ↓
POST /api/admin/auth/login
    ↓
Server Validates: ADMIN_EMAIL + ADMIN_PASSWORD
    ↓
Server Creates HMAC Token: HMAC-SHA256(secret, payload)
    ↓
Server Sets: httpOnly Cookie "adminSession"
    ↓
Client Redirected: /admin/dashboard
    ↓
SWR Auto-fetches: GET /api/admin/kpis
    ↓
Server Validates Cookie & HMAC Signature
    ↓
Database Query: SELECT SUM(total) FROM invoices WHERE date = TODAY
    ↓
Return Live KPIs
    ↓
Dashboard Renders Real-Time Metrics
    ↓
Auto-refresh every 30 seconds
```

---

## Troubleshooting

### "Invalid credentials" on login
- Verify `ADMIN_EMAIL` matches exactly (case-sensitive)
- Verify `ADMIN_PASSWORD` matches exactly
- Check for trailing spaces
- Verify environment variables are loaded

### "Session expired" error
- Session lasts 8 hours
- Log in again to start new session
- Check server clock is synchronized

### KPIs showing zero
- Database may be empty (new deployment)
- Create test orders/invoices to populate data
- Verify database connection working

### Logout not working
- Browser may have stale cookie
- Clear browser cookies and try again
- Check browser DevTools → Application → Cookies

---

## Production Deployment

### Before Going Live

1. **Change admin password** - Don't use default
2. **Set `BETTER_AUTH_SECRET`** - Use `openssl rand -base64 32`
3. **Enable HTTPS** - Secure flag required for cookies
4. **Set secure environment variables** in Vercel/hosting
5. **Test login flow** in production environment
6. **Enable MFA** - Recommended (Phase 2)

### Deployment Checklist

- [ ] ADMIN_EMAIL set
- [ ] ADMIN_PASSWORD set (strong password)
- [ ] BETTER_AUTH_SECRET set
- [ ] DATABASE_URL set (production DB)
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Cookies secure=true in production
- [ ] Monitoring/logging enabled
- [ ] Backup strategy in place

---

## Next Phases

### Phase 2 - Customer Experience
- Customer login + dashboard
- Order tracking
- VIN search
- Product recommendations
- Wishlist

### Phase 3 - Notifications
- Email templates (Resend)
- Real-time notifications
- Order status updates
- Marketing emails

### Phase 4 - Advanced Features
- AI product recommendations
- Live chat support
- Warranty registration
- Return management
- Reviews & ratings

---

**Version:** 2.0 (Secure Backend)  
**Last Updated:** January 2024  
**Status:** Production Ready

---

## Customer Portal

### Customer Login URL
```
/customer/login
```

### How to Create a Customer Account

1. Navigate to: `http://localhost:3000/customer/login` (local) or `https://yourdomain.com/customer/login` (production)
2. Click "Create Account"
3. Enter your email and create a password (minimum 6 characters)
4. Click "Create Account"
5. You'll automatically be logged in and redirected to your dashboard

### Customer Portal Features

Once logged in, customers have access to:

- **Dashboard Overview**
  - Total Orders
  - Total Spent
  - Wishlist Items
  - Quick action buttons

- **Order History**
  - View all orders
  - Order status tracking (Pending, Shipped, Delivered, Cancelled)
  - Tracking numbers
  - Order totals

- **Wishlist**
  - Save favorite parts
  - View wishlist items
  - Get quotes for wishlist items

- **Account Settings**
  - View/manage account information
  - Change password
  - Delete account

---

## Testing Credentials

### Test Admin Account
- Email: `admin@auapw.com`
- Password: `<value of ADMIN_PASSWORD>`
- Role: Administrator
- Access: Full admin dashboard with KPIs

### Test Customer Accounts
You can create multiple test customer accounts with any email:
- Email: `test@example.com`
- Password: `Password123` (must be 6+ characters)

---

## Environment Variables

### Admin Configuration

Set these in your `.env.local` or Vercel environment:

```env
# Admin credentials
ADMIN_EMAIL=admin@auapw.com
ADMIN_PASSWORD=choose-a-long-random-password

# Better Auth (required for customer sessions)
BETTER_AUTH_SECRET=your-secret-key-here
```

### Generate BETTER_AUTH_SECRET

If not set, generate a secure secret:

```bash
openssl rand -base64 32
```

---

## API Endpoints

### Admin Authentication

**POST** `/api/admin/auth/login`

Request body:
```json
{
  "username": "admin@auapw.com",
  "password": "<value of ADMIN_PASSWORD>"
}
```

Response (success):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "base64_encoded_token",
  "user": {
    "email": "admin@auapw.com",
    "role": "admin"
  }
}
```

### Customer Authentication

**POST** `/api/customer/auth/login`

Request body:
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

Response (success):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "base64_encoded_token",
  "customerId": "cust_xxxxx",
  "user": {
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

**POST** `/api/customer/auth/signup`

Request body:
```json
{
  "email": "newcustomer@example.com",
  "password": "password123"
}
```

Response (success):
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "base64_encoded_token",
  "customerId": "cust_xxxxx",
  "user": {
    "email": "newcustomer@example.com",
    "role": "customer"
  }
}
```

---

## Routes Overview

| Route | Purpose | Access |
|-------|---------|--------|
| `/admin/login` | Admin login page | Public |
| `/admin/dashboard` | Admin KPI dashboard | Authenticated Admin |
| `/customer/login` | Customer login/signup | Public |
| `/customer/dashboard` | Customer account dashboard | Authenticated Customer |
| `/api/admin/auth/login` | Admin authentication API | Public |
| `/api/customer/auth/login` | Customer login API | Public |
| `/api/customer/auth/signup` | Customer signup API | Public |

---

## Security Notes

1. **Change default admin password** in production
2. **Set strong BETTER_AUTH_SECRET** environment variable
3. **Use HTTPS** in production
4. **Store credentials securely** - never commit to version control
5. **Implement MFA** for admin accounts (recommended for future)
6. **Regular security audits** recommended

---

## Next Steps

### Phase 2 Features to Implement

1. **CRM Integration** - HubSpot sync
2. **Payment Processing** - Stripe Connect, Chase Merchant Services
3. **Fraud Detection** - Signifyd, Sift, SEON integration
4. **Email Notifications** - SendGrid templates
5. **Inventory Management** - Warehouse management system
6. **Business Intelligence** - Power BI integration
7. **Team Collaboration** - Microsoft Teams integration
8. **Customer Reviews** - Google Reviews, Trustpilot integration
9. **AI Assistant** - Product recommendations & support

---

## Support

For issues or questions about the admin/customer portal:

1. Check environment variables are set correctly
2. Clear browser cache and localStorage
3. Review console logs for errors
4. Contact: support@auapw.com

---

**Last Updated:** January 2024  
**Version:** 1.0

### Admin AI Chat

Open **AI Chat** in the admin navigation (`/admin/ai-chat`) after logging in.
The assistant answers general questions and helps draft replies; it cannot read
live business records or modify the dashboard. Conversation history is kept only
in the current page's memory and is cleared by **New chat** or a page reload.
Messages are sent to the AI provider: do not submit secrets or sensitive customer data.

The server uses the existing AI SDK and `google/gemini-2.5-flash-lite` through
Vercel AI Gateway. Vercel deployments can authenticate with their OIDC token;
local development needs AI Gateway authentication. Available Gateway credits
are required. No credentials are sent to the browser.
