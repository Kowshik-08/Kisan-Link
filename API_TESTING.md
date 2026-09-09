# KisanLink Backend — API Testing & Verification Documentation
**Problem Statement Reference:** SIH26132 — *Strengthening Market Linkages and Price Discovery for Farmers*  
**Test Suite Status:** 88/88 Tests Passed (100% Success Rate)  
**Execution Environment:** Node.js v24.19.0 · Express.js · Prisma ORM

---

## 1. Test Summary & Verification Matrix

| Endpoint | Method | Success Code | Invalid Input (400) | Unauthorized (401/403) | Not Found (404) | Conflict/DB Error (409/500) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/api/v1/health` | `GET` | 200 | N/A | Public | N/A | N/A |
| `/api/v1/auth/register` | `POST` | 201 | 400 | Public | N/A | 409 (Duplicate phone) |
| `/api/v1/auth/login` | `POST` | 200 | 400 | 401 (Wrong pwd) | N/A | N/A |
| `/api/v1/auth/refresh` | `POST` | 200 | 400 | 401 (Bad token) | N/A | N/A |
| `/api/v1/auth/me` | `GET` | 200 | N/A | 401 (No token) | N/A | N/A |
| `/api/v1/auth/language` | `PATCH` | 200 | 400 | 401 (No token) | N/A | N/A |
| `/api/v1/auth/logout` | `POST` | 200 | N/A | Public | N/A | N/A |
| `/api/v1/farmer/ticker` | `GET` | 200 | N/A | Public | N/A | N/A |
| `/api/v1/farmer/trend/:cropSlug` | `GET` | 200 | N/A | Public | 404 (Unknown crop) | N/A |
| `/api/v1/farmer/discover-buyers` | `POST` | 200 | 400 (Negative qty) | Public | 404 (Unknown crop) | N/A |
| `/api/v1/buyer/stats` | `GET` | 200 | N/A | 403 (Farmer role) | N/A | N/A |
| `/api/v1/buyer/listings` | `GET` | 200 | N/A | 401 (No token) | N/A | N/A |
| `/api/v1/buyer/inquire` | `POST` | 201 | 400 | 401 (No token) | 404 (Unknown fmr) | N/A |
| `/api/v1/products` | `GET` | 200 | N/A | Public | N/A | N/A |
| `/api/v1/products/:id` | `GET` | 200 | N/A | Public | 404 (Unknown id) | N/A |
| `/api/v1/products` | `POST` | 201 | 400 | 403 (Farmer role) | N/A | 409 (Duplicate slug) |
| `/api/v1/products/:id` | `PUT` | 200 | 400 | 403 (Farmer role) | 404 (Unknown id) | N/A |
| `/api/v1/products/:id` | `DELETE` | 200 | N/A | 403 (Farmer role) | 404 (Unknown id) | N/A |
| `/api/v1/products/categories` | `GET` | 200 | N/A | Public | N/A | N/A |
| `/api/v1/products/categories` | `POST` | 201 | 400 | 403 (Farmer role) | N/A | 409 (Duplicate slug) |
| `/api/v1/cart` | `GET` | 200 | N/A | 401 (No token) | N/A | N/A |
| `/api/v1/cart/items` | `POST` | 201 | 400 | 401 (No token) | 404 (Bad product) | N/A |
| `/api/v1/cart/items/:itemId` | `PATCH` | 200 | 400 | 401 (No token) | 404 (Bad item) | N/A |
| `/api/v1/cart/items/:itemId` | `DELETE` | 200 | N/A | 401 (No token) | 404 (Bad item) | N/A |
| `/api/v1/cart` | `DELETE` | 200 | N/A | 401 (No token) | N/A | N/A |
| `/api/v1/orders` | `POST` | 201 | 400 | 403 (Buyer role) | 404 (Bad buyer) | N/A |
| `/api/v1/orders` | `GET` | 200 | N/A | 401 (No token) | N/A | N/A |
| `/api/v1/orders/:id` | `GET` | 200 | N/A | 403 (Unrelated usr)| 404 (Bad order) | N/A |
| `/api/v1/orders/:id/advance` | `PATCH` | 200 | 400 (Completed) | 403 (Unauthorized) | 404 (Bad order) | N/A |
| `/api/v1/addresses` | `GET` | 200 | N/A | 401 (No token) | N/A | N/A |
| `/api/v1/addresses` | `POST` | 201 | 400 | 401 (No token) | N/A | N/A |
| `/api/v1/addresses/:id` | `PUT` | 200 | 400 | 401 (No token) | 404 (Bad address) | N/A |
| `/api/v1/addresses/:id` | `DELETE` | 200 | N/A | 401 (No token) | 404 (Bad address) | N/A |
| `/api/v1/reviews` | `POST` | 201 | 400 (Rating > 5) | 401 (No token) | 404 (Bad order) | 409 (Duplicate rev)|
| `/api/v1/reviews/user` | `GET` | 200 | N/A | 401 (No token) | N/A | N/A |

---

## 2. Detailed Endpoint Specifications

### 2.1 Authentication Endpoints

#### 1. Register User
- **Method:** `POST`
- **URL:** `/api/v1/auth/register`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "fullName": "Anil Kumar",
  "phone": "9988776655",
  "password": "password123",
  "role": "FARMER",
  "village": "Mulugu",
  "district": "Warangal"
}
```
- **Expected Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "aaaa1111-1111-4111-a111-111111111111",
      "phone": "9988776655",
      "fullName": "Anil Kumar",
      "role": "FARMER",
      "preferredLanguage": "EN",
      "farmer": {
        "village": "Mulugu",
        "district": "Warangal"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
}
```
- **Error Cases Tested:**
  - `400 Bad Request`: Missing `fullName`, missing `password`, or invalid 10-digit mobile number.
  - `409 Conflict`: Phone number already registered.

---

#### 2. User Login
- **Method:** `POST`
- **URL:** `/api/v1/auth/login`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "identifier": "9876543210",
  "password": "password123",
  "role": "FARMER"
}
```
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "aaaa1111-1111-4111-a111-111111111111",
      "phone": "9876543210",
      "fullName": "Ramesh Patil",
      "role": "FARMER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
}
```
- **Error Cases Tested:**
  - `400 Bad Request`: Empty body or missing identifier.
  - `401 Unauthorized`: Incorrect password or non-existent mobile number.

---

#### 3. Refresh Token
- **Method:** `POST`
- **URL:** `/api/v1/auth/refresh`
- **Auth:** None (Body contains refresh token)
- **Request Body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```
- **Error Cases Tested:**
  - `401 Unauthorized`: Malformed, tempered, or expired refresh token.

