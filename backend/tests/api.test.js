process.env.NODE_ENV = 'test';
process.env.USE_MOCK_DB = 'true';
process.env.PORT = '0'; // Ephemeral port for test

const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

// Global test tokens & test state
let farmerToken = '';
let buyerToken = '';
let adminToken = '';
let sampleOrderId = '';
let sampleAddressId = '';
let sampleCartItemId = '';
let sampleProductId = '';
let sampleFarmerId = 'dddd1111-1111-4111-a111-111111111111';
let sampleBuyerId = 'eeee1111-1111-4111-a111-111111111111'; // Warangal APMC Market (matches buyerToken)

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`  ✅ PASSED: ${message}`);
  }
}

async function request(method, path, { body, token } = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 KISANLINK BACKEND AUTOMATED TEST SUITE');
  console.log('=============================================================\n');

  // Start ephemeral server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`📡 Test Server running at: ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // 1. SYSTEM HEALTH & 404 TESTS
    // -------------------------------------------------------------
    console.log('📦 1. SYSTEM & ROUTING TESTS');
    {
      const res = await request('GET', '/api/v1/health');
      assert(res.status === 200, 'GET /api/v1/health returns 200 OK');
      assert(res.data.status === 'healthy', 'Health check reports healthy');

      const notFoundRes = await request('GET', '/api/v1/non-existent-route');
      assert(notFoundRes.status === 404, 'Non-existent route returns 404 Not Found');
      assert(notFoundRes.data.success === false, 'Error response format has success: false');
    }

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & USERS
    // -------------------------------------------------------------
    console.log('\n📦 2. AUTHENTICATION & AUTHORIZATION TESTS');
    {
      // 2.1 Farmer Login
      const loginRes = await request('POST', '/api/v1/auth/login', {
        body: { identifier: '9876543210', password: 'password123', role: 'FARMER' },
      });
      assert(loginRes.status === 200, 'Farmer Login with valid 10-digit phone returns 200 OK');
      assert(loginRes.data.data.tokens.accessToken, 'Login issues access token');
      farmerToken = loginRes.data.data.tokens.accessToken;

      // 2.2 Buyer Login
      const buyerLogin = await request('POST', '/api/v1/auth/login', {
        body: { identifier: '9123456780', password: 'password123', role: 'BUYER' },
      });
      assert(buyerLogin.status === 200, 'Buyer Login returns 200 OK');
      buyerToken = buyerLogin.data.data.tokens.accessToken;

      // 2.3 Admin Login
      const adminLogin = await request('POST', '/api/v1/auth/login', {
        body: { identifier: 'ADMIN001', password: 'admin123', role: 'ADMIN' },
      });
      assert(adminLogin.status === 200, 'Admin Login with adminCode returns 200 OK');
      adminToken = adminLogin.data.data.tokens.accessToken;

      // 2.4 Invalid Login Credentials
      const badLogin = await request('POST', '/api/v1/auth/login', {
        body: { identifier: '9876543210', password: 'wrongpassword' },
      });
      assert(badLogin.status === 401, 'Login with incorrect password returns 401 Unauthorized');

      // 2.5 Validation: Missing Fields
      const emptyLogin = await request('POST', '/api/v1/auth/login', { body: {} });
      assert(emptyLogin.status === 400, 'Login with missing fields returns 400 Bad Request');

      // 2.6 Registration: Success
      const newPhone = '9988776655';
      const regRes = await request('POST', '/api/v1/auth/register', {
        body: {
          fullName: 'Anil Kumar',
          phone: newPhone,
          password: 'password123',
          role: 'FARMER',
          village: 'Mulugu',
          district: 'Warangal',
        },
      });
      assert(regRes.status === 201, 'Farmer registration returns 201 Created');
      assert(regRes.data.data.user.fullName === 'Anil Kumar', 'Registered user matches name');

      // 2.7 Registration: Duplicate Conflict (P2002)
      const dupReg = await request('POST', '/api/v1/auth/register', {
        body: {
          fullName: 'Duplicate User',
          phone: newPhone,
          password: 'password123',
          role: 'FARMER',
        },
      });
      assert(dupReg.status === 409, 'Registering duplicate phone returns 409 Conflict');

      // 2.8 Get Current Profile (Me)
      const meRes = await request('GET', '/api/v1/auth/me', { token: farmerToken });
      assert(meRes.status === 200, 'GET /api/v1/auth/me returns 200 OK');
      assert(meRes.data.data.fullName === 'Ramesh Patil', 'Authenticated user identity verified');

      // 2.9 Unauthorized Me without Token
      const noTokenRes = await request('GET', '/api/v1/auth/me');
      assert(noTokenRes.status === 401, 'GET /api/v1/auth/me without token returns 401 Unauthorized');

      // 2.10 Update Preferred Language
      const langRes = await request('PATCH', '/api/v1/auth/language', {
        body: { language: 'TE' },
        token: farmerToken,
      });
      assert(langRes.status === 200, 'PATCH /api/v1/auth/language returns 200 OK');
      assert(langRes.data.data.preferredLanguage === 'TE', 'Language preference set to TE');

      // 2.11 Refresh Token
      const refreshRes = await request('POST', '/api/v1/auth/refresh', {
        body: { refreshToken: loginRes.data.data.tokens.refreshToken },
      });
      assert(refreshRes.status === 200, 'POST /api/v1/auth/refresh returns 200 with new tokens');

      // 2.12 Invalid Refresh Token
      const badRefresh = await request('POST', '/api/v1/auth/refresh', {
        body: { refreshToken: 'invalid.token.here' },
      });
      assert(badRefresh.status === 401, 'POST /api/v1/auth/refresh with invalid token returns 401');

      // 2.13 Logout
      const logoutRes = await request('POST', '/api/v1/auth/logout');
      assert(logoutRes.status === 200, 'POST /api/v1/auth/logout returns 200 OK');
    }

    // -------------------------------------------------------------
    // 3. FARMER DISCOVERY & PRICING ENGINE
    // -------------------------------------------------------------
    console.log('\n📦 3. FARMER DISCOVERY & PRICING ENGINE TESTS');
    {
      // 3.1 Market Ticker
      const tickerRes = await request('GET', '/api/v1/farmer/ticker');
      assert(tickerRes.status === 200, 'GET /api/v1/farmer/ticker returns 200 OK');
      assert(Array.isArray(tickerRes.data.data.prices), 'Ticker returns prices array');
      assert(tickerRes.data.data.prices.length >= 5, 'Ticker includes 5 standard commodities');

      // 3.2 7-Day Trend & Advisory: Success
      const trendRes = await request('GET', '/api/v1/farmer/trend/tomato');
      assert(trendRes.status === 200, 'GET /api/v1/farmer/trend/tomato returns 200 OK');
      assert(trendRes.data.data.trendSeries.length === 7, 'Returns 7-day sparkline points');
      assert(trendRes.data.data.recommendation.key, 'Returns recommendation key (e.g. goodTimeToSell)');

      // 3.3 7-Day Trend: Non-existent Crop
      const badTrend = await request('GET', '/api/v1/farmer/trend/unknown-crop-xyz');
      assert(badTrend.status === 404, 'GET /api/v1/farmer/trend with unknown crop returns 404');

      // 3.4 Best Buyers Net Return Discovery: Success
      const calcRes = await request('POST', '/api/v1/farmer/discover-buyers', {
        body: {
          cropSlug: 'tomato',
          quantity: 500,
          unit: 'KG',
          location: 'warangal',
          qualityGrade: 'GRADE_A',
        },
      });
      assert(calcRes.status === 200, 'POST /api/v1/farmer/discover-buyers returns 200 OK');
      assert(calcRes.data.data.rankedBuyers.length >= 2, 'Returns ranked buyers');
      assert(calcRes.data.data.rankedBuyers[0].isBestReturn === true, 'Top buyer is flagged as isBestReturn: true');

      const topBuyer = calcRes.data.data.rankedBuyers[0];
      assert(topBuyer.breakdown.grossAmount > 0, 'Gross amount calculated');
      assert(topBuyer.breakdown.transportCost >= 0, 'Transport cost calculated');
      assert(topBuyer.breakdown.marketFee >= 0, 'Market fee calculated');
      assert(topBuyer.breakdown.handlingCost >= 0, 'Handling cost calculated');
      assert(topBuyer.breakdown.netTakeHome > 0, 'Net return calculated and positive');
      assert(
        topBuyer.breakdown.netTakeHome ===
          topBuyer.breakdown.grossAmount -
            topBuyer.breakdown.transportCost -
            topBuyer.breakdown.marketFee -
            topBuyer.breakdown.handlingCost,
        'Arithmetic integrity: netTakeHome == gross - transport - fee - handling'
      );

      // 3.5 Best Buyers: Invalid Input (Negative Quantity)
      const invalidCalc = await request('POST', '/api/v1/farmer/discover-buyers', {
        body: { cropSlug: 'tomato', quantity: -50 },
      });
      assert(invalidCalc.status === 400, 'Discover buyers with negative quantity returns 400 Bad Request');
    }

    // -------------------------------------------------------------
    // 4. BUYER PORTAL
    // -------------------------------------------------------------
    console.log('\n📦 4. BUYER PORTAL TESTS');
    {
      // 4.1 Buyer Stats (Authorized as Buyer)
      const statsRes = await request('GET', '/api/v1/buyer/stats', { token: buyerToken });
      assert(statsRes.status === 200, 'GET /api/v1/buyer/stats with Buyer token returns 200 OK');
      assert(statsRes.data.data.activeListingsNearYou > 0, 'Returns active listings metric');

      // 4.2 Buyer Stats (Forbidden for Farmer)
      const farmerStats = await request('GET', '/api/v1/buyer/stats', { token: farmerToken });
      assert(farmerStats.status === 403, 'GET /api/v1/buyer/stats with Farmer token returns 403 Forbidden');

      // 4.3 Buyer Listings Feed
      const listingsRes = await request('GET', '/api/v1/buyer/listings', { token: buyerToken });
      assert(listingsRes.status === 200, 'GET /api/v1/buyer/listings returns 200 OK');
      assert(Array.isArray(listingsRes.data.data), 'Returns listings array');

      // 4.4 Inquire Farmer
      const inqRes = await request('POST', '/api/v1/buyer/inquire', {
        body: { farmerId: sampleFarmerId, cropName: 'Tomato', message: 'Interested in 500kg lot.' },
        token: buyerToken,
      });
      assert(inqRes.status === 201, 'POST /api/v1/buyer/inquire returns 201 Created');
      assert(inqRes.data.data.status === 'SENT', 'Inquiry lead status is SENT');

      // 4.5 Inquire Non-existent Farmer
      const badInq = await request('POST', '/api/v1/buyer/inquire', {
        body: { farmerId: '00000000-0000-0000-0000-000000000000', message: 'Hi' },
        token: buyerToken,
      });
      assert(badInq.status === 404, 'Inquiring non-existent farmer returns 404 Not Found');
    }

    // -------------------------------------------------------------
    // 5. PRODUCTS & CATEGORIES
    // -------------------------------------------------------------
    console.log('\n📦 5. PRODUCTS & CATEGORIES TESTS');
    {
      // 5.1 Get all categories
      const catRes = await request('GET', '/api/v1/products/categories');
      assert(catRes.status === 200, 'GET /api/v1/products/categories returns 200 OK');
      assert(catRes.data.data.length >= 4, 'Includes standard categories');

      // 5.2 Get all products
      const prodRes = await request('GET', '/api/v1/products');
      assert(prodRes.status === 200, 'GET /api/v1/products returns 200 OK');
      assert(prodRes.data.data.length >= 5, 'Includes 5 commodities');
      sampleProductId = prodRes.data.data[0].id;

      // 5.3 Filter by category
      const filterCat = await request('GET', '/api/v1/products?category=vegetables');
      assert(filterCat.status === 200, 'Filter products by category returns 200 OK');

      // 5.4 Search by query
      const searchRes = await request('GET', '/api/v1/products?search=tomato');
      assert(searchRes.status === 200, 'Search products by query returns 200 OK');
      assert(searchRes.data.data.some((p) => p.slug === 'tomato'), 'Search result contains tomato');

      // 5.5 Get Product by ID or Slug
      const singleProd = await request('GET', '/api/v1/products/tomato');
      assert(singleProd.status === 200, 'GET /api/v1/products/tomato returns 200 OK');
      assert(singleProd.data.data.name === 'Tomato', 'Product name matches');

      // 5.6 Get Non-existent Product
      const missingProd = await request('GET', '/api/v1/products/non-existent-slug');
      assert(missingProd.status === 404, 'GET non-existent product returns 404 Not Found');

      // 5.7 Create Product as Admin
      const newProdSlug = `crop-${Date.now()}`;
      const createProd = await request('POST', '/api/v1/products', {
        body: {
          name: 'Chilli',
          slug: newProdSlug,
          icon: '🌶️',
          basePrice: 85.0,
          categoryId: catRes.data.data[0].id,
        },
        token: adminToken,
      });
      assert(createProd.status === 201, 'POST /api/v1/products with Admin token returns 201 Created');

      // 5.8 Create Product as Farmer (Forbidden)
      const unauthCreate = await request('POST', '/api/v1/products', {
        body: { name: 'Unauthorized Crop', slug: 'unauth' },
        token: farmerToken,
      });
      assert(unauthCreate.status === 403, 'POST /api/v1/products with Farmer token returns 403 Forbidden');

      // 5.9 Update Product as Admin
      const updateProd = await request('PUT', `/api/v1/products/${createProd.data.data.id}`, {
        body: { basePrice: 90.0 },
        token: adminToken,
      });
      assert(updateProd.status === 200, 'PUT /api/v1/products/:id updates price successfully');

      // 5.10 Delete Product as Admin
      const delProd = await request('DELETE', `/api/v1/products/${createProd.data.data.id}`, {
        token: adminToken,
      });
      assert(delProd.status === 200, 'DELETE /api/v1/products/:id returns 200 OK');
    }

    // -------------------------------------------------------------
    // 6. CART (B2B TRADE LOT STAGING)
    // -------------------------------------------------------------
    console.log('\n📦 6. CART & CART ITEMS TESTS');
    {
      // 6.1 Get Cart
      const cartRes = await request('GET', '/api/v1/cart', { token: farmerToken });
      assert(cartRes.status === 200, 'GET /api/v1/cart returns 200 OK');

      // 6.2 Add Item to Cart
      const addItemRes = await request('POST', '/api/v1/cart/items', {
        body: {
          productId: sampleProductId,
          quantity: 400,
          unit: 'KG',
          qualityGrade: 'GRADE_A',
          targetPricePerKg: 19.5,
        },
        token: farmerToken,
      });
      assert(addItemRes.status === 201, 'POST /api/v1/cart/items returns 201 Created');
      sampleCartItemId = addItemRes.data.data.id;

      // 6.3 Update Cart Item
      const updateItemRes = await request('PATCH', `/api/v1/cart/items/${sampleCartItemId}`, {
        body: { quantity: 600 },
        token: farmerToken,
      });
      assert(updateItemRes.status === 200, 'PATCH /api/v1/cart/items/:id updates quantity to 600');
      assert(Number(updateItemRes.data.data.quantity) === 600, 'Quantity updated');

      // 6.4 Remove Cart Item
      const removeItemRes = await request('DELETE', `/api/v1/cart/items/${sampleCartItemId}`, {
        token: farmerToken,
      });
      assert(removeItemRes.status === 200, 'DELETE /api/v1/cart/items/:id returns 200 OK');

      // 6.5 Clear Cart
      const clearRes = await request('DELETE', '/api/v1/cart', { token: farmerToken });
      assert(clearRes.status === 200, 'DELETE /api/v1/cart clears cart');
    }

    // -------------------------------------------------------------
    // 7. ORDERS & 7-STAGE DEAL LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n📦 7. ORDERS & 7-STAGE DEAL LIFECYCLE TESTS');
    {
      // 7.1 Create Deal Order (Stage 1: OFFER_SENT)
      const orderCreate = await request('POST', '/api/v1/orders', {
        body: {
          buyerId: sampleBuyerId,
          productId: sampleProductId,
          quantity: 500,
          unit: 'KG',
          qualityGrade: 'GRADE_A',
          agreedPricePerKg: 18.9,
          distanceKm: 22,
        },
        token: farmerToken,
      });
      assert(orderCreate.status === 201, 'POST /api/v1/orders creates deal order (201 Created)');
      sampleOrderId = orderCreate.data.data.order.id;
      assert(orderCreate.data.data.order.dealStage === 'OFFER_SENT', 'Initial deal stage is OFFER_SENT');
      assert(orderCreate.data.data.order.netAmount > 0, 'Net amount is stored');

      // 7.2 Get Order Details
      const getOrder = await request('GET', `/api/v1/orders/${sampleOrderId}`, { token: farmerToken });
      assert(getOrder.status === 200, 'GET /api/v1/orders/:id returns order details');
      assert(getOrder.data.data.lifecycle.allStages.length === 7, 'Lifecycle contains 7 stages');

      // 7.3 Advance Deal Stage: Stage 0 -> 1 (BUYER_ACCEPTED)
      const advance1 = await request('PATCH', `/api/v1/orders/${sampleOrderId}/advance`, {
        token: buyerToken,
      });
      assert(advance1.status === 200, 'Advance Stage 0 -> 1 returns 200 OK');
      assert(advance1.data.data.currentStage === 'BUYER_ACCEPTED', 'Transitioned to BUYER_ACCEPTED');

      // 7.4 Advance Deal Stage: Stage 1 -> 2 (DEAL_CONFIRMED)
      const advance2 = await request('PATCH', `/api/v1/orders/${sampleOrderId}/advance`, {
        token: farmerToken,
      });
      assert(advance2.status === 200, 'Advance Stage 1 -> 2 returns 200 OK');
      assert(advance2.data.data.currentStage === 'DEAL_CONFIRMED', 'Transitioned to DEAL_CONFIRMED');

      // 7.5 Advance through remaining stages to PAID (Stage 5)
      await request('PATCH', `/api/v1/orders/${sampleOrderId}/advance`, { token: farmerToken }); // 3. DISPATCHED
      await request('PATCH', `/api/v1/orders/${sampleOrderId}/advance`, { token: buyerToken }); // 4. DELIVERED
      const advance5 = await request('PATCH', `/api/v1/orders/${sampleOrderId}/advance`, { token: buyerToken }); // 5. PAID
      assert(advance5.data.data.currentStage === 'PAID', 'Transitioned through delivery to PAID');

      // 7.6 List User Orders
      const myOrders = await request('GET', '/api/v1/orders', { token: farmerToken });
      assert(myOrders.status === 200, 'GET /api/v1/orders lists user orders');
      assert(myOrders.data.data.length >= 1, 'Contains user orders');
    }

    // -------------------------------------------------------------
    // 8. ADDRESSES
    // -------------------------------------------------------------
    console.log('\n📦 8. ADDRESSES TESTS');
    {
      // 8.1 Create Address
      const addAddr = await request('POST', '/api/v1/addresses', {
        body: {
          title: 'Secondary Farm Plot',
          village: 'ReddyPalem',
          mandal: 'Hanamkonda',
          district: 'Warangal',
          state: 'Telangana',
          pincode: '506001',
          isDefault: false,
        },
        token: farmerToken,
      });
      assert(addAddr.status === 201, 'POST /api/v1/addresses returns 201 Created');
      sampleAddressId = addAddr.data.data.id;

      // 8.2 Get Addresses
      const getAddrs = await request('GET', '/api/v1/addresses', { token: farmerToken });
      assert(getAddrs.status === 200, 'GET /api/v1/addresses returns 200 OK');
      assert(getAddrs.data.data.length >= 1, 'Returns address list');

      // 8.3 Update Address
      const updateAddr = await request('PUT', `/api/v1/addresses/${sampleAddressId}`, {
        body: { title: 'Updated Farm Plot' },
        token: farmerToken,
      });
      assert(updateAddr.status === 200, 'PUT /api/v1/addresses/:id updates title');

      // 8.4 Delete Address
      const delAddr = await request('DELETE', `/api/v1/addresses/${sampleAddressId}`, {
        token: farmerToken,
      });
      assert(delAddr.status === 200, 'DELETE /api/v1/addresses/:id deletes address');
    }

    // -------------------------------------------------------------
    // 9. REVIEWS & RATINGS (STAGE 7)
    // -------------------------------------------------------------
    console.log('\n📦 9. REVIEWS & STAGE 7 RATINGS TESTS');
    {
      // 9.1 Submit Review (Stage 7)
      const reviewRes = await request('POST', '/api/v1/reviews', {
        body: {
          orderId: sampleOrderId,
          rating: 5,
          comment: 'Fair price, quick delivery inspection, and immediate payment!',
        },
        token: farmerToken,
      });
      assert(reviewRes.status === 201, 'POST /api/v1/reviews returns 201 Created');
      assert(reviewRes.data.data.rating === 5, 'Rating is 5 stars');

      // 9.2 Duplicate Review (Conflict)
      const dupReview = await request('POST', '/api/v1/reviews', {
        body: { orderId: sampleOrderId, rating: 4 },
        token: farmerToken,
      });
      assert(dupReview.status === 409, 'Duplicate review on same order returns 409 Conflict');

      // 9.3 Invalid Rating (< 1 or > 5)
      const badRating = await request('POST', '/api/v1/reviews', {
        body: { orderId: '00000000-0000-0000-0000-000000000000', rating: 7 },
        token: farmerToken,
      });
      assert(badRating.status === 400, 'Rating > 5 returns 400 Bad Request');

      // 9.4 Get User Reviews
      const userReviews = await request('GET', '/api/v1/reviews/user', { token: buyerToken });
      assert(userReviews.status === 200, 'GET /api/v1/reviews/user returns 200 OK');
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`🎉 TEST EXECUTION FINISHED: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('=============================================================\n');
  } catch (error) {
    console.error('\n❌ Test execution encountered an error:', error);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
