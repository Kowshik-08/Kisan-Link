const bcrypt = require('bcryptjs');

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// In-memory data stores
let users = [];
let farmers = [];
let buyers = [];
let categories = [];
let products = [];
let carts = [];
let cartItems = [];
let orders = [];
let orderItems = [];
let addresses = [];
let reviews = [];

function resetMockDb() {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const hashedAdminPassword = bcrypt.hashSync('admin123', 10);

  // 1. Categories
  const catVegId = '11111111-1111-4111-a111-111111111111';
  const catOilId = '22222222-2222-4222-a222-222222222222';
  const catComId = '33333333-3333-4333-a333-333333333333';
  const catGrnId = '44444444-4444-4444-a444-444444444444';

  categories = [
    {
      id: catVegId,
      name: 'Perishable Vegetables',
      slug: 'vegetables',
      description: 'Horticulture vegetables',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: catOilId,
      name: 'Oilseeds',
      slug: 'oilseeds',
      description: 'Oilseed crops',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: catComId,
      name: 'Commercial & Fiber Crops',
      slug: 'commercial',
      description: 'Commercial fiber staples',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: catGrnId,
      name: 'Food Grains & Cereals',
      slug: 'grains',
      description: 'Staple grain crops',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 2. Products
  const prodTomatoId = '55555555-5555-4555-a555-555555555555';
  const prodOnionId = '66666666-6666-4666-a666-666666666666';
  const prodSoybeanId = '77777777-7777-4777-a777-777777777777';
  const prodCottonId = '88888888-8888-4888-a888-888888888888';
  const prodWheatId = '99999999-9999-4999-a999-999999999999';

  products = [
    {
      id: prodTomatoId,
      name: 'Tomato',
      slug: 'tomato',
      nameTe: 'టమాటా',
      nameHi: 'टमाटर',
      icon: '🍅',
      basePrice: 18.0,
      standardUnit: 'KG',
      priceTrend: [14.0, 15.0, 15.0, 17.0, 16.0, 18.0, 18.0],
      categoryId: catVegId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: prodOnionId,
      name: 'Onion',
      slug: 'onion',
      nameTe: 'ఉల్లిపాయ',
      nameHi: 'प्याज़',
      icon: '🧅',
      basePrice: 14.0,
      standardUnit: 'KG',
      priceTrend: [16.0, 15.0, 15.0, 14.0, 14.0, 13.0, 14.0],
      categoryId: catVegId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: prodSoybeanId,
      name: 'Soybean',
      slug: 'soybean',
      nameTe: 'సోయాబీన్',
      nameHi: 'सोयाबीन',
      icon: '🌱',
      basePrice: 44.0,
      standardUnit: 'KG',
      priceTrend: [41.0, 42.0, 43.0, 43.0, 44.0, 44.0, 44.0],
      categoryId: catOilId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: prodCottonId,
      name: 'Cotton',
      slug: 'cotton',
      nameTe: 'పత్తి',
      nameHi: 'कपास',
      icon: '🌾',
      basePrice: 62.0,
      standardUnit: 'KG',
      priceTrend: [58.0, 59.0, 60.0, 61.0, 61.0, 62.0, 62.0],
      categoryId: catComId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: prodWheatId,
      name: 'Wheat',
      slug: 'wheat',
      nameTe: 'గోధుమ',
      nameHi: 'गेहूं',
      icon: '🌿',
      basePrice: 24.0,
      standardUnit: 'KG',
      priceTrend: [25.0, 25.0, 24.0, 24.0, 24.0, 24.0, 24.0],
      categoryId: catGrnId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 3. Users & Roles
  const userFarmer1Id = 'aaaa1111-1111-4111-a111-111111111111';
  const userFarmer2Id = 'aaaa2222-2222-4222-a222-222222222222';
  const userBuyer1Id = 'bbbb1111-1111-4111-a111-111111111111';
  const userBuyer2Id = 'bbbb2222-2222-4222-a222-222222222222';
  const userAdminId = 'cccc1111-1111-4111-a111-111111111111';

  users = [
    {
      id: userFarmer1Id,
      phone: '9876543210',
      adminCode: null,
      fullName: 'Ramesh Patil',
      passwordHash: hashedPassword,
      role: 'FARMER',
      preferredLanguage: 'EN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: userFarmer2Id,
      phone: '9876543211',
      adminCode: null,
      fullName: 'Sunita Jadhav',
      passwordHash: hashedPassword,
      role: 'FARMER',
      preferredLanguage: 'TE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: userBuyer1Id,
      phone: '9123456780',
      adminCode: null,
      fullName: 'Warangal APMC Market',
      passwordHash: hashedPassword,
      role: 'BUYER',
      preferredLanguage: 'EN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: userBuyer2Id,
      phone: '9123456781',
      adminCode: null,
      fullName: 'Sahyadri Farmers FPO',
      passwordHash: hashedPassword,
      role: 'BUYER',
      preferredLanguage: 'EN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: userAdminId,
      phone: null,
      adminCode: 'ADMIN001',
      fullName: 'KisanLink Administrator',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      preferredLanguage: 'EN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const farmer1Id = 'dddd1111-1111-4111-a111-111111111111';
  const farmer2Id = 'dddd2222-2222-4222-a222-222222222222';
  farmers = [
    {
      id: farmer1Id,
      userId: userFarmer1Id,
      village: 'Narsampet',
      mandal: 'Narsampet',
      district: 'Warangal',
      state: 'Telangana',
      landSizeAcres: 4.5,
      upiId: 'rameshpatil@upi',
      bankAccountNumber: '123456789012',
      bankIfsc: 'SBIN0001234',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: farmer2Id,
      userId: userFarmer2Id,
      village: 'ReddyPalem',
      mandal: 'Hanamkonda',
      district: 'Warangal',
      state: 'Telangana',
      landSizeAcres: 3.0,
      upiId: 'sunitaj@upi',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Seed authentic harvest lots listed by farmers in the database
  const lotTomatoId = '1a1a1a1a-1111-4111-a111-111111111111';
  const lotOnionId = '2b2b2b2b-2222-4222-a222-222222222222';
  products.push(
    {
      id: lotTomatoId,
      name: 'Tomato',
      slug: `lot_${farmer1Id}_500_GRADE_A_seed1`,
      icon: '🍅',
      basePrice: 19.0,
      standardUnit: 'KG',
      priceTrend: [19.0],
      categoryId: catVegId,
      nameTe: farmer1Id,
      nameHi: '500|GRADE_A|Narsampet, Warangal',
      isActive: true,
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      id: lotOnionId,
      name: 'Onion',
      slug: `lot_${farmer2Id}_800_GRADE_A_seed2`,
      icon: '🧅',
      basePrice: 15.0,
      standardUnit: 'KG',
      priceTrend: [15.0],
      categoryId: catVegId,
      nameTe: farmer2Id,
      nameHi: '800|GRADE_A|ReddyPalem, Warangal',
      isActive: true,
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 7200000),
    }
  );

  const buyer1Id = 'eeee1111-1111-4111-a111-111111111111';
  const buyer2Id = 'eeee2222-2222-4222-a222-222222222222';
  buyers = [
    {
      id: buyer1Id,
      userId: userBuyer1Id,
      businessName: 'Warangal APMC Market',
      buyerType: 'MANDI',
      commissionRate: 0.06,
      priceMultiplier: 1.0,
      baseDistanceKm: 12,
      isVerified: true,
      ratingAverage: 4.6,
      totalDealsCount: 212,
      licenseNumber: 'APMC-WGL-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: buyer2Id,
      userId: userBuyer2Id,
      businessName: 'Sahyadri Farmers FPO',
      buyerType: 'FPO',
      commissionRate: 0.03,
      priceMultiplier: 1.05,
      baseDistanceKm: 22,
      isVerified: true,
      ratingAverage: 4.8,
      totalDealsCount: 340,
      licenseNumber: 'FPO-SYD-089',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 4. Addresses
  const addr1Id = 'ffff1111-1111-4111-a111-111111111111';
  addresses = [
    {
      id: addr1Id,
      userId: userFarmer1Id,
      title: 'Patil Farmstead',
      village: 'Narsampet',
      mandal: 'Narsampet',
      district: 'Warangal',
      state: 'Telangana',
      pincode: '506132',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 5. Carts
  carts = [
    { id: 'c1111111-1111-4111-a111-111111111111', userId: userFarmer1Id, createdAt: new Date(), updatedAt: new Date() },
    { id: 'c2222222-2222-4222-a222-222222222222', userId: userFarmer2Id, createdAt: new Date(), updatedAt: new Date() },
    { id: 'c3333333-3333-4333-a333-333333333333', userId: userBuyer1Id, createdAt: new Date(), updatedAt: new Date() },
  ];
  cartItems = [];

  // 6. Orders
  const order1Id = '00001111-1111-4111-a111-111111111111';
  orders = [
    {
      id: order1Id,
      orderNumber: 'KL-2026-9041',
      farmerId: farmer1Id,
      buyerId: buyer2Id,
      dealStage: 'OFFER_SENT',
      paymentStatus: 'PENDING',
      distanceKm: 22,
      grossAmount: 9450.0,
      transportCost: 231.0,
      marketFee: 284.0,
      handlingCost: 70.0,
      netAmount: 8865.0,
      pickupAddressId: addr1Id,
      deliveryAddressId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  orderItems = [
    {
      id: generateUuid(),
      orderId: order1Id,
      productId: prodTomatoId,
      quantity: 500,
      unit: 'KG',
      quantityInKg: 500,
      qualityGrade: 'GRADE_A',
      pricePerKg: 18.9,
      totalPrice: 9450.0,
      createdAt: new Date(),
    },
  ];

  reviews = [];
}

resetMockDb();

// Mock Prisma Client
const mockPrisma = {
  $connect: async () => true,
  $disconnect: async () => true,
  $transaction: async (fn) => {
    if (typeof fn === 'function') {
      return fn(mockPrisma);
    }
    return Promise.all(fn);
  },

  reset: resetMockDb,

  user: {
    findUnique: async ({ where, include }) => {
      const u = users.find((x) => (where.id && x.id === where.id) || (where.phone && x.phone === where.phone) || (where.adminCode && x.adminCode === where.adminCode));
      if (!u) return null;
      const res = { ...u };
      res.isActive = res.isActive !== false;
      if (include?.farmer) res.farmer = farmers.find((f) => f.userId === u.id) || null;
      if (include?.buyer) res.buyer = buyers.find((b) => b.userId === u.id) || null;
      return res;
    },
    findFirst: async ({ where, include }) => {
      const u = users.find((x) => {
        if (where.OR) {
          return where.OR.some((cond) => (cond.phone && x.phone === cond.phone) || (cond.adminCode && x.adminCode === cond.adminCode));
        }
        if (where.phone) return x.phone === where.phone;
        if (where.adminCode) return x.adminCode === where.adminCode;
        return false;
      });
      if (!u) return null;
      const res = { ...u };
      res.isActive = res.isActive !== false;
      if (include?.farmer) res.farmer = farmers.find((f) => f.userId === u.id) || null;
      if (include?.buyer) res.buyer = buyers.find((b) => b.userId === u.id) || null;
      return res;
    },
    create: async ({ data }) => {
      const id = data.id || generateUuid();
      const newUser = {
        id,
        isActive: data.isActive !== undefined ? data.isActive : true,
        role: data.role || 'FARMER',
        preferredLanguage: data.preferredLanguage || 'EN',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }) => {
      const idx = users.findIndex((x) => x.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      users[idx] = { ...users[idx], ...data, updatedAt: new Date() };
      return users[idx];
    },
    deleteMany: async () => {
      users = [];
      return { count: 0 };
    },
  },

  farmer: {
    findUnique: async ({ where, include }) => {
      const f = farmers.find((x) => (where.id && x.id === where.id) || (where.userId && x.userId === where.userId));
      if (!f) return null;
      const res = { ...f };
      if (include?.user) res.user = users.find((u) => u.id === f.userId);
      return res;
    },
    findFirst: async ({ where, include } = {}) => {
      let list = [...farmers];
      if (where?.userId) list = list.filter((f) => f.userId === where.userId);
      const f = list[0] || null;
      if (!f) return null;
      const res = { ...f };
      if (include?.user) res.user = users.find((u) => u.id === f.userId);
      return res;
    },
    findMany: async ({ include, take } = {}) => {
      let list = [...farmers];
      if (take) list = list.slice(0, take);
      return list.map((f) => {
        const res = { ...f };
        if (include?.user) res.user = users.find((u) => u.id === f.userId);
        return res;
      });
    },
    create: async ({ data }) => {
      const id = data.id || generateUuid();
      const f = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      farmers.push(f);
      return f;
    },
    count: async () => farmers.length,
    deleteMany: async () => {
      farmers = [];
      return { count: 0 };
    },
  },

  buyer: {
    findUnique: async ({ where, include }) => {
      const b = buyers.find((x) => (where.id && x.id === where.id) || (where.userId && x.userId === where.userId));
      if (!b) return null;
      const res = { ...b };
      if (include?.user) res.user = users.find((u) => u.id === b.userId);
      return res;
    },
    findFirst: async ({ where, include } = {}) => {
      let list = [...buyers];
      if (where?.userId) list = list.filter((b) => b.userId === where.userId);
      const b = list[0] || null;
      if (!b) return null;
      const res = { ...b };
      if (include?.user) res.user = users.find((u) => u.id === b.userId);
      return res;
    },
    findMany: async ({ include } = {}) => {
      return buyers.map((b) => {
        const res = { ...b };
        if (include?.user) res.user = users.find((u) => u.id === b.userId);
        return res;
      });
    },
    create: async ({ data }) => {
      const id = data.id || generateUuid();
      const b = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      buyers.push(b);
      return b;
    },
    update: async ({ where, data }) => {
      const idx = buyers.findIndex((x) => x.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      const updated = { ...buyers[idx], ...data };
      if (data.totalDealsCount && data.totalDealsCount.increment) {
        updated.totalDealsCount = buyers[idx].totalDealsCount + data.totalDealsCount.increment;
      }
      buyers[idx] = updated;
      return updated;
    },
    count: async () => buyers.length,
    deleteMany: async () => {
      buyers = [];
      return { count: 0 };
    },
  },

  category: {
    findMany: async ({ include } = {}) => {
      return categories.map((c) => {
        const res = { ...c };
        if (include?._count?.select?.products) {
          res._count = { products: products.filter((p) => p.categoryId === c.id).length };
        }
        return res;
      });
    },
    findUnique: async ({ where }) => {
      return categories.find((c) => (where.id && c.id === where.id) || (where.slug && c.slug === where.slug)) || null;
    },
    findFirst: async ({ where } = {}) => {
      return categories[0] || null;
    },
    create: async ({ data }) => {
      const id = data.id || generateUuid();
      const c = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      categories.push(c);
      return c;
    },
    deleteMany: async () => {
      categories = [];
      return { count: 0 };
    },
  },

  product: {
    findMany: async ({ where, include, orderBy } = {}) => {
      let list = [...products];
      if (where) {
        if (where.isActive !== undefined) list = list.filter((p) => p.isActive === where.isActive);
        if (where.nameTe !== undefined) {
          if (where.nameTe === null) list = list.filter((p) => !p.nameTe);
          else if (typeof where.nameTe === 'object' && where.nameTe.not !== undefined) {
            list = list.filter((p) => p.nameTe !== where.nameTe.not && p.nameTe !== null && p.nameTe !== undefined);
          } else {
            list = list.filter((p) => p.nameTe === where.nameTe);
          }
        }
        if (where.name) {
          const val = typeof where.name === 'object' ? where.name.equals : where.name;
          if (val) list = list.filter((p) => p.name.toLowerCase() === val.toLowerCase());
        }
        if (where.slug) {
          if (typeof where.slug === 'object') {
            if (where.slug.startsWith) list = list.filter((p) => p.slug && p.slug.startsWith(where.slug.startsWith));
            if (where.slug.not && where.slug.not.startsWith) list = list.filter((p) => !p.slug || !p.slug.startsWith(where.slug.not.startsWith));
          } else if (typeof where.slug === 'string') {
            list = list.filter((p) => p.slug === where.slug);
          }
        }
        if (where.category) {
          const catCondition = where.category.is ? where.category.is.OR : where.category.OR;
          if (catCondition) {
            const cat = categories.find((c) => catCondition.some((cond) => (cond.slug && c.slug === cond.slug) || (cond.id && c.id === cond.id)));
            list = list.filter((p) => cat && p.categoryId === cat.id);
          }
        }
        if (where.OR) {
          list = list.filter((p) =>
            where.OR.some(
              (cond) =>
                (cond.name?.contains && p.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
                (cond.slug?.contains && p.slug.toLowerCase().includes(cond.slug.contains.toLowerCase())) ||
                (cond.nameTe?.contains && p.nameTe && p.nameTe.includes(cond.nameTe.contains)) ||
                (cond.nameHi?.contains && p.nameHi && p.nameHi.includes(cond.nameHi.contains))
            )
          );
        }
        if (where.basePrice) {
          if (where.basePrice.gte !== undefined) list = list.filter((p) => Number(p.basePrice) >= where.basePrice.gte);
          if (where.basePrice.lte !== undefined) list = list.filter((p) => Number(p.basePrice) <= where.basePrice.lte);
        }
      }
      if (orderBy) {
        if (orderBy.createdAt === 'desc') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (orderBy.name === 'asc') list.sort((a, b) => a.name.localeCompare(b.name));
      }
      return list.map((p) => {
        const res = { ...p };
        if (include?.category) res.category = categories.find((c) => c.id === p.categoryId) || null;
        return res;
      });
    },
    count: async ({ where } = {}) => {
      const list = await mockPrisma.product.findMany({ where });
      return list.length;
    },
    findUnique: async ({ where, include }) => {
      const p = products.find((x) => (where.id && x.id === where.id) || (where.slug && x.slug === where.slug));
      if (!p) return null;
      const res = { ...p };
      if (include?.category) res.category = categories.find((c) => c.id === p.categoryId) || null;
      return res;
    },
    findFirst: async ({ where, include } = {}) => {
      const list = await mockPrisma.product.findMany({ where, include });
      return list[0] || null;
    },
    create: async ({ data, include }) => {
      const id = data.id || generateUuid();
      const p = {
        id,
        isActive: data.isActive !== undefined ? data.isActive : true,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      products.push(p);
      const res = { ...p };
      if (include?.category) res.category = categories.find((c) => c.id === p.categoryId) || null;
      return res;
    },
    update: async ({ where, data, include }) => {
      const idx = products.findIndex((x) => x.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      products[idx] = { ...products[idx], ...data, updatedAt: new Date() };
      const res = { ...products[idx] };
      if (include?.category) res.category = categories.find((c) => c.id === res.categoryId) || null;
      return res;
    },
    delete: async ({ where }) => {
      const idx = products.findIndex((x) => x.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      const removed = products.splice(idx, 1)[0];
      return removed;
    },
    deleteMany: async () => {
      products = [];
      return { count: 0 };
    },
  },

  cart: {
    findUnique: async ({ where, include }) => {
      const c = carts.find((x) => where.userId && x.userId === where.userId);
      if (!c) return null;
      const res = { ...c };
      if (include?.items) {
        res.items = cartItems
          .filter((it) => it.cartId === c.id)
          .map((it) => {
            const itemObj = { ...it };
            if (include.items.include?.product) {
              itemObj.product = products.find((p) => p.id === it.productId);
            }
            return itemObj;
          });
      }
      return res;
    },
    create: async ({ data, include }) => {
      const id = data.id || generateUuid();
      const c = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      carts.push(c);
      const res = { ...c, items: [] };
      return res;
    },
    deleteMany: async () => {
      carts = [];
      return { count: 0 };
    },
  },

  cartItem: {
    findUnique: async ({ where, include }) => {
      let it = null;
      if (where.cartId_productId_qualityGrade) {
        const { cartId, productId, qualityGrade } = where.cartId_productId_qualityGrade;
        it = cartItems.find((x) => x.cartId === cartId && x.productId === productId && x.qualityGrade === qualityGrade) || null;
      } else {
        it = cartItems.find((x) => x.id === where.id) || null;
      }
      if (!it) return null;
      const res = { ...it };
      if (include?.cart) {
        res.cart = carts.find((c) => c.id === it.cartId) || null;
      }
      if (include?.product) {
        res.product = products.find((p) => p.id === it.productId) || null;
      }
      return res;
    },
    create: async ({ data, include }) => {
      const id = data.id || generateUuid();
      const it = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      cartItems.push(it);
      const res = { ...it };
      if (include?.product) res.product = products.find((p) => p.id === it.productId);
      return res;
    },
    update: async ({ where, data, include }) => {
      const idx = cartItems.findIndex((x) => x.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      cartItems[idx] = { ...cartItems[idx], ...data, updatedAt: new Date() };
      const res = { ...cartItems[idx] };
      if (include?.product) res.product = products.find((p) => p.id === res.productId);
      return res;
    },
    delete: async ({ where }) => {
      const idx = cartItems.findIndex((x) => x.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      return cartItems.splice(idx, 1)[0];
    },
    deleteMany: async ({ where } = {}) => {
      if (where?.cartId) {
        cartItems = cartItems.filter((x) => x.cartId !== where.cartId);
      } else {
        cartItems = [];
      }
      return { count: 0 };
    },
  },

  order: {
    findUnique: async ({ where, include }) => {
      const o = orders.find((x) => (where.id && x.id === where.id) || (where.orderNumber && x.orderNumber === where.orderNumber));
      if (!o) return null;
      return hydrateOrder(o, include);
    },
    findMany: async ({ where, include } = {}) => {
      let list = [...orders];
      if (where) {
        if (where.farmerId) list = list.filter((o) => o.farmerId === where.farmerId);
        if (where.buyerId) list = list.filter((o) => o.buyerId === where.buyerId);
        if (where.dealStage) {
          if (where.dealStage.notIn) list = list.filter((o) => !where.dealStage.notIn.includes(o.dealStage));
          else list = list.filter((o) => o.dealStage === where.dealStage);
        }
      }
      return list.map((o) => hydrateOrder(o, include));
    },
    create: async ({ data, include }) => {
      const id = data.id || generateUuid();
      const { items, ...orderFields } = data;
      const o = { id, ...orderFields, createdAt: new Date(), updatedAt: new Date() };
      orders.push(o);

      if (items?.create) {
        items.create.forEach((it) => {
          orderItems.push({
            id: generateUuid(),
            orderId: id,
            ...it,
            createdAt: new Date(),
          });
        });
      }

      return hydrateOrder(o, include);
    },
    update: async ({ where, data, include }) => {
      const idx = orders.findIndex((x) => x.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      orders[idx] = { ...orders[idx], ...data, updatedAt: new Date() };
      return hydrateOrder(orders[idx], include);
    },
    count: async ({ where } = {}) => {
      if (!where) return orders.length;
      let list = [...orders];
      if (where.buyerId) list = list.filter((o) => o.buyerId === where.buyerId);
      if (where.dealStage) {
        if (where.dealStage.notIn) list = list.filter((o) => !where.dealStage.notIn.includes(o.dealStage));
        else list = list.filter((o) => o.dealStage === where.dealStage);
      }
      return list.length;
    },
    deleteMany: async () => {
      orders = [];
      return { count: 0 };
    },
  },

  orderItem: {
    deleteMany: async () => {
      orderItems = [];
      return { count: 0 };
    },
  },

  address: {
    findMany: async ({ where } = {}) => {
      let list = [...addresses];
      if (where?.userId) list = list.filter((a) => a.userId === where.userId);
      return list;
    },
    findUnique: async ({ where }) => {
      return addresses.find((a) => a.id === where.id) || null;
    },
    create: async ({ data }) => {
      const id = data.id || generateUuid();
      const a = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      addresses.push(a);
      return a;
    },
    update: async ({ where, data }) => {
      const idx = addresses.findIndex((a) => a.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      addresses[idx] = { ...addresses[idx], ...data, updatedAt: new Date() };
      return addresses[idx];
    },
    updateMany: async ({ where, data }) => {
      addresses.forEach((a) => {
        if (where.userId && a.userId === where.userId) {
          Object.assign(a, data);
        }
      });
      return { count: addresses.length };
    },
    delete: async ({ where }) => {
      const idx = addresses.findIndex((a) => a.id === where.id);
      if (idx === -1) throw { code: 'P2025' };
      return addresses.splice(idx, 1)[0];
    },
    deleteMany: async () => {
      addresses = [];
      return { count: 0 };
    },
  },

  review: {
    create: async ({ data }) => {
      const id = data.id || generateUuid();
      const r = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      reviews.push(r);
      return r;
    },
    findMany: async ({ where, include } = {}) => {
      let list = [...reviews];
      if (where?.revieweeId) list = list.filter((r) => r.revieweeId === where.revieweeId);
      return list.map((r) => {
        const res = { ...r };
        if (include?.reviewer) res.reviewer = users.find((u) => u.id === r.reviewerId);
        if (include?.order) res.order = orders.find((o) => o.id === r.orderId);
        return res;
      });
    },
    aggregate: async ({ where }) => {
      let list = [...reviews];
      if (where?.revieweeId) list = list.filter((r) => r.revieweeId === where.revieweeId);
      const count = list.length;
      const avg = count > 0 ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
      return { _avg: { rating: avg }, _count: { rating: count } };
    },
    deleteMany: async () => {
      reviews = [];
      return { count: 0 };
    },
  },
};

function hydrateOrder(o, include) {
  const res = { ...o };
  if (include?.farmer) {
    const f = farmers.find((x) => x.id === o.farmerId);
    res.farmer = f ? { ...f, user: users.find((u) => u.id === f.userId) } : null;
  }
  if (include?.buyer) {
    const b = buyers.find((x) => x.id === o.buyerId);
    res.buyer = b ? { ...b, user: users.find((u) => u.id === b.userId) } : null;
  }
  if (include?.items) {
    res.items = orderItems
      .filter((oi) => oi.orderId === o.id)
      .map((oi) => ({
        ...oi,
        product: products.find((p) => p.id === oi.productId),
      }));
  }
  if (include?.review) {
    res.review = reviews.find((r) => r.orderId === o.id) || null;
  }
  return res;
}

module.exports = mockPrisma;