---

#### 4. Current User Profile
- **Method:** `GET`
- **URL:** `/api/v1/auth/me`
- **Auth:** `Bearer <accessToken>`
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Current user profile retrieved.",
  "data": {
    "id": "aaaa1111-1111-4111-a111-111111111111",
    "phone": "9876543210",
    "fullName": "Ramesh Patil",
    "role": "FARMER",
    "preferredLanguage": "EN"
  }
}
```
- **Error Cases Tested:**
  - `401 Unauthorized`: Missing `Authorization: Bearer` header.

---

#### 5. Update Language Preference
- **Method:** `PATCH`
- **URL:** `/api/v1/auth/language`
- **Auth:** `Bearer <accessToken>`
- **Request Body:**
```json
{
  "language": "TE"
}
```
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Language preference updated.",
  "data": {
    "id": "aaaa1111-1111-4111-a111-111111111111",
    "preferredLanguage": "TE"
  }
}
```

---

### 2.2 Farmer Discovery & Pricing Engine Endpoints

#### 6. Market Ticker
- **Method:** `GET`
- **URL:** `/api/v1/farmer/ticker`
- **Auth:** None (Public)
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Market ticker prices retrieved.",
  "data": {
    "lastUpdated": "2026-09-09T17:15:00.000Z",
    "lastUpdatedHuman": "Last updated: 2 hours ago (eNAM feed)",
    "prices": [
      {
        "productId": "88888888-8888-4888-a888-888888888888",
        "cropSlug": "cotton",
        "label": "Cotton",
        "icon": "🌾",
        "pricePerKg": 62,
        "unit": "/kg"
      },
      {
        "productId": "66666666-6666-4666-a666-666666666666",
        "cropSlug": "onion",
        "label": "Onion",
        "icon": "🧅",
        "pricePerKg": 14,
        "unit": "/kg"
      },
      {
        "productId": "77777777-7777-4777-a777-777777777777",
        "cropSlug": "soybean",
        "label": "Soybean",
        "icon": "🌱",
        "pricePerKg": 44,
        "unit": "/kg"
      },
      {
        "productId": "55555555-5555-4555-a555-555555555555",
        "cropSlug": "tomato",
        "label": "Tomato",
        "icon": "🍅",
        "pricePerKg": 18,
        "unit": "/kg"
      },
      {
        "productId": "99999999-9999-4999-a999-999999999999",
        "cropSlug": "wheat",
        "label": "Wheat",
        "icon": "🌿",
        "pricePerKg": 24,
        "unit": "/kg"
      }
    ]
  }
}
```

---

#### 7. 7-Day Trend & Market Advisory
- **Method:** `GET`
- **URL:** `/api/v1/farmer/trend/tomato`
- **Auth:** None (Public)
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Price trend and advisory for tomato.",
  "data": {
    "cropSlug": "tomato",
    "cropName": "Tomato",
    "currentPrice": 18,
    "trendSeries": [14, 15, 15, 17, 16, 18, 18],
    "dayLabels": ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Today"],
    "percentageChange7d": 28.57,
    "direction": "trendIncreasing",
    "demandLevel": "demandHigh",
    "recommendation": {
      "key": "goodTimeToSell",
      "cssClass": "rec-go",
      "whyKey": "whyIncreasing"
    }
  }
}
```
- **Error Cases Tested:**
  - `404 Not Found`: Querying invalid crop slug e.g. `/api/v1/farmer/trend/unknown-crop`.

---

#### 8. Net Take-Home Return Comparison Engine
- **Method:** `POST`
- **URL:** `/api/v1/farmer/discover-buyers`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "cropSlug": "tomato",
  "quantity": 500,
  "unit": "KG",
  "location": "warangal",
  "qualityGrade": "GRADE_A"
}
```
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Ranked buyer options retrieved.",
  "data": {
    "querySummary": {
      "crop": "Tomato",
      "quantity": 500,
      "unit": "KG",
      "quantityKg": 500,
      "location": "Warangal",
      "qualityGrade": "GRADE_A"
    },
    "rankedBuyers": [
      {
        "buyerId": "eeee2222-2222-4222-a222-222222222222",
        "buyerName": "Sahyadri Farmers FPO",
        "buyerType": "fpo",
        "isBestReturn": true,
        "isVerified": true,
        "rating": 4.8,
        "totalDeals": 340,
        "freshness": "Live Quote",
        "distanceKm": 22,
        "priceOfferedPerKg": 18.9,
        "breakdown": {
          "grossAmount": 9450,
          "transportCost": 231,
          "marketFee": 284,
          "handlingCost": 70,
          "netTakeHome": 8865
        }
      },
      {
        "buyerId": "eeee1111-1111-4111-a111-111111111111",
        "buyerName": "Warangal APMC Market",
        "buyerType": "mandi",
        "isVerified": true,
        "rating": 4.6,
        "totalDeals": 212,
        "freshness": "Live Quote",
        "distanceKm": 12,
        "priceOfferedPerKg": 18,
        "breakdown": {
          "grossAmount": 9000,
          "transportCost": 126,
          "marketFee": 540,
          "handlingCost": 70,
          "netTakeHome": 8264
        }
      }
    ]
  }
}
```
- **Error Cases Tested:**
  - `400 Bad Request`: Negative quantity (`quantity: -50`).
  - `404 Not Found`: Non-existent crop commodity.

---

### 2.3 Buyer Portal Endpoints

#### 9. Buyer Dashboard Statistics
- **Method:** `GET`
- **URL:** `/api/v1/buyer/stats`
- **Auth:** `Bearer <accessToken>` (Role: `BUYER` or `ADMIN`)
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Buyer dashboard statistics retrieved.",
  "data": {
    "activeListingsNearYou": 11,
    "farmersContacted": 6,
    "dealsClosedThisMonth": 3,
    "currentActiveDeals": 1,
    "reputationScore": 4.6
  }
}
```
- **Error Cases Tested:**
  - `401 Unauthorized`: Token omitted.
  - `403 Forbidden`: Token belonging to `FARMER` role.

---

#### 10. Farmer Listings Feed
- **Method:** `GET`
- **URL:** `/api/v1/buyer/listings`
- **Auth:** `Bearer <accessToken>` (Role: `BUYER` or `ADMIN`)
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Active farmer listings retrieved.",
  "data": [
    {
      "farmerId": "dddd1111-1111-4111-a111-111111111111",
      "farmerName": "Ramesh Patil",
      "village": "Narsampet, Warangal",
      "crop": "Cotton",
      "icon": "🌾",
      "quantityDisplay": "500 kg",
      "askPrice": "₹63/kg",
      "updatedHuman": "20 min ago"
    }
  ]
}
```

---

#### 11. Inquire Farmer Lead
- **Method:** `POST`
- **URL:** `/api/v1/buyer/inquire`
- **Auth:** `Bearer <accessToken>` (Role: `BUYER`)
- **Request Body:**
```json
{
  "farmerId": "dddd1111-1111-4111-a111-111111111111",
  "cropName": "Tomato",
  "message": "Interested in 500kg lot."
}
```
- **Expected Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Inquiry sent to farmer successfully.",
  "data": {
    "inquiryId": "INQ-1741519000000",
    "farmerName": "Ramesh Patil",
    "farmerPhone": "9876543210",
    "crop": "Tomato",
    "status": "SENT"
  }
}
```
- **Error Cases Tested:**
  - `404 Not Found`: Target `farmerId` does not exist.

---

### 2.4 Product & Category Endpoints

#### 12. List & Filter Products
- **Method:** `GET`
- **URL:** `/api/v1/products?category=vegetables&search=tomato&minPrice=10&maxPrice=30`
- **Auth:** None (Public)
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Products retrieved successfully.",
  "data": [
    {
      "id": "55555555-5555-4555-a555-555555555555",
      "name": "Tomato",
      "slug": "tomato",
      "icon": "🍅",
      "basePrice": 18,
      "category": {
        "id": "11111111-1111-4111-a111-111111111111",
        "name": "Perishable Vegetables",
        "slug": "vegetables"
      }
    }
  ]
}
```

---

#### 13. Create Product (Admin Only)
- **Method:** `POST`
- **URL:** `/api/v1/products`
- **Auth:** `Bearer <accessToken>` (Role: `ADMIN`)
- **Request Body:**
```json
{
  "name": "Chilli",
  "slug": "chilli",
  "icon": "🌶️",
  "basePrice": 85.0,
  "categoryId": "11111111-1111-4111-a111-111111111111"
}
```
- **Expected Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Product created successfully.",
  "data": {
    "id": "12345678-1234-4234-a234-123456789012",
    "name": "Chilli",
    "slug": "chilli",
    "basePrice": 85
  }
}
```
- **Error Cases Tested:**
  - `403 Forbidden`: Called with `FARMER` or `BUYER` token.
  - `409 Conflict`: Product slug already exists.

---

### 2.5 Cart (Trade Lot Staging) Endpoints

#### 14. Get Active Cart
- **Method:** `GET`
- **URL:** `/api/v1/cart`
- **Auth:** `Bearer <accessToken>`
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User cart retrieved.",
  "data": {
    "cartId": "c1111111-1111-4111-a111-111111111111",
    "totalItems": 1,
    "totalQuantityKg": 500,
    "items": [
      {
        "id": "cit-0001",
        "quantity": 500,
        "unit": "KG",
        "qualityGrade": "GRADE_A",
        "product": {
          "name": "Tomato",
          "basePrice": 18
        }
      }
    ]
  }
}
```

---

#### 15. Add Item to Cart
- **Method:** `POST`
- **URL:** `/api/v1/cart/items`
- **Auth:** `Bearer <accessToken>`
- **Request Body:**
```json
{
  "productId": "55555555-5555-4555-a555-555555555555",
  "quantity": 400,
  "unit": "KG",
  "qualityGrade": "GRADE_A",
  "targetPricePerKg": 19.5
}
```
- **Expected Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Item added to trade cart.",
  "data": {
    "id": "cit-0002",
    "quantity": 400,
    "unit": "KG",
    "qualityGrade": "GRADE_A"
  }
}
```

---

### 2.6 Orders & 7-Stage Deal Lifecycle Endpoints

#### 16. Initiate Deal Order
- **Method:** `POST`
- **URL:** `/api/v1/orders`
- **Auth:** `Bearer <accessToken>` (Role: `FARMER`)
- **Request Body:**
```json
{
  "buyerId": "eeee1111-1111-4111-a111-111111111111",
  "productId": "55555555-5555-4555-a555-555555555555",
  "quantity": 500,
  "unit": "KG",
  "qualityGrade": "GRADE_A",
  "agreedPricePerKg": 18.0,
  "distanceKm": 12
}
```
- **Expected Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Produce deal order initiated successfully.",
  "data": {
    "order": {
      "id": "ord-0001",
      "orderNumber": "KL-2026-9041",
      "dealStage": "OFFER_SENT",
      "paymentStatus": "PENDING",
      "grossAmount": 9000,
      "transportCost": 126,
      "marketFee": 540,
      "handlingCost": 70,
      "netAmount": 8264
    },
    "lifecycle": {
      "currentStage": "OFFER_SENT",
      "stageTitle": "Offer sent",
      "stageIndex": 0,
      "totalStages": 7,
      "allStages": [
        "Offer sent",
        "Buyer accepts",
        "Deal confirmed",
        "Dispatch",
        "Delivery",
        "Payment",
        "Rate buyer"
      ]
    }
  }
}
```

---

#### 17. Advance Deal Stage
- **Method:** `PATCH`
- **URL:** `/api/v1/orders/:orderId/advance`
- **Auth:** `Bearer <accessToken>` (Farmer or Buyer participant in order)
- **Expected Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Deal transitioned to [BUYER_ACCEPTED].",
  "data": {
    "orderId": "ord-0001",
    "orderNumber": "KL-2026-9041",
    "previousStage": "OFFER_SENT",
    "currentStage": "BUYER_ACCEPTED",
    "stageTitle": "Buyer accepts",
    "stageIndex": 1,
    "isCompleted": false
  }
}
```
- **Error Cases Tested:**
  - `400 Bad Request`: Calling advance on an already completed deal (`COMPLETED_RATED`).
  - `403 Forbidden`: Called by a user who is neither the buyer nor the farmer of the order.
  - `404 Not Found`: Order ID does not exist.

---

### 2.7 Addresses Endpoints

#### 18. Create Address
- **Method:** `POST`
- **URL:** `/api/v1/addresses`
- **Auth:** `Bearer <accessToken>`
- **Request Body:**
```json
{
  "title": "Secondary Farm Plot",
  "village": "ReddyPalem",
  "mandal": "Hanamkonda",
  "district": "Warangal",
  "state": "Telangana",
  "pincode": "506001",
  "isDefault": false
}
```
- **Expected Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Address added successfully.",
  "data": {
    "id": "adr-0001",
    "title": "Secondary Farm Plot",
    "village": "ReddyPalem",
    "district": "Warangal"
  }
}
```

---

### 2.8 Review & Rating Endpoints

#### 19. Submit Review (Stage 7)
- **Method:** `POST`
- **URL:** `/api/v1/reviews`
- **Auth:** `Bearer <accessToken>`
- **Request Body:**
```json
{
  "orderId": "ord-0001",
  "rating": 5,
  "comment": "Fair price, quick delivery inspection, and immediate payment!"
}
```
- **Expected Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Deal rating and review submitted successfully.",
  "data": {
    "id": "rev-0001",
    "orderId": "ord-0001",
    "rating": 5,
    "comment": "Fair price, quick delivery inspection, and immediate payment!"
  }
}
```
- **Error Cases Tested:**
  - `400 Bad Request`: Rating outside range $1 \le \text{rating} \le 5$ (e.g. `rating: 7`).
  - `404 Not Found`: Order does not exist.
  - `409 Conflict`: Review already submitted for this order.

---

## 3. How to Run the Automated Test Suite

To run all 88 test assertions across all endpoints:

```bash
cd backend
npm test
```

Sample output:
```
=============================================================
🧪 KISANLINK BACKEND AUTOMATED TEST SUITE
=============================================================

📦 1. SYSTEM & ROUTING TESTS
  ✅ PASSED: GET /api/v1/health returns 200 OK
  ✅ PASSED: Non-existent route returns 404 Not Found

📦 2. AUTHENTICATION & AUTHORIZATION TESTS
  ✅ PASSED: Farmer Login with valid 10-digit phone returns 200 OK
  ✅ PASSED: Registering duplicate phone returns 409 Conflict
  ✅ PASSED: GET /api/v1/auth/me without token returns 401 Unauthorized

📦 3. FARMER DISCOVERY & PRICING ENGINE TESTS
  ✅ PASSED: GET /api/v1/farmer/ticker returns 200 OK
  ✅ PASSED: Arithmetic integrity: netTakeHome == gross - transport - fee - handling

...
=============================================================
🎉 TEST EXECUTION FINISHED: 88/88 TESTS PASSED
=============================================================
```
